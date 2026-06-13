"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { UploadCloud, FileAudio, Trash2, Save } from "lucide-react";
import { useUserStore } from "@/lib/store";
import { AiOptions } from "@/components/recorder/AiOptions";
import { Button } from "@/components/ui/button";
import { formatBytes } from "@/lib/utils";
import {
  uploadRecording,
  startTranscription,
} from "@/components/recorder/uploadHelpers";
import type { SavePreference } from "@/types";

const ACCEPTED = [".mp3", ".mp4", ".wav", ".m4a", ".webm"];
const MAX_BYTES = 100 * 1024 * 1024; // 100MB

export function AudioUploader() {
  const router = useRouter();
  const { profile, adjustCredits } = useUserStore();
  const inputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [saving, setSaving] = useState(false);
  const [savePreference, setSavePreference] = useState<SavePreference>(
    profile?.preferred_language || "both"
  );
  const [generateMinutes, setGenerateMinutes] = useState(false);
  const [generateActions, setGenerateActions] = useState(false);

  const validateAndSet = (f: File) => {
    const ext = "." + (f.name.split(".").pop() || "").toLowerCase();
    if (!ACCEPTED.includes(ext)) {
      toast.error(`Unsupported file type. Accepted: ${ACCEPTED.join(", ")}`);
      return;
    }
    if (f.size > MAX_BYTES) {
      toast.error("File too large. Maximum size is 100MB.");
      return;
    }
    setFile(f);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const f = e.dataTransfer.files[0];
    if (f) validateAndSet(f);
  };

  // Estimate duration from the audio element so we can charge credits.
  const getDuration = (f: File): Promise<number> =>
    new Promise((resolve) => {
      const audio = document.createElement("audio");
      audio.preload = "metadata";
      audio.onloadedmetadata = () => {
        URL.revokeObjectURL(audio.src);
        resolve(Number.isFinite(audio.duration) ? audio.duration : 0);
      };
      audio.onerror = () => resolve(0);
      audio.src = URL.createObjectURL(f);
    });

  const handleSave = async () => {
    if (!file) return;
    setSaving(true);
    try {
      const duration = await getDuration(file);
      toast.loading("Uploading file…", { id: "save" });
      const ext = (file.name.split(".").pop() || "webm").toLowerCase();
      const { recordingId } = await uploadRecording({
        blob: file,
        durationSeconds: duration,
        type: "upload",
        ext,
      });

      toast.loading("Transcribing with AI…", { id: "save" });
      const result = await startTranscription({
        recordingId,
        savePreference,
        generateMinutes,
        generateActions,
      });

      adjustCredits(-(result.credits_used || 0));
      toast.success("Uploaded & transcribed!", { id: "save" });
      router.push(`/transcriptions/${result.transcription_id}`);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to save";
      toast.error(message, { id: "save" });
      setSaving(false);
    }
  };

  return (
    <div style={{ padding: "8px 0" }}>
      {!file ? (
        <div
          onClick={() => inputRef.current?.click()}
          onDragOver={(e) => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          style={{
            border: `2px dashed ${
              dragOver ? "var(--color-primary)" : "var(--color-border-light)"
            }`,
            borderRadius: 14,
            padding: "48px 20px",
            textAlign: "center",
            cursor: "pointer",
            background: dragOver ? "var(--color-secondary)" : "transparent",
            transition: "all 0.15s ease",
          }}
        >
          <UploadCloud
            size={36}
            style={{ color: "var(--color-text-3)", margin: "0 auto" }}
          />
          <p style={{ marginTop: 14, fontWeight: 500 }}>
            Drag & drop an audio file, or click to browse
          </p>
          <p
            style={{
              marginTop: 6,
              fontSize: "0.75rem",
              color: "var(--color-text-3)",
            }}
          >
            {ACCEPTED.join(", ")} · up to 100MB
          </p>
          <input
            ref={inputRef}
            type="file"
            accept={ACCEPTED.join(",")}
            hidden
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) validateAndSet(f);
            }}
          />
        </div>
      ) : (
        <>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
              padding: 14,
              borderRadius: 12,
              border: "1px solid var(--color-border-light)",
              marginBottom: 20,
            }}
          >
            <FileAudio size={22} style={{ flexShrink: 0 }} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div
                style={{
                  fontSize: "0.875rem",
                  fontWeight: 500,
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {file.name}
              </div>
              <div
                style={{ fontSize: "0.75rem", color: "var(--color-text-3)" }}
              >
                {formatBytes(file.size)}
              </div>
            </div>
            <button
              onClick={() => setFile(null)}
              disabled={saving}
              aria-label="Remove file"
              style={{
                background: "transparent",
                border: "none",
                color: "var(--color-text-3)",
                padding: 6,
              }}
            >
              <Trash2 size={16} />
            </button>
          </div>

          <AiOptions
            savePreference={savePreference}
            setSavePreference={setSavePreference}
            generateMinutes={generateMinutes}
            setGenerateMinutes={setGenerateMinutes}
            generateActions={generateActions}
            setGenerateActions={setGenerateActions}
          />

          <Button
            onClick={handleSave}
            loading={saving}
            fullWidth
            style={{ marginTop: 22 }}
          >
            <Save size={16} /> Upload & Transcribe
          </Button>
        </>
      )}
    </div>
  );
}
