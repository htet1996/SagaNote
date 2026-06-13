import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { listNotionDatabases } from "@/lib/notion/client";

/**
 * GET /api/notion/databases
 * Returns the list of Notion databases the integration can access.
 */
export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: profile } = await supabase
    .from("users")
    .select("notion_access_token")
    .eq("id", user.id)
    .single();

  if (!profile?.notion_access_token) {
    return NextResponse.json(
      { error: "Notion not connected" },
      { status: 400 }
    );
  }

  try {
    const databases = await listNotionDatabases(profile.notion_access_token);
    return NextResponse.json({ databases });
  } catch {
    return NextResponse.json(
      { error: "Failed to fetch databases" },
      { status: 500 }
    );
  }
}
