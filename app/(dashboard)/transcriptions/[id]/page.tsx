"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  ArrowLeft,
  Check,
  Play,
  ExternalLink,
  Sparkles,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useUserStore } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FullPageLoader } from "@/components/ui/spinner";
import { startTranscription } from "@/components/recorder/uploadHelpers";
import { formatDuration, timeAgo } from "@/lib/utils";
import type { Recording, Transcription } from "@/types";

type Tab = "en" | "my" | "minutes" | "actions";

export default function TranscriptionDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { adjustCredits } = useUserStore();
  const id = params.id as string;

  const [transcription, setTranscription] = useState<Transcription | null>(null);
  const [recording, setRecording] = useState<Recording | null>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<Tab>("en");
  const [processing, setProcessing] = useState(false);
  const [checked, setChecked] = useState<Record<number, boolean>>({});

  const load = useCallback(async () => {
    const supabase = createClient();
    const { data: t } = await supabase
      .from("transcriptions")
      .select("*")
      .eq("id", id)
      .maybeSingle();

    if (t) {
      setTranscription(t as Transcription);
      const { data: r } = await supabase
        .from("recordings")
        .select("*")
        .eq("id", (t as Transcription).recording_id)
        .maybeSingle();
      setRecording(r as Recording);
      // default tab based on available content
      if ((t as Transcription).english_text) setTab("en");
      else if ((t as Transcription).burmese_text) setTab("my");
    }
    setLoading(false);
  }, [id]);

  useEffect(() => {
    void load();
  }, [load]);

  const reprocess = async () => {
    if (!transcription) return;
    setProcessing(true);
    try {
      toast.loading("Transcribing…", { id: "reprocess" });
      const result = await startTranscription({
        recordingId: transcription.recording_id,
        savePreference: transcription.save_preference,
        generateMinutes: true,
        generateActions: true,
      });
      adjustCredits(-(result.credits_used || 0));
      toast.success("Done!", { id: "reprocess" });
      router.push(`/transcriptions/${result.transcription_id}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed", {
        id: "reprocess",
      });
      setProcessing(false);
    }
  };

  if (loading) return <FullPageLoader label="Loading transcription…" />;

  if (!transcription) {
    return (
      <div style={{ maxWidth: 720, margin: "0 auto", textAlign: "center", paddingTop: 60 }}>
        <p style={{ color: "var(--color-text-2)" }}>Transcription not found.</p>
        <Button
          variant="outline"
          onClick={() => router.push("/transcriptions")}
          style={{ marginTop: 16 }}
        >
          Back to list
        </Button>
      </div>
    );
  }

  const isPending =
    recording?.status === "pending" || recording?.status === "failed";

  const tabs: { id: Tab; label: string; show: boolean }[] = [
    { id: "en", label: "English", show: !!transcription.english_text },
    { id: "my", label: "မြန်မာ", show: !!transcription.burmese_text },
    { id: "minutes", label: "Minutes", show: !!transcription.summary },
    {
      id: "actions",
      label: "Actions",
      show: (transcription.action_items?.length || 0) > 0,
    },
  ];
  const visibleTabs = tabs.filter((t) => t.show);

  return (
    <div style={{ maxWidth: 760, margin: "0 auto" }}>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => router.push("/transcriptions")}
        style={{ paddingLeft: 0, marginBottom: 12 }}
      >
        <ArrowLeft size={16} /> Back
      </Button>

      {/* Header */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: 12,
          flexWrap: "wrap",
        }}
      >
        <div>
          <h1 style={{ fontSize: "1.5rem" }}>Transcription</h1>
          <div
            style={{
              display: "flex",
              gap: 10,
              alignItems: "center",
              marginTop: 6,
            }}
          >
            {recording && (
              <Badge variant="outline">{recording.recording_type}</Badge>
            )}
            {recording?.duration_seconds ? (
              <span
                style={{ fontSize: "0.75rem", color: "var(--color-text-3)" }}
              >
                {formatDuration(recording.duration_seconds)}
              </span>
            ) : null}
            <span style={{ fontSize: "0.75rem", color: "var(--color-text-3)" }}>
              {timeAgo(transcription.created_at)}
            </span>
          </div>
        </div>
      </div>

      {/* Audio player */}
      {recording?.audio_url && (
        <audio
          controls
          src={recording.audio_url}
          style={{ width: "100%", marginTop: 18 }}
        />
      )}

      {/* Pending state */}
      {isPending && (
        <div
          style={{
            marginTop: 20,
            padding: 20,
            borderRadius: 12,
            border: "1px solid var(--color-border-light)",
            textAlign: "center",
          }}
        >
          <Sparkles size={24} style={{ margin: "0 auto" }} />
          <p style={{ marginTop: 10, color: "var(--color-text-2)" }}>
            {recording?.status === "failed"
              ? "Transcription failed. You can try again."
              : "This recording hasn't been transcribed yet."}
          </p>
          <Button onClick={reprocess} loading={processing} style={{ marginTop: 14 }}>
            <Play size={15} /> Start Transcription
          </Button>
        </div>
      )}

      {/* Tabs */}
      {visibleTabs.length > 0 && (
        <>
          <div
            style={{
              display: "flex",
              gap: 4,
              marginTop: 24,
              borderBottom: "1px solid var(--color-border-light)",
            }}
          >
            {visibleTabs.map((t) => {
              const active = tab === t.id;
              return (
                <button
                  key={t.id}
                  onClick={() => setTab(t.id)}
                  style={{
                    padding: "10px 16px",
                    background: "transparent",
                    border: "none",
                    borderBottom: active
                      ? "2px solid var(--color-primary)"
                      : "2px solid transparent",
                    color: active ? "var(--color-text-1)" : "var(--color-text-3)",
                    fontSize: "0.875rem",
                    fontWeight: active ? 600 : 400,
                    marginBottom: -1,
                  }}
                >
                  {t.label}
                </button>
              );
            })}
          </div>

          <div style={{ marginTop: 20 }}>
            {tab === "en" && (
              <Prose text={transcription.english_text || ""} />
            )}
            {tab === "my" && (
              <Prose text={transcription.burmese_text || ""} />
            )}
            {tab === "minutes" && (
              <Prose text={transcription.summary || ""} />
            )}
            {tab === "actions" && (
              <div style={{ display: "grid", gap: 8 }}>
                {transcription.action_items.map((item, i) => (
                  <button
                    key={i}
                    onClick={() =>
                      setChecked((c) => ({ ...c, [i]: !c[i] }))
                    }
                    style={{
                      display: "flex",
                      gap: 12,
                      alignItems: "flex-start",
                      textAlign: "left",
                      padding: "12px 14px",
                      borderRadius: 10,
                      border: "1px solid var(--color-border-light)",
                      background: checked[i]
                        ? "var(--color-secondary)"
                        : "transparent",
                      color: "inherit",
                    }}
                  >
                    <span
                      style={{
                        width: 20,
                        height: 20,
                        flexShrink: 0,
                        borderRadius: 6,
                        marginTop: 1,
                        border: checked[i]
                          ? "1px solid var(--color-primary)"
                          : "1px solid var(--color-border-light)",
                        background: checked[i]
                          ? "var(--color-primary)"
                          : "transparent",
                        color: "#fff",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      {checked[i] && <Check size={13} strokeWidth={3} />}
                    </span>
                    <span
                      style={{
                        fontSize: "0.875rem",
                        textDecoration: checked[i] ? "line-through" : "none",
                        color: checked[i]
                          ? "var(--color-text-3)"
                          : "inherit",
                      }}
                    >
                      {item}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </>
      )}

      {/* Notion footer */}
      {transcription.notion_page_id && (
        <div
          style={{
            marginTop: 28,
            paddingTop: 18,
            borderTop: "1px solid var(--color-border-light)",
            display: "flex",
            alignItems: "center",
            gap: 8,
          }}
        >
          <Badge variant="solid">
            <Check size={11} strokeWidth={3} /> Saved to Notion
          </Badge>
          <a
            href={`https://notion.so/${transcription.notion_page_id.replace(
              /-/g,
              ""
            )}`}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              fontSize: "0.8125rem",
              color: "var(--color-text-2)",
              display: "inline-flex",
              alignItems: "center",
              gap: 4,
            }}
          >
            Open in Notion <ExternalLink size={13} />
          </a>
        </div>
      )}
    </div>
  );
}

function Prose({ text }: { text: string }) {
  return (
    <div
      style={{
        fontSize: "0.9375rem",
        lineHeight: 1.75,
        color: "var(--color-text-1)",
        whiteSpace: "pre-wrap",
      }}
    >
      {text}
    </div>
  );
}
