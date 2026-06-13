"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Mic, Square, Pause, Play, Trash2, Save } from "lucide-react";
import { useAudioRecorder } from "@/hooks/useAudioRecorder";
import { useUserStore } from "@/lib/store";
import { Waveform } from "@/components/recorder/Waveform";
import { AiOptions } from "@/components/recorder/AiOptions";
import { Button } from "@/components/ui/button";
import { formatDuration } from "@/lib/utils";
import {
  uploadRecording,
  startTranscription,
} from "@/components/recorder/uploadHelpers";
import type { SavePreference } from "@/types";

export function VoiceRecorder() {
  const router = useRouter();
  const { profile, adjustCredits } = useUserStore();
  const recorder = useAudioRecorder({ source: "mic" });
  const [saving, setSaving] = useState(false);
  const [savePreference, setSavePreference] = useState<SavePreference>(
    profile?.preferred_language || "both"
  );
  const [generateMinutes, setGenerateMinutes] = useState(false);
  const [generateActions, setGenerateActions] = useState(false);

  const handleSave = async () => {
    if (!recorder.audioBlob) return;
    setSaving(true);
    try {
      toast.loading("Uploading recording…", { id: "save" });
      const { recordingId } = await uploadRecording({
        blob: recorder.audioBlob,
        durationSeconds: recorder.seconds,
        type: "voice",
      });

      toast.loading("Transcribing with AI…", { id: "save" });
      const result = await startTranscription({
        recordingId,
        savePreference,
        generateMinutes,
        generateActions,
      });

      adjustCredits(-(result.credits_used || 0));
      toast.success("Saved! Transcription ready.", { id: "save" });
      router.push(`/transcriptions/${result.transcription_id}`);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to save";
      toast.error(message, { id: "save" });
      setSaving(false);
    }
  };

  // ---------- Idle ----------
  if (recorder.status === "idle") {
    return (
      <div style={{ textAlign: "center", padding: "20px 0" }}>
        {recorder.error && (
          <p
            style={{
              color: "var(--color-text-2)",
              fontSize: "0.8125rem",
              marginBottom: 16,
            }}
          >
            {recorder.error}
          </p>
        )}
        <button
          onClick={recorder.start}
          aria-label="Start recording"
          className="animate-pulse-ring"
          style={{
            width: 120,
            height: 120,
            borderRadius: "50%",
            border: "none",
            background: "var(--color-primary)",
            color: "#fff",
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            margin: "0 auto",
          }}
        >
          <Mic size={42} />
        </button>
        <p style={{ marginTop: 24, color: "var(--color-text-2)" }}>
          Tap the microphone to start recording
        </p>
      </div>
    );
  }

  // ---------- Recording / Paused ----------
  if (recorder.status === "recording" || recorder.status === "paused") {
    const isPaused = recorder.status === "paused";
    return (
      <div style={{ textAlign: "center", padding: "16px 0" }}>
        <div
          style={{
            fontSize: "2.5rem",
            fontWeight: 600,
            fontVariantNumeric: "tabular-nums",
            letterSpacing: "-0.02em",
          }}
        >
          {formatDuration(recorder.seconds)}
        </div>
        <div
          style={{
            fontSize: "0.75rem",
            color: "var(--color-text-3)",
            marginTop: 4,
          }}
        >
          {isPaused ? "Paused" : "Recording…"}
        </div>

        <div style={{ margin: "28px 0" }}>
          <Waveform levels={recorder.levels} height={64} />
        </div>

        <div
          style={{
            display: "flex",
            gap: 12,
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <Button
            variant="outline"
            onClick={isPaused ? recorder.resume : recorder.pause}
          >
            {isPaused ? <Play size={16} /> : <Pause size={16} />}
            {isPaused ? "Resume" : "Pause"}
          </Button>
          <button
            onClick={recorder.stop}
            aria-label="Stop recording"
            className={isPaused ? "" : "animate-record-pulse"}
            style={{
              width: 64,
              height: 64,
              borderRadius: "50%",
              border: "none",
              background: "#dc2626",
              color: "#fff",
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Square size={22} fill="#fff" />
          </button>
          <div style={{ width: 96 }} />
        </div>
      </div>
    );
  }

  // ---------- Stopped (preview + save) ----------
  return (
    <div style={{ padding: "8px 0" }}>
      <div
        style={{
          fontSize: "0.8125rem",
          color: "var(--color-text-3)",
          marginBottom: 8,
        }}
      >
        Recording · {formatDuration(recorder.seconds)}
      </div>
      {recorder.audioUrl && (
        <audio
          controls
          src={recorder.audioUrl}
          style={{ width: "100%", marginBottom: 20 }}
        />
      )}

      <AiOptions
        savePreference={savePreference}
        setSavePreference={setSavePreference}
        generateMinutes={generateMinutes}
        setGenerateMinutes={setGenerateMinutes}
        generateActions={generateActions}
        setGenerateActions={setGenerateActions}
      />

      <div style={{ display: "flex", gap: 10, marginTop: 22 }}>
        <Button
          variant="outline"
          onClick={recorder.reset}
          disabled={saving}
        >
          <Trash2 size={16} /> Discard
        </Button>
        <Button onClick={handleSave} loading={saving} fullWidth>
          <Save size={16} /> Save & Transcribe
        </Button>
      </div>
    </div>
  );
}
