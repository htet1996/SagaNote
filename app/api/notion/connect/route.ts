import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getNotionAuthUrl } from "@/lib/notion/client";

/**
 * GET /api/notion/connect
 * Generates a CSRF `state`, stores it in an httpOnly cookie, and redirects the
 * user to Notion's OAuth authorize screen.
 */
export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/login`);
  }

  // CSRF token — verified in the callback.
  const state = crypto.randomUUID();

  const response = NextResponse.redirect(getNotionAuthUrl(state));
  response.cookies.set("notion_oauth_state", state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 600, // 10 minutes
  });
  return response;
}
