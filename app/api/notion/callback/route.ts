import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { exchangeNotionCode } from "@/lib/notion/client";

/**
 * Derive the public origin from the request (Vercel sets x-forwarded-* headers).
 */
function getOrigin(request: NextRequest): string {
  const host =
    request.headers.get("x-forwarded-host") || request.headers.get("host");
  const proto = request.headers.get("x-forwarded-proto") || "https";
  if (host) return `${proto}://${host}`;
  return new URL(request.url).origin;
}

/**
 * GET /api/notion/callback
 * Notion OAuth redirect target. Exchanges the code for an access token and
 * stores it on the user's profile, then returns to /workspace.
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const error = searchParams.get("error");
  const state = searchParams.get("state");

  const appUrl = getOrigin(request);

  if (error || !code) {
    return NextResponse.redirect(`${appUrl}/workspace?error=notion_denied`);
  }

  // CSRF check — the state must match the cookie set in /api/notion/connect.
  const expectedState = request.cookies.get("notion_oauth_state")?.value;
  if (!state || !expectedState || state !== expectedState) {
    return NextResponse.redirect(`${appUrl}/workspace?error=state_mismatch`);
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.redirect(`${appUrl}/login`);
  }

  try {
    // redirect_uri must EXACTLY match the one used to start the flow.
    const redirectUri = `${appUrl}/api/notion/callback`;
    const token = await exchangeNotionCode(code, redirectUri);

    const { error: updateError } = await supabase
      .from("users")
      .update({
        notion_access_token: token.access_token,
        notion_workspace_id: token.workspace_id,
        notion_workspace_name: token.workspace_name,
        notion_workspace_icon: token.workspace_icon,
        updated_at: new Date().toISOString(),
      })
      .eq("id", user.id);

    if (updateError) {
      return NextResponse.redirect(`${appUrl}/workspace?error=save_failed`);
    }

    return NextResponse.redirect(`${appUrl}/workspace?connected=true`);
  } catch {
    return NextResponse.redirect(`${appUrl}/workspace?error=notion_failed`);
  }
}
