"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import { Boxes, LogOut, Check } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useUserStore } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { SavePreference } from "@/types";

export default function SettingsPage() {
  const router = useRouter();
  const { profile, setProfile } = useUserStore();
  const [pref, setPref] = useState<SavePreference>(
    profile?.preferred_language || "both"
  );
  const [savingPref, setSavingPref] = useState(false);

  useEffect(() => {
    if (profile?.preferred_language) setPref(profile.preferred_language);
  }, [profile]);

  const savePref = async (value: SavePreference) => {
    setPref(value);
    setSavingPref(true);
    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;
      const { error } = await supabase
        .from("users")
        .update({ preferred_language: value, updated_at: new Date().toISOString() })
        .eq("id", user.id);
      if (error) throw error;
      if (profile) setProfile({ ...profile, preferred_language: value });
      toast.success("Preference saved");
    } catch {
      toast.error("Could not save preference");
    } finally {
      setSavingPref(false);
    }
  };

  const signOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.replace("/login");
  };

  const langs: { id: SavePreference; label: string }[] = [
    { id: "en", label: "English only" },
    { id: "my", label: "Burmese only" },
    { id: "both", label: "Both" },
  ];

  return (
    <div style={{ maxWidth: 640, margin: "0 auto" }}>
      <h1>Settings</h1>
      <p style={{ color: "var(--color-text-2)", marginTop: 6 }}>
        Manage your profile and preferences.
      </p>

      {/* Profile */}
      <Section title="Profile">
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          {profile?.avatar_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={profile.avatar_url}
              alt=""
              width={52}
              height={52}
              style={{ borderRadius: "50%", objectFit: "cover" }}
              referrerPolicy="no-referrer"
            />
          ) : (
            <div
              style={{
                width: 52,
                height: 52,
                borderRadius: "50%",
                background: "var(--color-secondary)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontWeight: 600,
              }}
            >
              {(profile?.full_name || "U").charAt(0)}
            </div>
          )}
          <div>
            <div style={{ fontWeight: 500 }}>{profile?.full_name}</div>
            <div style={{ fontSize: "0.8125rem", color: "var(--color-text-3)" }}>
              {profile?.email}
            </div>
          </div>
        </div>
        <p
          style={{
            fontSize: "0.6875rem",
            color: "var(--color-text-3)",
            marginTop: 12,
          }}
        >
          Profile details come from your Google account and are read-only.
        </p>
      </Section>

      {/* Save preference */}
      <Section title="Save preference">
        <p
          style={{
            fontSize: "0.8125rem",
            color: "var(--color-text-2)",
            marginBottom: 12,
          }}
        >
          Default language for new transcriptions.
        </p>
        <div style={{ display: "flex", gap: 8 }}>
          {langs.map((l) => {
            const active = pref === l.id;
            return (
              <button
                key={l.id}
                onClick={() => savePref(l.id)}
                disabled={savingPref}
                style={{
                  flex: 1,
                  height: 40,
                  borderRadius: 8,
                  fontSize: "0.8125rem",
                  fontWeight: 500,
                  border: active
                    ? "1px solid var(--color-primary)"
                    : "1px solid var(--color-border-light)",
                  background: active ? "var(--color-primary)" : "transparent",
                  color: active ? "#fff" : "inherit",
                }}
              >
                {l.label}
              </button>
            );
          })}
        </div>
      </Section>

      {/* Notion */}
      <Section title="Notion connection">
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <Boxes size={18} />
            <div>
              <div style={{ fontWeight: 500, fontSize: "0.875rem" }}>
                {profile?.notion_access_token
                  ? profile.notion_workspace_name || "Connected"
                  : "Not connected"}
              </div>
              {profile?.notion_access_token ? (
                <Badge variant="solid" style={{ marginTop: 4 }}>
                  <Check size={10} strokeWidth={3} /> Connected
                </Badge>
              ) : (
                <div
                  style={{ fontSize: "0.75rem", color: "var(--color-text-3)" }}
                >
                  Connect to save notes automatically.
                </div>
              )}
            </div>
          </div>
          <Link href="/workspace">
            <Button variant="outline" size="sm">
              Manage
            </Button>
          </Link>
        </div>
      </Section>

      {/* Danger zone */}
      <Section title="Account">
        <Button variant="danger" onClick={signOut}>
          <LogOut size={15} /> Sign out
        </Button>
      </Section>
    </div>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div
      style={{
        marginTop: 18,
        padding: 20,
        borderRadius: 12,
        border: "1px solid var(--color-border-light)",
        background: "var(--color-white)",
      }}
    >
      <h2
        style={{
          fontSize: "0.9375rem",
          fontWeight: 600,
          marginBottom: 14,
        }}
      >
        {title}
      </h2>
      {children}
    </div>
  );
}
