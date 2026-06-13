"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { X, Plus, StickyNote } from "lucide-react";
import { Textarea } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Spinner } from "@/components/ui/spinner";
import { PRESET_TAGS } from "@/lib/constants";
import { timeAgo } from "@/lib/utils";
import type { Note } from "@/types";

const MAX_CHARS = 2000;
const MAX_TAGS = 5;

export default function NotesPage() {
  const [content, setContent] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");
  const [saving, setSaving] = useState(false);
  const [notes, setNotes] = useState<Note[] | null>(null);

  const loadNotes = async () => {
    const res = await fetch("/api/notes");
    const data = await res.json();
    setNotes(data.notes || []);
  };

  useEffect(() => {
    void loadNotes();
  }, []);

  const addTag = (raw: string) => {
    const tag = raw.trim().toLowerCase().replace(/\s+/g, "-");
    if (!tag) return;
    if (tags.includes(tag)) return;
    if (tags.length >= MAX_TAGS) {
      toast.error(`Maximum ${MAX_TAGS} tags`);
      return;
    }
    setTags((t) => [...t, tag]);
    setTagInput("");
  };

  const removeTag = (tag: string) => setTags((t) => t.filter((x) => x !== tag));

  const save = async () => {
    if (!content.trim()) {
      toast.error("Write something first.");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch("/api/notes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: content.trim(), tags }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to save");

      toast.success(
        data.notion_saved ? "Note saved to Notion" : "Note saved"
      );
      setContent("");
      setTags([]);
      void loadNotes();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    // Ctrl+Enter to save
    if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
      e.preventDefault();
      void save();
    }
  };

  return (
    <div style={{ maxWidth: 720, margin: "0 auto" }}>
      <h1>Notes</h1>
      <p style={{ color: "var(--color-text-2)", marginTop: 6 }}>
        Quick capture — saved to Supabase and your Notion workspace.
      </p>

      {/* Composer */}
      <div
        style={{
          marginTop: 22,
          padding: 18,
          borderRadius: 12,
          border: "1px solid var(--color-border-light)",
          background: "var(--color-white)",
        }}
      >
        <Textarea
          value={content}
          onChange={(e) => setContent(e.target.value.slice(0, MAX_CHARS))}
          onKeyDown={handleKeyDown}
          placeholder="Write a note… (Ctrl + Enter to save)"
          style={{ minHeight: 130 }}
        />
        <div
          style={{
            display: "flex",
            justifyContent: "flex-end",
            fontSize: "0.6875rem",
            color: "var(--color-text-3)",
            marginTop: 6,
          }}
        >
          {content.length} / {MAX_CHARS}
        </div>

        {/* Tag input */}
        <div style={{ marginTop: 10 }}>
          <div
            style={{
              display: "flex",
              gap: 8,
              flexWrap: "wrap",
              alignItems: "center",
            }}
          >
            {tags.map((tag) => (
              <Badge key={tag} variant="solid">
                {tag}
                <button
                  onClick={() => removeTag(tag)}
                  aria-label={`Remove ${tag}`}
                  style={{
                    background: "transparent",
                    border: "none",
                    color: "inherit",
                    padding: 0,
                    marginLeft: 2,
                    display: "inline-flex",
                  }}
                >
                  <X size={11} />
                </button>
              </Badge>
            ))}
            <input
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  addTag(tagInput);
                }
              }}
              placeholder={tags.length >= MAX_TAGS ? "Max tags" : "Add tag…"}
              disabled={tags.length >= MAX_TAGS}
              style={{
                border: "none",
                outline: "none",
                background: "transparent",
                fontSize: "0.8125rem",
                color: "inherit",
                minWidth: 80,
                flex: 1,
              }}
            />
          </div>

          {/* Preset tags */}
          <div
            style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 10 }}
          >
            {PRESET_TAGS.filter((t) => !tags.includes(t)).map((t) => (
              <button
                key={t}
                onClick={() => addTag(t)}
                disabled={tags.length >= MAX_TAGS}
                style={{
                  fontSize: "0.6875rem",
                  padding: "3px 10px",
                  borderRadius: 99,
                  border: "1px solid var(--color-border-light)",
                  background: "transparent",
                  color: "var(--color-text-2)",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 3,
                }}
              >
                <Plus size={10} /> {t}
              </button>
            ))}
          </div>
        </div>

        <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 16 }}>
          <Button onClick={save} loading={saving}>
            Save note
          </Button>
        </div>
      </div>

      {/* Recent notes */}
      <h2 style={{ fontSize: "1.125rem", marginTop: 32 }}>Recent notes</h2>
      <div style={{ marginTop: 14 }}>
        {notes === null ? (
          <div style={{ padding: 40, textAlign: "center" }}>
            <Spinner />
          </div>
        ) : notes.length === 0 ? (
          <div
            style={{
              padding: "40px 20px",
              textAlign: "center",
              border: "1px dashed var(--color-border-light)",
              borderRadius: 12,
            }}
          >
            <StickyNote
              size={26}
              style={{ color: "var(--color-text-3)", margin: "0 auto" }}
            />
            <p style={{ marginTop: 12, color: "var(--color-text-2)" }}>
              No notes yet.
            </p>
          </div>
        ) : (
          <div style={{ display: "grid", gap: 10 }}>
            {notes.map((n) => (
              <div
                key={n.id}
                style={{
                  padding: 16,
                  borderRadius: 12,
                  border: "1px solid var(--color-border-light)",
                  background: "var(--color-white)",
                }}
              >
                <p
                  style={{
                    fontSize: "0.875rem",
                    lineHeight: 1.6,
                    whiteSpace: "pre-wrap",
                  }}
                >
                  {n.content}
                </p>
                <div
                  style={{
                    display: "flex",
                    gap: 8,
                    alignItems: "center",
                    marginTop: 10,
                    flexWrap: "wrap",
                  }}
                >
                  {n.tags?.map((tag) => (
                    <Badge key={tag} variant="outline">
                      {tag}
                    </Badge>
                  ))}
                  <span
                    style={{
                      fontSize: "0.6875rem",
                      color: "var(--color-text-3)",
                      marginLeft: "auto",
                    }}
                  >
                    {timeAgo(n.created_at)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
