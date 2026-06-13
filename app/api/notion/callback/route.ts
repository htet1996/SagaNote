import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { exchangeNotionCode } from "@/lib/notion/client";

/**
 * GET /api/notion/callback
 * Notion OAuth redirect target. Exchanges the code for an access token and
 * stores it on the user's profile, then returns to /workspace.
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const error = searchParams.get("error");
  const state = searchParams.get("state");

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || origin;

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
    const token = await exchangeNotionCode(code);

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
