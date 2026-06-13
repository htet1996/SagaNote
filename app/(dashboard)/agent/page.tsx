"use client";

import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { Mic, Square, PhoneOff, Volume2 } from "lucide-react";
import { useUserStore } from "@/lib/store";
import { Logo } from "@/components/shared/Logo";
import { AnimatedBars, Waveform } from "@/components/recorder/Waveform";
import { LoadingDots } from "@/components/ui/spinner";
import { Button } from "@/components/ui/button";
import { formatDuration } from "@/lib/utils";
import { AGENT_CREDIT_COST } from "@/lib/constants";
import type { AgentMessage, AgentState } from "@/types";

export default function AgentPage() {
  const { profile, adjustCredits } = useUserStore();

  const [active, setActive] = useState(false);
  const [state, setState] = useState<AgentState>("idle");
  const [messages, setMessages] = useState<AgentMessage[]>([]);
  const [levels, setLevels] = useState<number[]>(Array(20).fill(0));

  const credits = profile?.credits_balance ?? 0;

  // Refs for the recording machinery (kept across renders).
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const rafRef = useRef<number | null>(null);
  const playerRef = useRef<HTMLAudioElement | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  // Guards to avoid loops firing after the call ends.
  const activeRef = useRef(false);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, state]);

  const stopVisualizer = () => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = null;
    setLevels(Array(20).fill(0));
  };

  const cleanupStream = () => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    if (audioCtxRef.current && audioCtxRef.current.state !== "closed") {
      audioCtxRef.current.close().catch(() => {});
    }
    audioCtxRef.current = null;
    analyserRef.current = null;
  };

  const runVisualizer = () => {
    const analyser = analyserRef.current;
    if (!analyser) return;
    const data = new Uint8Array(analyser.frequencyBinCount);
    const tick = () => {
      analyser.getByteFrequencyData(data);
      const step = Math.floor(data.length / 20) || 1;
      const next: number[] = [];
      for (let i = 0; i < 20; i++) {
        let sum = 0;
        for (let j = 0; j < step; j++) sum += data[i * step + j] || 0;
        next.push(Math.min(1, (sum / step / 255) * 1.4));
      }
      setLevels(next);
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
  };

  // Start listening (records a single user turn until stopped).
  const startListening = async () => {
    if (!activeRef.current) return;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      chunksRef.current = [];

      const mimeType = MediaRecorder.isTypeSupported("audio/webm")
        ? "audio/webm"
        : "";
      const recorder = new MediaRecorder(
        stream,
        mimeType ? { mimeType } : undefined
      );
      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };
      recorder.onstop = () => {
        stopVisualizer();
        cleanupStream();
        const blob = new Blob(chunksRef.current, {
          type: mimeType || "audio/webm",
        });
        void sendTurn(blob);
      };

      recorder.start();

      // Visualizer
      const ctx = new AudioContext();
      audioCtxRef.current = ctx;
      const src = ctx.createMediaStreamSource(stream);
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 64;
      src.connect(analyser);
      analyserRef.current = analyser;
      runVisualizer();

      setState("listening");
    } catch {
      toast.error("Microphone access denied.");
      endCall();
    }
  };

  const stopListening = () => {
    if (mediaRecorderRef.current?.state === "recording") {
      mediaRecorderRef.current.stop();
    }
  };

  // Send the recorded turn to the API, then speak the response.
  const sendTurn = async (blob: Blob) => {
    if (!activeRef.current) return;
    setState("thinking");
    try {
      const form = new FormData();
      form.append("audio", blob, "turn.webm");

      const res = await fetch("/api/agent/voice", {
        method: "POST",
        body: form,
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Agent failed");
      }

      adjustCredits(-AGENT_CREDIT_COST);

      if (data.transcript) {
        setMessages((m) => [
          ...m,
          { id: `${Date.now()}-u`, role: "user", text: data.transcript },
        ]);
      }
      setMessages((m) => [
        ...m,
        { id: `${Date.now()}-a`, role: "assistant", text: data.response },
      ]);

      await speak(data.response);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong");
      // Resume listening so the user can retry.
      if (activeRef.current) void startListening();
    }
  };

  // Play the AI response via TTS, then auto-restart listening.
  const speak = async (text: string) => {
    if (!activeRef.current) return;
    setState("speaking");
    try {
      const res = await fetch("/api/tts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });
      if (!res.ok) throw new Error("TTS failed");
      const buf = await res.arrayBuffer();
      const url = URL.createObjectURL(
        new Blob([buf], { type: "audio/mpeg" })
      );

      const audio = new Audio(url);
      playerRef.current = audio;
      audio.onended = () => {
        URL.revokeObjectURL(url);
        if (activeRef.current) void startListening();
      };
      audio.onerror = () => {
        URL.revokeObjectURL(url);
        if (activeRef.current) void startListening();
      };
      await audio.play();
    } catch {
      // If TTS fails, just continue the loop.
      if (activeRef.current) void startListening();
    }
  };

  const startCall = () => {
    if (credits < AGENT_CREDIT_COST) {
      toast.error("Not enough credits to start a session.");
      return;
    }
    setActive(true);
    activeRef.current = true;
    setMessages([]);
    void startListening();
  };

  const endCall = () => {
    activeRef.current = false;
    setActive(false);
    setState("idle");
    stopListening();
    stopVisualizer();
    cleanupStream();
    if (playerRef.current) {
      playerRef.current.pause();
      playerRef.current = null;
    }
  };

  // Cleanup on unmount.
  useEffect(() => {
    return () => {
      activeRef.current = false;
      stopVisualizer();
      cleanupStream();
      playerRef.current?.pause();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const statusText: Record<AgentState, string> = {
    idle: "Ready",
    listening: "Listening…",
    thinking: "Thinking…",
    speaking: "Speaking…",
  };

  return (
    <div
      style={{
        maxWidth: 600,
        margin: "0 auto",
        height: "calc(100vh - 110px)",
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* Header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          paddingBottom: 14,
          borderBottom: "1px solid var(--color-border-light)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <Logo size={26} withText={false} className="logo-invert-dark" />
          <div>
            <div style={{ fontWeight: 600, fontSize: "0.9375rem" }}>
              Voice Agent
            </div>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                fontSize: "0.6875rem",
                color: "var(--color-text-3)",
              }}
            >
              <span
                style={{
                  width: 7,
                  height: 7,
                  borderRadius: "50%",
                  background: active ? "#16a34a" : "var(--color-text-3)",
                }}
              />
              {active ? statusText[state] : "Offline"}
            </div>
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ fontSize: "0.75rem", color: "var(--color-text-3)" }}>
            {formatDuration(credits)} left
          </span>
          {active && (
            <Button variant="danger" size="sm" onClick={endCall}>
              <PhoneOff size={14} /> End
            </Button>
          )}
        </div>
      </div>

      {/* Conversation */}
      <div
        className="thin-scrollbar"
        style={{
          flex: 1,
          overflowY: "auto",
          padding: "20px 4px",
          display: "flex",
          flexDirection: "column",
          gap: 12,
        }}
      >
        {messages.length === 0 && (
          <div
            style={{
              margin: "auto",
              textAlign: "center",
              color: "var(--color-text-3)",
              maxWidth: 320,
            }}
          >
            <Volume2 size={28} style={{ margin: "0 auto 12px" }} />
            <p style={{ fontSize: "0.875rem" }}>
              Tap the microphone to start a voice conversation. The assistant
              knows your recent notes and replies out loud.
            </p>
            <p style={{ fontSize: "0.75rem", marginTop: 8 }}>
              {AGENT_CREDIT_COST} credits per turn
            </p>
          </div>
        )}
        {messages.map((m) => (
          <div
            key={m.id}
            className="animate-fade-in"
            style={{
              alignSelf: m.role === "user" ? "flex-end" : "flex-start",
              maxWidth: "82%",
              padding: "10px 14px",
              borderRadius: 14,
              fontSize: "0.875rem",
              lineHeight: 1.55,
              background:
                m.role === "user"
                  ? "var(--color-primary)"
                  : "var(--color-secondary)",
              color: m.role === "user" ? "#fff" : "var(--color-text-1)",
              borderBottomRightRadius: m.role === "user" ? 4 : 14,
              borderBottomLeftRadius: m.role === "user" ? 14 : 4,
            }}
          >
            {m.text}
          </div>
        ))}
        {state === "thinking" && (
          <div
            style={{
              alignSelf: "flex-start",
              padding: "12px 16px",
              borderRadius: 14,
              background: "var(--color-secondary)",
              color: "var(--color-text-2)",
            }}
          >
            <LoadingDots />
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Visualizer + control */}
      <div
        style={{
          paddingTop: 16,
          borderTop: "1px solid var(--color-border-light)",
          textAlign: "center",
        }}
      >
        <div style={{ height: 48, marginBottom: 14 }}>
          {state === "listening" && <Waveform levels={levels} height={48} />}
          {state === "speaking" && <AnimatedBars height={48} />}
        </div>

        {!active ? (
          <button
            onClick={startCall}
            aria-label="Start conversation"
            className="animate-pulse-ring"
            style={{
              width: 76,
              height: 76,
              borderRadius: "50%",
              border: "none",
              background: "var(--color-primary)",
              color: "#fff",
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Mic size={28} />
          </button>
        ) : state === "listening" ? (
          <button
            onClick={stopListening}
            aria-label="Stop and send"
            className="animate-record-pulse"
            style={{
              width: 76,
              height: 76,
              borderRadius: "50%",
              border: "none",
              background: "#dc2626",
              color: "#fff",
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Square size={26} fill="#fff" />
          </button>
        ) : (
          <div
            style={{
              width: 76,
              height: 76,
              borderRadius: "50%",
              background: "var(--color-secondary)",
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              color: "var(--color-text-3)",
            }}
          >
            {state === "speaking" ? (
              <Volume2 size={26} className="animate-record-pulse" />
            ) : (
              <LoadingDots />
            )}
          </div>
        )}
        <p
          style={{
            marginTop: 12,
            fontSize: "0.75rem",
            color: "var(--color-text-3)",
          }}
        >
          {!active
            ? "Tap to start"
            : state === "listening"
              ? "Tap to send your message"
              : statusText[state]}
        </p>
      </div>
    </div>
  );
}
