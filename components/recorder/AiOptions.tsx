"use client";

import { Check } from "lucide-react";
import type { SavePreference } from "@/types";

/**
 * Reusable checkbox row.
 */
export function CheckRow({
  checked,
  onChange,
  label,
  hint,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
  hint?: string;
}) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      style={{
        width: "100%",
        textAlign: "left",
        display: "flex",
        alignItems: "center",
        gap: 12,
        padding: "12px 14px",
        borderRadius: 10,
        border: "1px solid var(--color-border-light)",
        background: checked ? "var(--color-secondary)" : "transparent",
        color: "inherit",
      }}
    >
      <span
        style={{
          width: 20,
          height: 20,
          flexShrink: 0,
          borderRadius: 6,
          border: checked
            ? "1px solid var(--color-primary)"
            : "1px solid var(--color-border-light)",
          background: checked ? "var(--color-primary)" : "transparent",
          color: "#fff",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {checked && <Check size={13} strokeWidth={3} />}
      </span>
      <span>
        <span style={{ fontSize: "0.875rem", fontWeight: 500 }}>{label}</span>
        {hint && (
          <span
            style={{
              display: "block",
              fontSize: "0.75rem",
              color: "var(--color-text-3)",
            }}
          >
            {hint}
          </span>
        )}
      </span>
    </button>
  );
}

/**
 * AI options: language preference + minutes/actions toggles.
 */
export function AiOptions({
  savePreference,
  setSavePreference,
  generateMinutes,
  setGenerateMinutes,
  generateActions,
  setGenerateActions,
}: {
  savePreference: SavePreference;
  setSavePreference: (v: SavePreference) => void;
  generateMinutes: boolean;
  setGenerateMinutes: (v: boolean) => void;
  generateActions: boolean;
  setGenerateActions: (v: boolean) => void;
}) {
  const langs: { id: SavePreference; label: string }[] = [
    { id: "en", label: "English" },
    { id: "my", label: "မြန်မာ" },
    { id: "both", label: "Both" },
  ];

  return (
    <div style={{ display: "grid", gap: 14 }}>
      <div>
        <div
          style={{
            fontSize: "0.8125rem",
            fontWeight: 500,
            marginBottom: 8,
          }}
        >
          Save language
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          {langs.map((l) => {
            const active = savePreference === l.id;
            return (
              <button
                key={l.id}
                type="button"
                onClick={() => setSavePreference(l.id)}
                style={{
                  flex: 1,
                  height: 38,
                  borderRadius: 8,
                  border: active
                    ? "1px solid var(--color-primary)"
                    : "1px solid var(--color-border-light)",
                  background: active ? "var(--color-primary)" : "transparent",
                  color: active ? "#fff" : "inherit",
                  fontSize: "0.8125rem",
                  fontWeight: 500,
                }}
              >
                {l.label}
              </button>
            );
          })}
        </div>
      </div>

      <CheckRow
        checked={generateMinutes}
        onChange={setGenerateMinutes}
        label="Generate meeting minutes"
        hint="Summary, decisions, and next steps"
      />
      <CheckRow
        checked={generateActions}
        onChange={setGenerateActions}
        label="Extract action items"
        hint="Pull out tasks as a checklist"
      />
    </div>
  );
}
