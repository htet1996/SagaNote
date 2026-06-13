import { NextResponse, type NextRequest } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { CREDIT_PACKAGES } from "@/lib/constants";
import { z } from "zod";

// The client only chooses a package + method. The price and credit amount are
// looked up server-side from a trusted source — NEVER trusted from the client.
const createSchema = z.object({
  package_id: z.string(),
  payment_method: z.enum(["kbzpay", "wavepay", "ayapay", "cbpay"]),
  // Storage object PATH inside the private "receipts" bucket (not a URL).
  screenshot_url: z.string().max(500).nullable().optional(),
});

const reviewSchema = z.object({
  payment_id: z.string().uuid(),
  action: z.enum(["approve", "reject"]),
  note: z.string().optional(),
});

/**
 * POST /api/payment — user submits a payment for manual verification.
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

  const parsed = createSchema.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json({ error: "Validation failed" }, { status: 400 });
  }

  // Resolve the package server-side — the amount and credits are authoritative
  // here, not whatever the browser claims.
  const pkg = CREDIT_PACKAGES.find((p) => p.id === parsed.data.package_id);
  if (!pkg) {
    return NextResponse.json({ error: "Unknown package" }, { status: 400 });
  }

  const { error } = await supabase.from("payments").insert({
    user_id: user.id,
    amount_mmk: pkg.amountMMK,
    payment_method: parsed.data.payment_method,
    credits_granted: pkg.credits,
    screenshot_url: parsed.data.screenshot_url || null,
    status: "pending",
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}

/**
 * PATCH /api/payment — admin approves or rejects a payment.
 * On approve: grants credits (negative deduct = add) + logs it.
 */
export async function PATCH(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Verify admin
  const { data: profile } = await supabase
    .from("users")
    .select("is_admin")
    .eq("id", user.id)
    .single();

  if (!profile?.is_admin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  let raw: unknown;
  try {
    raw = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  const parsed = reviewSchema.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json({ error: "Validation failed" }, { status: 400 });
  }

  const { payment_id, action, note } = parsed.data;

  // Use service client to read/modify any user's payment + balance
  const admin = createServiceClient();

  const { data: payment } = await admin
    .from("payments")
    .select("*")
    .eq("id", payment_id)
    .single();

  if (!payment) {
    return NextResponse.json({ error: "Payment not found" }, { status: 404 });
  }

  if (payment.status !== "pending") {
    return NextResponse.json(
      { error: "Payment already reviewed" },
      { status: 400 }
    );
  }

  if (action === "reject") {
    await admin
      .from("payments")
      .update({
        status: "rejected",
        verified_by: user.id,
        note: note || "Rejected by admin",
      })
      .eq("id", payment_id);
    return NextResponse.json({ success: true });
  }

  // Approve → add credits via deduct_credits with a NEGATIVE amount
  const credits = payment.credits_granted || 0;

  await admin.rpc("deduct_credits", {
    p_user_id: payment.user_id,
    p_amount: -credits,
    p_desc: `Top-up approved: ${payment.amount_mmk} MMK (${payment.payment_method})`,
  });

  await admin
    .from("payments")
    .update({
      status: "approved",
      verified_by: user.id,
      note: note || "Approved",
    })
    .eq("id", payment_id);

  return NextResponse.json({ success: true, credits_added: credits });
}
