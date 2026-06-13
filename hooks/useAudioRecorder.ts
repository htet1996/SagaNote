"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export type RecorderStatus = "idle" | "recording" | "paused" | "stopped";

interface UseAudioRecorderOptions {
  // "mic" uses getUserMedia; "screen" uses getDisplayMedia (tab/system audio)
  source?: "mic" | "screen";
}

interface UseAudioRecorderReturn {
  status: RecorderStatus;
  seconds: number;
  audioBlob: Blob | null;
  audioUrl: string | null;
  // Live amplitude levels (0..1) for the waveform visualizer — 20 bars
  levels: number[];
  error: string | null;
  start: () => Promise<void>;
  pause: () => void;
  resume: () => void;
  stop: () => void;
  reset: () => void;
}

const BAR_COUNT = 20;

/**
 * Reusable audio recorder hook backed by MediaRecorder + Web Audio API.
 * Provides a live waveform (levels[]), a timer, and the final Blob.
 */
export function useAudioRecorder(
  options: UseAudioRecorderOptions = {}
): UseAudioRecorderReturn {
  const { source = "mic" } = options;

  const [status, setStatus] = useState<RecorderStatus>("idle");
  const [seconds, setSeconds] = useState(0);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [levels, setLevels] = useState<number[]>(Array(BAR_COUNT).fill(0));
  const [error, setError] = useState<string | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Web Audio for visualization
  const audioCtxRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const rafRef = useRef<number | null>(null);

  const clearTimer = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

  const stopVisualizer = useCallback(() => {
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    setLevels(Array(BAR_COUNT).fill(0));
  }, []);

  const cleanupStream = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    if (audioCtxRef.current && audioCtxRef.current.state !== "closed") {
      audioCtxRef.current.close().catch(() => {});
    }
    audioCtxRef.current = null;
    analyserRef.current = null;
  }, []);

  const runVisualizer = useCallback(() => {
    const analyser = analyserRef.current;
    if (!analyser) return;
    const data = new Uint8Array(analyser.frequencyBinCount);

    const tick = () => {
      analyser.getByteFrequencyData(data);
      const step = Math.floor(data.length / BAR_COUNT) || 1;
      const next: number[] = [];
      for (let i = 0; i < BAR_COUNT; i++) {
        let sum = 0;
        for (let j = 0; j < step; j++) {
          sum += data[i * step + j] || 0;
        }
        const avg = sum / step / 255; // normalize 0..1
        next.push(Math.min(1, avg * 1.4));
      }
      setLevels(next);
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
  }, []);

  const start = useCallback(async () => {
    setError(null);
    chunksRef.current = [];
    setAudioBlob(null);
    setAudioUrl(null);
    setSeconds(0);

    try {
      let stream: MediaStream;
      if (source === "screen") {
        // Capture tab/system audio. Video is required by the API but we only keep audio.
        stream = await navigator.mediaDevices.getDisplayMedia({
          video: true,
          audio: true,
        });
        // If the user didn't share audio, fail clearly.
        if (stream.getAudioTracks().length === 0) {
          stream.getTracks().forEach((t) => t.stop());
          throw new Error(
            "No audio track was shared. Please enable 'Share tab audio'."
          );
        }
      } else {
        stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      }

      streamRef.current = stream;

      // Pick a supported mime type
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
        const blob = new Blob(chunksRef.current, {
          type: mimeType || "audio/webm",
        });
        setAudioBlob(blob);
        setAudioUrl(URL.createObjectURL(blob));
        setStatus("stopped");
        clearTimer();
        stopVisualizer();
        cleanupStream();
      };

      recorder.start(250);

      // Set up analyser for the live waveform
      const audioCtx = new AudioContext();
      audioCtxRef.current = audioCtx;
      const sourceNode = audioCtx.createMediaStreamSource(stream);
      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 64;
      sourceNode.connect(analyser);
      analyserRef.current = analyser;
      runVisualizer();

      setStatus("recording");
      timerRef.current = setInterval(() => {
        setSeconds((s) => s + 1);
      }, 1000);

      // If the user stops screen-share from the browser UI, end the recording.
      if (source === "screen") {
        stream.getVideoTracks()[0]?.addEventListener("ended", () => {
          if (mediaRecorderRef.current?.state !== "inactive") {
            mediaRecorderRef.current?.stop();
          }
        });
      }
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Could not start recording";
      setError(message);
      setStatus("idle");
      cleanupStream();
    }
  }, [source, runVisualizer, stopVisualizer, cleanupStream]);

  const pause = useCallback(() => {
    if (mediaRecorderRef.current?.state === "recording") {
      mediaRecorderRef.current.pause();
      setStatus("paused");
      clearTimer();
      stopVisualizer();
    }
  }, [stopVisualizer]);

  const resume = useCallback(() => {
    if (mediaRecorderRef.current?.state === "paused") {
      mediaRecorderRef.current.resume();
      setStatus("recording");
      timerRef.current = setInterval(() => setSeconds((s) => s + 1), 1000);
      runVisualizer();
    }
  }, [runVisualizer]);

  const stop = useCallback(() => {
    if (
      mediaRecorderRef.current &&
      mediaRecorderRef.current.state !== "inactive"
    ) {
      mediaRecorderRef.current.stop();
    }
  }, []);

  const reset = useCallback(() => {
    clearTimer();
    stopVisualizer();
    cleanupStream();
    if (audioUrl) URL.revokeObjectURL(audioUrl);
    mediaRecorderRef.current = null;
    chunksRef.current = [];
    setStatus("idle");
    setSeconds(0);
    setAudioBlob(null);
    setAudioUrl(null);
    setError(null);
  }, [audioUrl, stopVisualizer, cleanupStream]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      clearTimer();
      stopVisualizer();
      cleanupStream();
    };
  }, [stopVisualizer, cleanupStream]);

  return {
    status,
    seconds,
    audioBlob,
    audioUrl,
    levels,
    error,
    start,
    pause,
    resume,
    stop,
    reset,
  };
}
