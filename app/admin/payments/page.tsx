"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Check, X, ExternalLink, ShieldAlert } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Logo } from "@/components/shared/Logo";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FullPageLoader } from "@/components/ui/spinner";
import { formatMMK, formatDuration, timeAgo } from "@/lib/utils";
import type { PaymentWithUser } from "@/types";

export default function AdminPaymentsPage() {
  const router = useRouter();
  const [authorized, setAuthorized] = useState<boolean | null>(null);
  const [payments, setPayments] = useState<PaymentWithUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [actingId, setActingId] = useState<string | null>(null);

  const load = async () => {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      router.replace("/login");
      return;
    }

    const { data: profile } = await supabase
      .from("users")
      .select("is_admin")
      .eq("id", user.id)
      .single();

    if (!profile?.is_admin) {
      setAuthorized(false);
      setLoading(false);
      return;
    }
    setAuthorized(true);

    const { data } = await supabase
      .from("payments")
      .select("*, user:users!payments_user_id_fkey(email, full_name)")
      .order("created_at", { ascending: false })
      .limit(100);

    setPayments((data as PaymentWithUser[]) || []);
    setLoading(false);
  };

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const review = async (id: string, action: "approve" | "reject") => {
    setActingId(id);
    try {
      const res = await fetch("/api/payment", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ payment_id: id, action }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed");
      toast.success(action === "approve" ? "Approved & credits added" : "Rejected");
      await load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed");
    } finally {
      setActingId(null);
    }
  };

  if (loading) return <FullPageLoader label="Loading admin…" />;

  if (!authorized) {
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 12,
          textAlign: "center",
          padding: 20,
        }}
      >
        <ShieldAlert size={36} style={{ color: "var(--color-text-3)" }} />
        <h1 style={{ fontSize: "1.5rem" }}>Access denied</h1>
        <p style={{ color: "var(--color-text-2)" }}>
          You don&apos;t have permission to view this page.
        </p>
        <Button variant="outline" onClick={() => router.push("/dashboard")}>
          Go to dashboard
        </Button>
      </div>
    );
  }

  const pending = payments.filter((p) => p.status === "pending");
  const history = payments.filter((p) => p.status !== "pending");

  return (
    <div style={{ minHeight: "100vh", background: "var(--color-secondary)" }}>
      <header
        style={{
          borderBottom: "1px solid var(--color-border-light)",
          padding: "14px 20px",
          background: "var(--color-white)",
        }}
      >
        <div
          style={{
            maxWidth: 900,
            margin: "0 auto",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <Logo size={28} className="logo-invert-dark" />
          <Badge variant="solid">Admin</Badge>
        </div>
      </header>

      <main style={{ maxWidth: 900, margin: "0 auto", padding: "32px 20px 70px" }}>
        <h1>Payment verification</h1>
        <p style={{ color: "var(--color-text-2)", marginTop: 6 }}>
          Review and approve pending top-ups.
        </p>

        {/* Pending */}
        <h2 style={{ fontSize: "1.125rem", marginTop: 30 }}>
          Pending ({pending.length})
        </h2>
        <div style={{ marginTop: 14, display: "grid", gap: 12 }}>
          {pending.length === 0 ? (
            <EmptyRow text="No pending payments." />
          ) : (
            pending.map((p) => (
              <PaymentRow
                key={p.id}
                p={p}
                acting={actingId === p.id}
                onApprove={() => review(p.id, "approve")}
                onReject={() => review(p.id, "reject")}
              />
            ))
          )}
        </div>

        {/* History */}
        <h2 style={{ fontSize: "1.125rem", marginTop: 36 }}>History</h2>
        <div style={{ marginTop: 14, display: "grid", gap: 10 }}>
          {history.length === 0 ? (
            <EmptyRow text="No history yet." />
          ) : (
            history.map((p) => (
              <div
                key={p.id}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  padding: "14px 16px",
                  borderRadius: 12,
                  border: "1px solid var(--color-border-light)",
                  background: "var(--color-white)",
                }}
              >
                <div>
                  <div style={{ fontWeight: 500, fontSize: "0.875rem" }}>
                    {p.user?.full_name || p.user?.email || "User"}
                  </div>
                  <div
                    style={{ fontSize: "0.75rem", color: "var(--color-text-3)" }}
                  >
                    {formatMMK(p.amount_mmk)} · {p.payment_method} ·{" "}
                    {timeAgo(p.created_at)}
                  </div>
                </div>
                <Badge variant={p.status === "approved" ? "solid" : "outline"}>
                  {p.status}
                </Badge>
              </div>
            ))
          )}
        </div>
      </main>
    </div>
  );
}

function PaymentRow({
  p,
  acting,
  onApprove,
  onReject,
}: {
  p: PaymentWithUser;
  acting: boolean;
  onApprove: () => void;
  onReject: () => void;
}) {
  return (
    <div
      style={{
        padding: 18,
        borderRadius: 12,
        border: "1px solid var(--color-border-light)",
        background: "var(--color-white)",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          gap: 12,
          flexWrap: "wrap",
        }}
      >
        <div>
          <div style={{ fontWeight: 500 }}>
            {p.user?.full_name || "User"}
          </div>
          <div style={{ fontSize: "0.75rem", color: "var(--color-text-3)" }}>
            {p.user?.email}
          </div>
          <div
            style={{
              marginTop: 10,
              display: "flex",
              gap: 8,
              flexWrap: "wrap",
              alignItems: "center",
            }}
          >
            <Badge variant="solid">{formatMMK(p.amount_mmk)}</Badge>
            <Badge variant="outline">{p.payment_method}</Badge>
            <span style={{ fontSize: "0.75rem", color: "var(--color-text-3)" }}>
              +{formatDuration(p.credits_granted || 0)} credits
            </span>
            <span style={{ fontSize: "0.75rem", color: "var(--color-text-3)" }}>
              {timeAgo(p.created_at)}
            </span>
          </div>
          {p.screenshot_url && (
            <a
              href={`/api/payment/receipt?id=${p.id}`}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 4,
                fontSize: "0.8125rem",
                marginTop: 10,
                color: "var(--color-text-2)",
                textDecoration: "underline",
              }}
            >
              View screenshot <ExternalLink size={13} />
            </a>
          )}
        </div>

        <div style={{ display: "flex", gap: 8 }}>
          <Button
            variant="outline"
            size="sm"
            onClick={onReject}
            disabled={acting}
          >
            <X size={15} /> Reject
          </Button>
          <Button size="sm" onClick={onApprove} loading={acting}>
            <Check size={15} /> Approve
          </Button>
        </div>
      </div>
    </div>
  );
}

function EmptyRow({ text }: { text: string }) {
  return (
    <div
      style={{
        padding: "24px 16px",
        textAlign: "center",
        border: "1px dashed var(--color-border-light)",
        borderRadius: 12,
        color: "var(--color-text-3)",
        fontSize: "0.875rem",
      }}
    >
      {text}
    </div>
  );
}
