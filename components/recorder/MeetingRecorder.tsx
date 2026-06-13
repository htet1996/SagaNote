"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Monitor, Square, Trash2, Save } from "lucide-react";
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

export function MeetingRecorder() {
  const router = useRouter();
  const { profile, adjustCredits } = useUserStore();
  const recorder = useAudioRecorder({ source: "screen" });
  const [saving, setSaving] = useState(false);
  const [savePreference, setSavePreference] = useState<SavePreference>(
    profile?.preferred_language || "both"
  );
  // Meetings default to producing minutes + actions
  const [generateMinutes, setGenerateMinutes] = useState(true);
  const [generateActions, setGenerateActions] = useState(true);

  const handleSave = async () => {
    if (!recorder.audioBlob) return;
    setSaving(true);
    try {
      toast.loading("Uploading meeting…", { id: "save" });
      const { recordingId } = await uploadRecording({
        blob: recorder.audioBlob,
        durationSeconds: recorder.seconds,
        type: "meeting",
      });

      toast.loading("Transcribing with AI…", { id: "save" });
      const result = await startTranscription({
        recordingId,
        savePreference,
        generateMinutes,
        generateActions,
      });

      adjustCredits(-(result.credits_used || 0));
      toast.success("Meeting saved!", { id: "save" });
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
      <div style={{ textAlign: "center", padding: "12px 0" }}>
        <div
          style={{
            width: 72,
            height: 72,
            borderRadius: 16,
            background: "var(--color-secondary)",
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            marginBottom: 18,
          }}
        >
          <Monitor size={32} />
        </div>
        <p
          style={{
            color: "var(--color-text-2)",
            fontSize: "0.875rem",
            maxWidth: 380,
            margin: "0 auto 8px",
          }}
        >
          When prompted, choose the tab or screen you want to capture and{" "}
          <strong>enable &quot;Share tab audio&quot;</strong>. This is required
          to record meeting sound.
        </p>
        {recorder.error && (
          <p
            style={{
              color: "#dc2626",
              fontSize: "0.8125rem",
              margin: "10px 0",
            }}
          >
            {recorder.error}
          </p>
        )}
        <Button size="lg" onClick={recorder.start} style={{ marginTop: 14 }}>
          <Monitor size={16} /> Start Recording
        </Button>
      </div>
    );
  }

  // ---------- Recording ----------
  if (recorder.status === "recording" || recorder.status === "paused") {
    return (
      <div style={{ textAlign: "center", padding: "16px 0" }}>
        <div
          style={{
            fontSize: "2.5rem",
            fontWeight: 600,
            fontVariantNumeric: "tabular-nums",
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
          Capturing meeting audio…
        </div>
        <div style={{ margin: "28px 0" }}>
          <Waveform levels={recorder.levels} height={64} />
        </div>
        <button
          onClick={recorder.stop}
          aria-label="Stop recording"
          className="animate-record-pulse"
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
      </div>
    );
  }

  // ---------- Stopped (smart prompt + save) ----------
  return (
    <div style={{ padding: "8px 0" }}>
      <div
        style={{
          fontSize: "0.8125rem",
          color: "var(--color-text-3)",
          marginBottom: 8,
        }}
      >
        Meeting · {formatDuration(recorder.seconds)}
      </div>
      {recorder.audioUrl && (
        <audio
          controls
          src={recorder.audioUrl}
          style={{ width: "100%", marginBottom: 20 }}
        />
      )}

      <div
        style={{
          fontSize: "0.875rem",
          fontWeight: 500,
          marginBottom: 12,
        }}
      >
        What should we generate?
      </div>

      <AiOptions
        savePreference={savePreference}
        setSavePreference={setSavePreference}
        generateMinutes={generateMinutes}
        setGenerateMinutes={setGenerateMinutes}
        generateActions={generateActions}
        setGenerateActions={setGenerateActions}
      />

      <div style={{ display: "flex", gap: 10, marginTop: 22 }}>
        <Button variant="outline" onClick={recorder.reset} disabled={saving}>
          <Trash2 size={16} /> Discard
        </Button>
        <Button onClick={handleSave} loading={saving} fullWidth>
          <Save size={16} /> Save & Transcribe
        </Button>
      </div>
    </div>
  );
}
