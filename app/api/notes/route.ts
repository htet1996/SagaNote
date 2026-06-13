import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  createNotionPage,
  paragraphBlocks,
  findFirstAccessiblePage,
} from "@/lib/notion/client";
import { z } from "zod";

const bodySchema = z.object({
  content: z.string().min(1).max(2000),
  tags: z.array(z.string()).max(5).default([]),
});

/**
 * GET /api/notes — list the user's recent notes.
 */
export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data } = await supabase
    .from("notes")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(50);

  return NextResponse.json({ notes: data || [] });
}

/**
 * POST /api/notes — create a note in Supabase + Notion (best-effort).
 */
export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let raw: unknown;
  try {
    raw = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  const parsed = bodySchema.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json({ error: "Validation failed" }, { status: 400 });
  }

  const { content, tags } = parsed.data;

  // Try Notion (best-effort)
  let notionPageId: string | null = null;
  const { data: profile } = await supabase
    .from("users")
    .select("notion_access_token")
    .eq("id", user.id)
    .single();

  if (profile?.notion_access_token) {
    try {
      const { data: config } = await supabase
        .from("notion_configs")
        .select("notes_db_id")
        .eq("user_id", user.id)
        .maybeSingle();

      const title =
        content.split("\n")[0].slice(0, 60) || "Quick Note";

      let parentPageId: string | null = null;
      if (!config?.notes_db_id) {
        parentPageId = await findFirstAccessiblePage(
          profile.notion_access_token
        );
      }

      notionPageId = await createNotionPage({
        accessToken: profile.notion_access_token,
        title,
        databaseId: config?.notes_db_id || null,
        parentPageId,
        blocks: paragraphBlocks(content),
      });
    } catch {
      notionPageId = null;
    }
  }

  const { data: note, error } = await supabase
    .from("notes")
    .insert({
      user_id: user.id,
      content,
      tags,
      notion_page_id: notionPageId,
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true, note, notion_saved: !!notionPageId });
}
