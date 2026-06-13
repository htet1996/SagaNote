import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * Supabase OAuth callback.
 * Exchanges the `code` query param for a session, then redirects to the
 * dashboard (or back to the originally requested page via `redirect`).
 *
 * MUST live at app/auth/callback/route.ts (NOT inside the (auth) group).
 */
// Only allow internal redirects (single leading slash, not protocol-relative).
function safeInternalPath(raw: string | null): string {
  if (!raw || !raw.startsWith("/") || raw.startsWith("//") || raw.startsWith("/\\")) {
    return "/dashboard";
  }
  return raw;
}

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const redirectTo = safeInternalPath(searchParams.get("redirect"));

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(`${origin}${redirectTo}`);
    }
  }

  return NextResponse.redirect(`${origin}/login?error=auth_failed`);
}
