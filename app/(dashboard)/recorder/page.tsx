"use client";

import { useState } from "react";
import { Mic, Monitor, UploadCloud, ArrowLeft } from "lucide-react";
import { VoiceRecorder } from "@/components/recorder/VoiceRecorder";
import { MeetingRecorder } from "@/components/recorder/MeetingRecorder";
import { AudioUploader } from "@/components/recorder/AudioUploader";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

type Mode = "voice" | "meeting" | "upload" | null;

const MODES = [
  {
    id: "voice" as const,
    title: "Voice Record",
    desc: "Record directly from your microphone.",
    icon: Mic,
  },
  {
    id: "meeting" as const,
    title: "Meeting Record",
    desc: "Capture a browser tab with system audio.",
    icon: Monitor,
  },
  {
    id: "upload" as const,
    title: "Upload Audio",
    desc: "Transcribe an existing audio file.",
    icon: UploadCloud,
  },
];

export default function RecorderPage() {
  const [mode, setMode] = useState<Mode>(null);

  const activeMode = MODES.find((m) => m.id === mode);

  return (
    <div style={{ maxWidth: 620, margin: "0 auto" }}>
      <h1>Recorder</h1>
      <p style={{ color: "var(--color-text-2)", marginTop: 6 }}>
        Choose how you want to capture audio.
      </p>

      {!mode ? (
        <div
          style={{
            marginTop: 24,
            display: "grid",
            gap: 14,
          }}
        >
          {MODES.map((m) => {
            const Icon = m.icon;
            return (
              <button
                key={m.id}
                onClick={() => setMode(m.id)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 16,
                  textAlign: "left",
                  padding: 20,
                  borderRadius: 12,
                  border: "1px solid var(--color-border-light)",
                  background: "var(--color-white)",
                  color: "inherit",
                  transition: "transform 0.15s ease, box-shadow 0.15s ease",
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.transform = "translateY(-2px)";
                  e.currentTarget.style.boxShadow =
                    "0 4px 16px rgba(0,0,0,0.07)";
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.transform = "translateY(0)";
                  e.currentTarget.style.boxShadow = "none";
                }}
              >
                <div
                  style={{
                    width: 48,
                    height: 48,
                    flexShrink: 0,
                    borderRadius: 12,
                    background: "var(--color-primary)",
                    color: "#fff",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Icon size={22} />
                </div>
                <div>
                  <div style={{ fontWeight: 500, fontSize: "1rem" }}>
                    {m.title}
                  </div>
                  <div
                    style={{
                      fontSize: "0.8125rem",
                      color: "var(--color-text-2)",
                      marginTop: 2,
                    }}
                  >
                    {m.desc}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      ) : (
        <div style={{ marginTop: 20 }}>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setMode(null)}
            style={{ marginBottom: 14, paddingLeft: 0 }}
          >
            <ArrowLeft size={16} /> Back
          </Button>
          <Card>
            <div style={{ padding: 24 }}>
              <h2 style={{ fontSize: "1.25rem", marginBottom: 4 }}>
                {activeMode?.title}
              </h2>
              <p
                style={{
                  fontSize: "0.8125rem",
                  color: "var(--color-text-3)",
                  marginBottom: 18,
                }}
              >
                {activeMode?.desc}
              </p>
              {mode === "voice" && <VoiceRecorder />}
              {mode === "meeting" && <MeetingRecorder />}
              {mode === "upload" && <AudioUploader />}
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
