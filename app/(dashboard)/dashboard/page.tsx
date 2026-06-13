"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Mic,
  StickyNote,
  Bot,
  FileAudio,
  AlertCircle,
  ArrowRight,
  Plus,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useUserStore } from "@/lib/store";
import { getGreeting, formatDuration, timeAgo, truncate } from "@/lib/utils";
import { Spinner } from "@/components/ui/spinner";
import type { Transcription } from "@/types";

const QUICK_ACTIONS = [
  {
    label: "Record",
    desc: "Voice or meeting",
    href: "/recorder",
    icon: Mic,
  },
  { label: "Notes", desc: "Quick capture", href: "/notes", icon: StickyNote },
  { label: "AI Agent", desc: "Voice assistant", href: "/agent", icon: Bot },
  {
    label: "Transcriptions",
    desc: "Your library",
    href: "/transcriptions",
    icon: FileAudio,
  },
];

export default function DashboardPage() {
  const router = useRouter();
  const { profile } = useUserStore();
  const [recent, setRecent] = useState<Transcription[] | null>(null);

  const firstName = (profile?.full_name || "there").split(" ")[0];
  const notionConnected = !!profile?.notion_access_token;

  useEffect(() => {
    const load = async () => {
      const supabase = createClient();
      const { data } = await supabase
        .from("transcriptions")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(4);
      setRecent((data as Transcription[]) || []);
    };
    void load();
  }, []);

  return (
    <div style={{ maxWidth: 920, margin: "0 auto" }}>
      {/* Greeting */}
      <div>
        <h1>
          {getGreeting()}, {firstName}
        </h1>
        <p style={{ color: "var(--color-text-2)", marginTop: 6 }}>
          Here&apos;s what&apos;s happening in your workspace.
        </p>
      </div>

      {/* Notion warning */}
      {!notionConnected && (
        <div
          style={{
            marginTop: 22,
            display: "flex",
            alignItems: "center",
            gap: 12,
            padding: "14px 16px",
            borderRadius: 12,
            border: "1px solid var(--color-border-light)",
            background: "var(--color-secondary)",
          }}
        >
          <AlertCircle size={18} style={{ flexShrink: 0 }} />
          <div style={{ flex: 1, fontSize: "0.8125rem" }}>
            <strong>Connect Notion</strong> to automatically save your
            transcriptions and notes.
          </div>
          <Link
            href="/workspace"
            style={{
              fontSize: "0.8125rem",
              fontWeight: 500,
              display: "inline-flex",
              alignItems: "center",
              gap: 4,
              whiteSpace: "nowrap",
            }}
          >
            Connect <ArrowRight size={14} />
          </Link>
        </div>
      )}

      {/* Credits card */}
      <div
        style={{
          marginTop: 22,
          padding: 24,
          borderRadius: 12,
          background: "var(--color-primary)",
          color: "#fff",
          display: "flex",
          flexWrap: "wrap",
          justifyContent: "space-between",
          alignItems: "center",
          gap: 16,
        }}
      >
        <div>
          <div
            style={{
              fontSize: "0.6875rem",
              color: "rgba(255,255,255,0.6)",
              textTransform: "uppercase",
              letterSpacing: "0.06em",
            }}
          >
            Available credits
          </div>
          <div
            style={{
              fontSize: "2.25rem",
              fontWeight: 600,
              marginTop: 4,
              fontVariantNumeric: "tabular-nums",
            }}
          >
            {formatDuration(profile?.credits_balance ?? 0)}
          </div>
          <div
            style={{
              fontSize: "0.75rem",
              color: "rgba(255,255,255,0.6)",
              marginTop: 2,
            }}
          >
            minutes : seconds of transcription remaining
          </div>
        </div>
        <button
          onClick={() => router.push("/credits")}
          style={{
            height: 42,
            padding: "0 18px",
            borderRadius: 8,
            border: "none",
            background: "#fff",
            color: "#111",
            fontWeight: 600,
            fontSize: "0.875rem",
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
          }}
        >
          <Plus size={15} /> Add credits
        </button>
      </div>

      {/* Quick actions */}
      <h2 style={{ marginTop: 36, fontSize: "1.125rem" }}>Quick actions</h2>
      <div
        style={{
          marginTop: 14,
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
          gap: 14,
        }}
      >
        {QUICK_ACTIONS.map((a) => {
          const Icon = a.icon;
          return (
            <button
              key={a.href}
              onClick={() => router.push(a.href)}
              style={{
                textAlign: "left",
                padding: 18,
                borderRadius: 12,
                border: "1px solid var(--color-border-light)",
                background: "var(--color-white)",
                color: "inherit",
                transition: "transform 0.15s ease, box-shadow 0.15s ease",
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.transform = "translateY(-2px)";
                e.currentTarget.style.boxShadow = "0 4px 16px rgba(0,0,0,0.07)";
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.transform = "translateY(0)";
                e.currentTarget.style.boxShadow = "none";
              }}
            >
              <div
                style={{
                  width: 38,
                  height: 38,
                  borderRadius: 10,
                  background: "var(--color-secondary)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  marginBottom: 12,
                }}
              >
                <Icon size={18} />
              </div>
              <div style={{ fontWeight: 500, fontSize: "0.9375rem" }}>
                {a.label}
              </div>
              <div
                style={{
                  fontSize: "0.75rem",
                  color: "var(--color-text-3)",
                  marginTop: 2,
                }}
              >
                {a.desc}
              </div>
            </button>
          );
        })}
      </div>

      {/* Recent transcriptions */}
      <div
        style={{
          marginTop: 36,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <h2 style={{ fontSize: "1.125rem" }}>Recent transcriptions</h2>
        <Link
          href="/transcriptions"
          style={{ fontSize: "0.8125rem", color: "var(--color-text-2)" }}
        >
          View all
        </Link>
      </div>

      <div style={{ marginTop: 14 }}>
        {recent === null ? (
          <div style={{ padding: 40, textAlign: "center" }}>
            <Spinner />
          </div>
        ) : recent.length === 0 ? (
          <div
            style={{
              padding: "40px 20px",
              textAlign: "center",
              border: "1px dashed var(--color-border-light)",
              borderRadius: 12,
            }}
          >
            <FileAudio
              size={26}
              style={{ color: "var(--color-text-3)", margin: "0 auto" }}
            />
            <p style={{ marginTop: 12, color: "var(--color-text-2)" }}>
              No transcriptions yet.
            </p>
            <Link
              href="/recorder"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                marginTop: 10,
                fontSize: "0.875rem",
                fontWeight: 500,
              }}
            >
              Make your first recording <ArrowRight size={14} />
            </Link>
          </div>
        ) : (
          <div style={{ display: "grid", gap: 10 }}>
            {recent.map((t) => (
              <Link
                key={t.id}
                href={`/transcriptions/${t.id}`}
                style={{
                  display: "block",
                  padding: 16,
                  borderRadius: 12,
                  border: "1px solid var(--color-border-light)",
                  background: "var(--color-white)",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    gap: 12,
                  }}
                >
                  <p style={{ fontSize: "0.875rem", flex: 1 }}>
                    {truncate(
                      t.english_text || t.burmese_text || "Untitled",
                      110
                    )}
                  </p>
                  <span
                    style={{
                      fontSize: "0.6875rem",
                      color: "var(--color-text-3)",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {timeAgo(t.created_at)}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
