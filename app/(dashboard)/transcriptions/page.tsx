"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Mic,
  Monitor,
  UploadCloud,
  RefreshCw,
  FileAudio,
  ArrowRight,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Spinner } from "@/components/ui/spinner";
import { formatDuration, timeAgo, truncate } from "@/lib/utils";
import type {
  RecordingType,
  TranscriptionWithRecording,
} from "@/types";

type Filter = "all" | RecordingType;

const FILTERS: { id: Filter; label: string }[] = [
  { id: "all", label: "All" },
  { id: "voice", label: "Voice" },
  { id: "meeting", label: "Meeting" },
  { id: "upload", label: "Upload" },
];

const TYPE_ICON: Record<RecordingType, typeof Mic> = {
  voice: Mic,
  meeting: Monitor,
  upload: UploadCloud,
};

const STATUS_LABEL: Record<string, string> = {
  pending: "Pending",
  processing: "Processing",
  done: "Done",
  failed: "Failed",
};

export default function TranscriptionsPage() {
  const router = useRouter();
  const [items, setItems] = useState<TranscriptionWithRecording[] | null>(null);
  const [filter, setFilter] = useState<Filter>("all");
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    const supabase = createClient();
    const { data } = await supabase
      .from("transcriptions")
      .select("*, recording:recordings(*)")
      .order("created_at", { ascending: false });
    setItems((data as TranscriptionWithRecording[]) || []);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const refresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  const filtered = (items || []).filter((t) => {
    if (filter === "all") return true;
    return t.recording?.recording_type === filter;
  });

  return (
    <div style={{ maxWidth: 820, margin: "0 auto" }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          gap: 12,
        }}
      >
        <div>
          <h1>Transcriptions</h1>
          <p style={{ color: "var(--color-text-2)", marginTop: 6 }}>
            All your transcribed recordings in one place.
          </p>
        </div>
        <button
          onClick={refresh}
          aria-label="Refresh"
          style={{
            height: 38,
            width: 38,
            borderRadius: 8,
            border: "1px solid var(--color-border-light)",
            background: "transparent",
            color: "inherit",
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}
        >
          <RefreshCw
            size={16}
            className={refreshing ? "animate-spin-slow" : ""}
          />
        </button>
      </div>

      {/* Filter pills */}
      <div style={{ display: "flex", gap: 8, marginTop: 20, flexWrap: "wrap" }}>
        {FILTERS.map((f) => {
          const active = filter === f.id;
          return (
            <button
              key={f.id}
              onClick={() => setFilter(f.id)}
              style={{
                height: 32,
                padding: "0 16px",
                borderRadius: 99,
                fontSize: "0.8125rem",
                fontWeight: 500,
                border: active
                  ? "1px solid var(--color-primary)"
                  : "1px solid var(--color-border-light)",
                background: active ? "var(--color-primary)" : "transparent",
                color: active ? "#fff" : "var(--color-text-2)",
              }}
            >
              {f.label}
            </button>
          );
        })}
      </div>

      {/* List */}
      <div style={{ marginTop: 22 }}>
        {items === null ? (
          <div style={{ padding: 50, textAlign: "center" }}>
            <Spinner />
          </div>
        ) : filtered.length === 0 ? (
          <div
            style={{
              padding: "50px 20px",
              textAlign: "center",
              border: "1px dashed var(--color-border-light)",
              borderRadius: 12,
            }}
          >
            <FileAudio
              size={28}
              style={{ color: "var(--color-text-3)", margin: "0 auto" }}
            />
            <p style={{ marginTop: 12, color: "var(--color-text-2)" }}>
              No transcriptions{filter !== "all" ? ` for "${filter}"` : ""} yet.
            </p>
            <button
              onClick={() => router.push("/recorder")}
              style={{
                marginTop: 12,
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                background: "transparent",
                border: "none",
                color: "var(--color-text-1)",
                fontWeight: 500,
                fontSize: "0.875rem",
              }}
            >
              Start recording <ArrowRight size={14} />
            </button>
          </div>
        ) : (
          <div style={{ display: "grid", gap: 10 }}>
            {filtered.map((t) => {
              const type = t.recording?.recording_type || "voice";
              const Icon = TYPE_ICON[type];
              const status = t.recording?.status || "done";
              const preview =
                t.english_text || t.burmese_text || t.summary || "Untitled";
              return (
                <button
                  key={t.id}
                  onClick={() => router.push(`/transcriptions/${t.id}`)}
                  style={{
                    display: "flex",
                    gap: 14,
                    textAlign: "left",
                    padding: 16,
                    borderRadius: 12,
                    border: "1px solid var(--color-border-light)",
                    background: "var(--color-white)",
                    color: "inherit",
                  }}
                  onMouseOver={(e) =>
                    (e.currentTarget.style.background = "var(--color-secondary)")
                  }
                  onMouseOut={(e) =>
                    (e.currentTarget.style.background = "var(--color-white)")
                  }
                >
                  <div
                    style={{
                      width: 38,
                      height: 38,
                      flexShrink: 0,
                      borderRadius: 10,
                      background: "var(--color-secondary)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <Icon size={17} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: "0.875rem", lineHeight: 1.5 }}>
                      {truncate(preview, 130)}
                    </p>
                    <div
                      style={{
                        display: "flex",
                        gap: 10,
                        alignItems: "center",
                        marginTop: 8,
                      }}
                    >
                      <Badge variant={status === "done" ? "solid" : "outline"}>
                        {STATUS_LABEL[status] || status}
                      </Badge>
                      {t.recording?.duration_seconds ? (
                        <span
                          style={{
                            fontSize: "0.6875rem",
                            color: "var(--color-text-3)",
                          }}
                        >
                          {formatDuration(t.recording.duration_seconds)}
                        </span>
                      ) : null}
                      <span
                        style={{
                          fontSize: "0.6875rem",
                          color: "var(--color-text-3)",
                        }}
                      >
                        {timeAgo(t.created_at)}
                      </span>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
