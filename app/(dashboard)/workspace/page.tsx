"use client";

import { useEffect, useState, Suspense, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import { toast } from "sonner";
import {
  Boxes,
  Check,
  ExternalLink,
  FileText,
  Sparkles,
  ArrowLeft,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useUserStore } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FullPageLoader } from "@/components/ui/spinner";
import type { NotionConfig } from "@/types";
import type { NotionDatabaseOption } from "@/lib/notion/client";

// Public Notion template the user can duplicate (placeholder URL).
const TEMPLATE_URL = "https://www.notion.so/templates";

type Step = "connect" | "choose" | "template" | "existing" | "done";

function WorkspaceInner() {
  const params = useSearchParams();
  const { profile, setProfile } = useUserStore();
  const [step, setStep] = useState<Step>("connect");
  const [loading, setLoading] = useState(true);
  const [config, setConfig] = useState<NotionConfig | null>(null);
  const [databases, setDatabases] = useState<NotionDatabaseOption[]>([]);
  const [dbLoading, setDbLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  // Existing-workspace selections
  const [selection, setSelection] = useState({
    transcription_db_id: "",
    meetings_db_id: "",
    actions_db_id: "",
    notes_db_id: "",
  });

  const connected = !!profile?.notion_access_token;

  const refreshProfile = useCallback(async () => {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;
    const { data } = await supabase
      .from("users")
      .select("*")
      .eq("id", user.id)
      .single();
    if (data) setProfile(data);
  }, [setProfile]);

  const loadConfig = useCallback(async () => {
    const res = await fetch("/api/notion/config");
    const data = await res.json();
    setConfig(data.config || null);
    return data.config as NotionConfig | null;
  }, []);

  // Initial bootstrap.
  useEffect(() => {
    const init = async () => {
      if (params.get("connected") === "true") {
        toast.success("Notion connected!");
        await refreshProfile();
      }
      if (params.get("error")) {
        toast.error("Could not connect Notion. Please try again.");
      }
      const cfg = await loadConfig();
      setLoading(false);

      // Decide initial step.
      if (!profile?.notion_access_token && params.get("connected") !== "true") {
        setStep("connect");
      } else if (cfg) {
        setStep("done");
      } else {
        setStep("choose");
      }
    };
    void init();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Re-evaluate step once profile hydrates.
  useEffect(() => {
    if (loading) return;
    if (connected && step === "connect") {
      setStep(config ? "done" : "choose");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [connected, loading]);

  const loadDatabases = async () => {
    setDbLoading(true);
    try {
      const res = await fetch("/api/notion/databases");
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed");
      setDatabases(data.databases || []);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to load");
    } finally {
      setDbLoading(false);
    }
  };

  const saveConfig = async (setupType: "template" | "existing") => {
    setSaving(true);
    try {
      const payload =
        setupType === "existing"
          ? {
              setup_type: "existing",
              transcription_db_id: selection.transcription_db_id || null,
              meetings_db_id: selection.meetings_db_id || null,
              actions_db_id: selection.actions_db_id || null,
              notes_db_id: selection.notes_db_id || null,
            }
          : { setup_type: "template" };

      const res = await fetch("/api/notion/config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed");
      }
      await loadConfig();
      toast.success("Workspace configured!");
      setStep("done");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  const disconnect = async () => {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;
    await supabase
      .from("users")
      .update({
        notion_access_token: null,
        notion_workspace_id: null,
        notion_workspace_name: null,
        notion_workspace_icon: null,
      })
      .eq("id", user.id);
    await supabase.from("notion_configs").delete().eq("user_id", user.id);
    await refreshProfile();
    setConfig(null);
    setStep("connect");
    toast.success("Notion disconnected.");
  };

  if (loading) return <FullPageLoader label="Loading workspace…" />;

  return (
    <div style={{ maxWidth: 640, margin: "0 auto" }}>
      <h1>Workspace</h1>
      <p style={{ color: "var(--color-text-2)", marginTop: 6 }}>
        Connect Notion so SagaNote can save your notes automatically.
      </p>

      <div style={{ marginTop: 24 }}>
        {/* STEP: connect */}
        {step === "connect" && (
          <Panel>
            <Center>
              <IconCircle>
                <Boxes size={26} />
              </IconCircle>
              <h2 style={{ fontSize: "1.25rem", marginTop: 16 }}>
                Connect your Notion
              </h2>
              <p
                style={{
                  color: "var(--color-text-2)",
                  marginTop: 8,
                  maxWidth: 380,
                }}
              >
                Authorize SagaNote to create pages in your Notion workspace.
                You stay in control and can disconnect anytime.
              </p>
              <Button
                size="lg"
                style={{ marginTop: 20 }}
                onClick={() => {
                  window.location.href = "/api/notion/connect";
                }}
              >
                <Boxes size={16} /> Connect Notion
              </Button>
            </Center>
          </Panel>
        )}

        {/* STEP: choose */}
        {step === "choose" && (
          <div style={{ display: "grid", gap: 14 }}>
            <ChoiceCard
              recommended
              icon={<Sparkles size={20} />}
              title="Use SagaNote Template"
              desc="Duplicate our ready-made Notion template with databases for transcriptions, meetings, actions, and notes."
              onClick={() => {
                setStep("template");
              }}
            />
            <ChoiceCard
              icon={<FileText size={20} />}
              title="Use Existing Workspace"
              desc="Pick databases you already have in Notion to map each type of content."
              onClick={() => {
                setStep("existing");
                void loadDatabases();
              }}
            />
          </div>
        )}

        {/* STEP: template */}
        {step === "template" && (
          <Panel>
            <BackBtn onClick={() => setStep("choose")} />
            <h2 style={{ fontSize: "1.25rem", marginBottom: 14 }}>
              SagaNote Template
            </h2>
            <ol
              style={{
                paddingLeft: 18,
                color: "var(--color-text-2)",
                fontSize: "0.875rem",
                lineHeight: 1.9,
              }}
            >
              <li>Open the SagaNote Notion template.</li>
              <li>
                Click <strong>Duplicate</strong> (top-right) to copy it into
                your workspace.
              </li>
              <li>
                Make sure the SagaNote integration has access to the duplicated
                pages.
              </li>
              <li>Come back here and confirm.</li>
            </ol>
            <div style={{ display: "flex", gap: 10, marginTop: 20 }}>
              <Button
                variant="outline"
                onClick={() => window.open(TEMPLATE_URL, "_blank")}
              >
                Open Template <ExternalLink size={14} />
              </Button>
              <Button
                onClick={() => saveConfig("template")}
                loading={saving}
                fullWidth
              >
                I&apos;ve duplicated it
              </Button>
            </div>
          </Panel>
        )}

        {/* STEP: existing */}
        {step === "existing" && (
          <Panel>
            <BackBtn onClick={() => setStep("choose")} />
            <h2 style={{ fontSize: "1.25rem", marginBottom: 4 }}>
              Map your databases
            </h2>
            <p
              style={{
                fontSize: "0.8125rem",
                color: "var(--color-text-3)",
                marginBottom: 18,
              }}
            >
              Choose which Notion database receives each type of content.
            </p>

            {dbLoading ? (
              <div style={{ padding: 30, textAlign: "center" }}>
                <FullPageLoader />
              </div>
            ) : databases.length === 0 ? (
              <p style={{ color: "var(--color-text-2)", fontSize: "0.875rem" }}>
                No databases found. Make sure the SagaNote integration has
                access to at least one database in Notion, then refresh.
                <br />
                <button
                  onClick={loadDatabases}
                  style={{
                    marginTop: 10,
                    background: "transparent",
                    border: "none",
                    color: "var(--color-text-1)",
                    fontWeight: 500,
                    textDecoration: "underline",
                  }}
                >
                  Refresh
                </button>
              </p>
            ) : (
              <div style={{ display: "grid", gap: 14 }}>
                {(
                  [
                    ["transcription_db_id", "Transcriptions"],
                    ["meetings_db_id", "Meetings"],
                    ["actions_db_id", "Action items"],
                    ["notes_db_id", "Notes"],
                  ] as const
                ).map(([key, label]) => (
                  <div key={key}>
                    <label
                      style={{
                        display: "block",
                        fontSize: "0.8125rem",
                        fontWeight: 500,
                        marginBottom: 6,
                      }}
                    >
                      {label}
                    </label>
                    <select
                      value={selection[key]}
                      onChange={(e) =>
                        setSelection((s) => ({ ...s, [key]: e.target.value }))
                      }
                      style={{
                        width: "100%",
                        height: 40,
                        borderRadius: 8,
                        border: "1px solid var(--color-border-light)",
                        background: "var(--color-white)",
                        color: "inherit",
                        padding: "0 10px",
                        fontSize: "0.875rem",
                      }}
                    >
                      <option value="">— Not used —</option>
                      {databases.map((db) => (
                        <option key={db.id} value={db.id}>
                          {db.title}
                        </option>
                      ))}
                    </select>
                  </div>
                ))}
                <Button
                  onClick={() => saveConfig("existing")}
                  loading={saving}
                  fullWidth
                  style={{ marginTop: 6 }}
                >
                  Save configuration
                </Button>
              </div>
            )}
          </Panel>
        )}

        {/* STEP: done */}
        {step === "done" && (
          <Panel>
            <Center>
              <IconCircle>
                <Check size={26} />
              </IconCircle>
              <h2 style={{ fontSize: "1.25rem", marginTop: 16 }}>
                You&apos;re all set
              </h2>
              <p
                style={{
                  color: "var(--color-text-2)",
                  marginTop: 8,
                }}
              >
                Connected to{" "}
                <strong>
                  {profile?.notion_workspace_name || "your workspace"}
                </strong>
                .
              </p>
              <Badge variant="outline" style={{ marginTop: 12 }}>
                Setup: {config?.setup_type || "template"}
              </Badge>
              <div style={{ display: "flex", gap: 10, marginTop: 22 }}>
                <Button
                  variant="outline"
                  onClick={() => {
                    setStep("choose");
                  }}
                >
                  Change setup
                </Button>
              </div>
              <button
                onClick={disconnect}
                style={{
                  marginTop: 18,
                  background: "transparent",
                  border: "none",
                  color: "var(--color-text-3)",
                  fontSize: "0.75rem",
                  textDecoration: "underline",
                }}
              >
                Disconnect Notion
              </button>
            </Center>
          </Panel>
        )}
      </div>
    </div>
  );
}

// ---- Small layout helpers ----
function Panel({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        padding: 28,
        borderRadius: 12,
        border: "1px solid var(--color-border-light)",
        background: "var(--color-white)",
      }}
    >
      {children}
    </div>
  );
}

function Center({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        textAlign: "center",
      }}
    >
      {children}
    </div>
  );
}

function IconCircle({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        width: 60,
        height: 60,
        borderRadius: 16,
        background: "var(--color-primary)",
        color: "#fff",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      {children}
    </div>
  );
}

function BackBtn({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        background: "transparent",
        border: "none",
        color: "var(--color-text-2)",
        fontSize: "0.8125rem",
        marginBottom: 16,
        padding: 0,
      }}
    >
      <ArrowLeft size={15} /> Back
    </button>
  );
}

function ChoiceCard({
  icon,
  title,
  desc,
  onClick,
  recommended,
}: {
  icon: React.ReactNode;
  title: string;
  desc: string;
  onClick: () => void;
  recommended?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      style={{
        position: "relative",
        textAlign: "left",
        display: "flex",
        gap: 16,
        padding: 22,
        borderRadius: 12,
        border: recommended
          ? "1.5px solid var(--color-primary)"
          : "1px solid var(--color-border-light)",
        background: "var(--color-white)",
        color: "inherit",
      }}
      onMouseOver={(e) =>
        (e.currentTarget.style.boxShadow = "0 4px 16px rgba(0,0,0,0.07)")
      }
      onMouseOut={(e) => (e.currentTarget.style.boxShadow = "none")}
    >
      {recommended && (
        <Badge
          variant="solid"
          style={{ position: "absolute", top: -10, right: 16 }}
        >
          Recommended
        </Badge>
      )}
      <div
        style={{
          width: 44,
          height: 44,
          flexShrink: 0,
          borderRadius: 12,
          background: "var(--color-secondary)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {icon}
      </div>
      <div>
        <div style={{ fontWeight: 500, fontSize: "1rem" }}>{title}</div>
        <div
          style={{
            fontSize: "0.8125rem",
            color: "var(--color-text-2)",
            marginTop: 4,
          }}
        >
          {desc}
        </div>
      </div>
    </button>
  );
}

export default function WorkspacePage() {
  return (
    <Suspense fallback={<FullPageLoader />}>
      <WorkspaceInner />
    </Suspense>
  );
}
