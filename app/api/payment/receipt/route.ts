import { NextResponse, type NextRequest } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";

/**
 * GET /api/payment/receipt?id=<payment_id>
 * Admin-only. Returns a short-lived signed URL (redirect) to the payment
 * receipt stored in the private "receipts" bucket.
 */
export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Verify admin via the user-scoped client.
  const { data: profile } = await supabase
    .from("users")
    .select("is_admin")
    .eq("id", user.id)
    .single();

  if (!profile?.is_admin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const id = request.nextUrl.searchParams.get("id");
  if (!id) {
    return NextResponse.json({ error: "Missing id" }, { status: 400 });
  }

  const admin = createServiceClient();
  const { data: payment } = await admin
    .from("payments")
    .select("screenshot_url")
    .eq("id", id)
    .single();

  if (!payment?.screenshot_url) {
    return NextResponse.json({ error: "No receipt" }, { status: 404 });
  }

  const { data: signed, error } = await admin.storage
    .from("receipts")
    .createSignedUrl(payment.screenshot_url, 60 * 5); // 5 minutes

  if (error || !signed) {
    return NextResponse.json(
      { error: "Could not sign receipt" },
      { status: 500 }
    );
  }

  return NextResponse.redirect(signed.signedUrl);
}
