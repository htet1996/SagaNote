import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getNotionAuthUrl } from "@/lib/notion/client";

/**
 * Derive the public origin of the app from the incoming request.
 * Uses x-forwarded-* headers (set by Vercel/proxies) so it works on the real
 * deployed domain, and falls back to the request URL for localhost.
 */
function getOrigin(request: NextRequest): string {
  const host = request.headers.get("x-forwarded-host") || request.headers.get("host");
  const proto = request.headers.get("x-forwarded-proto") || "https";
  if (host) return `${proto}://${host}`;
  return new URL(request.url).origin;
}

/**
 * GET /api/notion/connect
 * Generates a CSRF `state`, stores it in an httpOnly cookie, and redirects the
 * user to Notion's OAuth authorize screen. The redirect_uri is derived from the
 * request origin so it always matches the domain the user is on.
 */
export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const origin = getOrigin(request);

  if (!user) {
    return NextResponse.redirect(`${origin}/login`);
  }

  const redirectUri = `${origin}/api/notion/callback`;

  // CSRF token — verified in the callback.
  const state = crypto.randomUUID();

  const response = NextResponse.redirect(getNotionAuthUrl(state, redirectUri));
  response.cookies.set("notion_oauth_state", state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 600, // 10 minutes
  });
  return response;
}
