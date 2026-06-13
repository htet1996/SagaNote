"use client";

import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import {
  Check,
  UploadCloud,
  Copy,
  ArrowLeft,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useUserStore } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Spinner } from "@/components/ui/spinner";
import {
  CREDIT_PACKAGES,
  PAYMENT_METHODS,
  PAYMENT_RECEIVER,
} from "@/lib/constants";
import { formatMMK, formatDuration, timeAgo } from "@/lib/utils";
import type { CreditLog, CreditPackage, PaymentMethodInfo } from "@/types";

export default function CreditsPage() {
  const { profile } = useUserStore();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [pkg, setPkg] = useState<CreditPackage | null>(null);
  const [method, setMethod] = useState<PaymentMethodInfo | null>(null);
  const [screenshot, setScreenshot] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [logs, setLogs] = useState<CreditLog[] | null>(null);

  const loadLogs = async () => {
    const supabase = createClient();
    const { data } = await supabase
      .from("credit_logs")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(30);
    setLogs((data as CreditLog[]) || []);
  };

  useEffect(() => {
    void loadLogs();
  }, [submitted]);

  const copyPhone = () => {
    navigator.clipboard.writeText(PAYMENT_RECEIVER.phone);
    toast.success("Phone number copied");
  };

  const submit = async () => {
    if (!pkg || !method) return;
    setSubmitting(true);
    try {
      let screenshotPath: string | null = null;

      // Upload screenshot to the PRIVATE "receipts" bucket. We store the
      // object PATH (not a public URL); admins view it via a signed URL.
      if (screenshot) {
        const supabase = createClient();
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (user) {
          const ext = screenshot.name.split(".").pop() || "jpg";
          const path = `${user.id}/${Date.now()}.${ext}`;
          const { error: upErr } = await supabase.storage
            .from("receipts")
            .upload(path, screenshot, {
              contentType: screenshot.type,
              upsert: false,
            });
          if (!upErr) {
            screenshotPath = path;
          }
        }
      }

      const res = await fetch("/api/payment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          package_id: pkg.id,
          payment_method: method.id,
          screenshot_url: screenshotPath,
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to submit");
      }
      setSubmitted(true);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to submit");
    } finally {
      setSubmitting(false);
    }
  };

  const reset = () => {
    setStep(1);
    setPkg(null);
    setMethod(null);
    setScreenshot(null);
    setSubmitted(false);
  };

  // ---------- Success state ----------
  if (submitted) {
    return (
      <div style={{ maxWidth: 560, margin: "0 auto", textAlign: "center" }}>
        <div
          style={{
            width: 64,
            height: 64,
            borderRadius: "50%",
            background: "var(--color-primary)",
            color: "#fff",
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            marginTop: 30,
          }}
        >
          <Check size={30} />
        </div>
        <h1 style={{ marginTop: 20 }}>Payment submitted!</h1>
        <p style={{ color: "var(--color-text-2)", marginTop: 10 }}>
          We&apos;ll verify your payment within <strong>1–24 hours</strong> and
          add <strong>{pkg ? pkg.minutes : ""} minutes</strong> to your account.
          You&apos;ll see the credits appear in your balance once approved.
        </p>
        <Button onClick={reset} style={{ marginTop: 24 }}>
          Done
        </Button>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 640, margin: "0 auto" }}>
      <h1>Credits</h1>
      <p style={{ color: "var(--color-text-2)", marginTop: 6 }}>
        Top up your balance to keep transcribing. Current balance:{" "}
        <strong>{formatDuration(profile?.credits_balance ?? 0)}</strong>
      </p>

      {/* Progress indicator */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          marginTop: 24,
        }}
      >
        {[1, 2, 3].map((n) => (
          <div
            key={n}
            style={{ display: "flex", alignItems: "center", flex: 1 }}
          >
            <div
              style={{
                width: 26,
                height: 26,
                flexShrink: 0,
                borderRadius: "50%",
                fontSize: "0.75rem",
                fontWeight: 600,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                background:
                  step >= n ? "var(--color-primary)" : "var(--color-secondary)",
                color: step >= n ? "#fff" : "var(--color-text-3)",
              }}
            >
              {step > n ? <Check size={13} /> : n}
            </div>
            {n < 3 && (
              <div
                style={{
                  flex: 1,
                  height: 2,
                  background:
                    step > n
                      ? "var(--color-primary)"
                      : "var(--color-border-light)",
                  margin: "0 6px",
                }}
              />
            )}
          </div>
        ))}
      </div>

      <div style={{ marginTop: 24 }}>
        {/* STEP 1 — package */}
        {step === 1 && (
          <div>
            <h2 style={{ fontSize: "1.125rem", marginBottom: 14 }}>
              Choose a package
            </h2>
            <div style={{ display: "grid", gap: 12 }}>
              {CREDIT_PACKAGES.map((p) => (
                <button
                  key={p.id}
                  onClick={() => {
                    setPkg(p);
                    setStep(2);
                  }}
                  style={{
                    position: "relative",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    padding: 18,
                    borderRadius: 12,
                    border: p.popular
                      ? "1.5px solid var(--color-primary)"
                      : "1px solid var(--color-border-light)",
                    background: "var(--color-white)",
                    color: "inherit",
                    textAlign: "left",
                  }}
                  onMouseOver={(e) =>
                    (e.currentTarget.style.background = "var(--color-secondary)")
                  }
                  onMouseOut={(e) =>
                    (e.currentTarget.style.background = "var(--color-white)")
                  }
                >
                  {p.popular && (
                    <Badge
                      variant="solid"
                      style={{ position: "absolute", top: -10, right: 16 }}
                    >
                      Popular
                    </Badge>
                  )}
                  <div>
                    <div style={{ fontWeight: 600, fontSize: "1.125rem" }}>
                      {formatMMK(p.amountMMK)}
                    </div>
                    <div
                      style={{
                        fontSize: "0.8125rem",
                        color: "var(--color-text-3)",
                      }}
                    >
                      {p.minutes} minutes of transcription
                    </div>
                  </div>
                  <ArrowLeft
                    size={18}
                    style={{ transform: "rotate(180deg)", opacity: 0.5 }}
                  />
                </button>
              ))}
            </div>
          </div>
        )}

        {/* STEP 2 — method */}
        {step === 2 && (
          <div>
            <BackBtn onClick={() => setStep(1)} />
            <h2 style={{ fontSize: "1.125rem", marginBottom: 14 }}>
              Choose payment method
            </h2>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: 12,
              }}
            >
              {PAYMENT_METHODS.map((m) => (
                <button
                  key={m.id}
                  onClick={() => {
                    setMethod(m);
                    setStep(3);
                  }}
                  style={{
                    padding: "22px 14px",
                    borderRadius: 12,
                    border: "1px solid var(--color-border-light)",
                    background: "var(--color-white)",
                    color: "inherit",
                    fontWeight: 500,
                    fontSize: "0.9375rem",
                  }}
                  onMouseOver={(e) =>
                    (e.currentTarget.style.background = "var(--color-secondary)")
                  }
                  onMouseOut={(e) =>
                    (e.currentTarget.style.background = "var(--color-white)")
                  }
                >
                  {m.name}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* STEP 3 — pay + confirm */}
        {step === 3 && pkg && method && (
          <div>
            <BackBtn onClick={() => setStep(2)} />
            <h2 style={{ fontSize: "1.125rem", marginBottom: 14 }}>
              Pay with {method.name}
            </h2>

            <div
              style={{
                padding: 20,
                borderRadius: 12,
                border: "1px solid var(--color-border-light)",
                background: "var(--color-white)",
              }}
            >
              {/* QR */}
              <div style={{ textAlign: "center" }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={method.qr}
                  alt={`${method.name} QR`}
                  onError={(e) => {
                    // Graceful fallback until the real QR screenshot is added.
                    e.currentTarget.src =
                      "data:image/svg+xml;utf8," +
                      encodeURIComponent(
                        `<svg xmlns='http://www.w3.org/2000/svg' width='180' height='180'><rect width='180' height='180' fill='#f5f5f5'/><text x='50%' y='48%' font-family='sans-serif' font-size='12' fill='#999' text-anchor='middle'>${method.name}</text><text x='50%' y='60%' font-family='sans-serif' font-size='10' fill='#bbb' text-anchor='middle'>QR placeholder</text></svg>`
                      );
                  }}
                  style={{
                    width: 180,
                    height: 180,
                    objectFit: "contain",
                    borderRadius: 12,
                    border: "1px solid var(--color-border-light)",
                    background: "#fff",
                    margin: "0 auto",
                  }}
                />
              </div>

              {/* Receiver */}
              <div
                style={{
                  marginTop: 18,
                  display: "grid",
                  gap: 8,
                  fontSize: "0.875rem",
                }}
              >
                <Row label="Receiver" value={PAYMENT_RECEIVER.name} />
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <span style={{ color: "var(--color-text-3)" }}>Phone</span>
                  <span
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 6,
                      fontWeight: 500,
                    }}
                  >
                    {PAYMENT_RECEIVER.phone}
                    <button
                      onClick={copyPhone}
                      aria-label="Copy phone"
                      style={{
                        background: "transparent",
                        border: "none",
                        color: "var(--color-text-3)",
                        padding: 2,
                      }}
                    >
                      <Copy size={13} />
                    </button>
                  </span>
                </div>
                <Row label="Package" value={`${pkg.minutes} minutes`} />
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    paddingTop: 8,
                    borderTop: "1px solid var(--color-border-light)",
                  }}
                >
                  <span style={{ color: "var(--color-text-3)" }}>
                    Amount to pay
                  </span>
                  <span style={{ fontWeight: 600, fontSize: "1rem" }}>
                    {formatMMK(pkg.amountMMK)}
                  </span>
                </div>
              </div>
            </div>

            {/* Screenshot upload */}
            <div style={{ marginTop: 16 }}>
              <div
                onClick={() => fileInputRef.current?.click()}
                style={{
                  border: "2px dashed var(--color-border-light)",
                  borderRadius: 12,
                  padding: "24px 16px",
                  textAlign: "center",
                  cursor: "pointer",
                }}
              >
                {screenshot ? (
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: 8,
                      fontSize: "0.875rem",
                    }}
                  >
                    <Check size={16} /> {screenshot.name}
                  </div>
                ) : (
                  <>
                    <UploadCloud
                      size={24}
                      style={{ color: "var(--color-text-3)", margin: "0 auto" }}
                    />
                    <p
                      style={{
                        marginTop: 8,
                        fontSize: "0.8125rem",
                        color: "var(--color-text-2)",
                      }}
                    >
                      Upload payment screenshot
                    </p>
                  </>
                )}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  hidden
                  onChange={(e) => setScreenshot(e.target.files?.[0] || null)}
                />
              </div>
            </div>

            <Button
              onClick={submit}
              loading={submitting}
              fullWidth
              size="lg"
              style={{ marginTop: 16 }}
            >
              Submit for verification
            </Button>
            <p
              style={{
                fontSize: "0.6875rem",
                color: "var(--color-text-3)",
                textAlign: "center",
                marginTop: 10,
              }}
            >
              Credits are added after manual verification (1–24 hours).
            </p>
          </div>
        )}
      </div>

      {/* Credit history */}
      <h2 style={{ fontSize: "1.125rem", marginTop: 40 }}>Credit history</h2>
      <div style={{ marginTop: 14 }}>
        {logs === null ? (
          <div style={{ padding: 30, textAlign: "center" }}>
            <Spinner />
          </div>
        ) : logs.length === 0 ? (
          <p
            style={{
              color: "var(--color-text-3)",
              fontSize: "0.875rem",
              padding: "16px 0",
            }}
          >
            No credit activity yet.
          </p>
        ) : (
          <div style={{ display: "grid", gap: 8 }}>
            {logs.map((log) => (
              <div
                key={log.id}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  padding: "12px 14px",
                  borderRadius: 10,
                  border: "1px solid var(--color-border-light)",
                }}
              >
                <div>
                  <div style={{ fontSize: "0.8125rem", fontWeight: 500 }}>
                    {log.description || log.type}
                  </div>
                  <div
                    style={{
                      fontSize: "0.6875rem",
                      color: "var(--color-text-3)",
                    }}
                  >
                    {timeAgo(log.created_at)}
                  </div>
                </div>
                <div
                  style={{
                    fontWeight: 600,
                    fontSize: "0.875rem",
                    color:
                      log.amount >= 0 ? "var(--color-text-1)" : "var(--color-text-2)",
                  }}
                >
                  {log.amount >= 0 ? "+" : ""}
                  {formatDuration(Math.abs(log.amount))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between" }}>
      <span style={{ color: "var(--color-text-3)" }}>{label}</span>
      <span style={{ fontWeight: 500 }}>{value}</span>
    </div>
  );
}

function BackBtn({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        background: "transparent",
        border: "none",
        color: "var(--color-text-2)",
        fontSize: "0.8125rem",
        marginBottom: 16,
        padding: 0,
      }}
    >
      <ArrowLeft size={15} /> Back
    </button>
  );
}
