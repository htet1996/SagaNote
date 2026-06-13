import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { z } from "zod";

const configSchema = z.object({
  setup_type: z.enum(["template", "existing"]),
  transcription_db_id: z.string().nullable().optional(),
  meetings_db_id: z.string().nullable().optional(),
  actions_db_id: z.string().nullable().optional(),
  notes_db_id: z.string().nullable().optional(),
});

/**
 * GET /api/notion/config — return the user's saved Notion config.
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
    .from("notion_configs")
    .select("*")
    .eq("user_id", user.id)
    .maybeSingle();

  return NextResponse.json({ config: data });
}

/**
 * POST /api/notion/config — upsert the user's Notion config (db selection).
 */
export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  const parsed = configSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const { error } = await supabase.from("notion_configs").upsert(
    {
      user_id: user.id,
      ...parsed.data,
    },
    { onConflict: "user_id" }
  );

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
