"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { Mic, FileText, Bot } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Logo } from "@/components/shared/Logo";
import { Spinner } from "@/components/ui/spinner";

const PREVIEW = [
  { icon: Mic, label: "Record voice & meetings in one tap" },
  { icon: FileText, label: "AI transcription + Burmese translation" },
  { icon: Bot, label: "Talk to an AI agent that knows your notes" },
];

function LoginInner() {
  const params = useSearchParams();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (params.get("error") === "auth_failed") {
      toast.error("Sign in failed. Please try again.");
    }
  }, [params]);

  const signInWithGoogle = async () => {
    setLoading(true);
    try {
      const supabase = createClient();
      const redirect = params.get("redirect") || "/dashboard";
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/auth/callback?redirect=${encodeURIComponent(
            redirect
          )}`,
        },
      });
      if (error) {
        toast.error(error.message);
        setLoading(false);
      }
      // On success the browser redirects to Google.
    } catch {
      toast.error("Could not start sign in.");
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 20,
        background: "var(--color-secondary)",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: 420,
          background: "var(--color-white)",
          border: "1px solid var(--color-border-light)",
          borderRadius: 16,
          padding: "36px 32px",
          boxShadow: "0 4px 24px rgba(0,0,0,0.06)",
        }}
      >
        <div style={{ display: "flex", justifyContent: "center" }}>
          <Logo size={40} />
        </div>

        <h1
          style={{
            textAlign: "center",
            fontSize: "1.5rem",
            marginTop: 24,
          }}
        >
          Welcome to SagaNote
        </h1>
        <p
          style={{
            textAlign: "center",
            color: "var(--color-text-2)",
            marginTop: 8,
            fontSize: "0.875rem",
          }}
        >
          Sign in to turn your voice into structured Notion notes.
        </p>

        {/* Google button */}
        <button
          onClick={signInWithGoogle}
          disabled={loading}
          style={{
            marginTop: 28,
            width: "100%",
            height: 46,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 10,
            borderRadius: 8,
            border: "1px solid var(--color-border-light)",
            background: "var(--color-white)",
            color: "var(--color-text-1)",
            fontSize: "0.9375rem",
            fontWeight: 500,
            cursor: loading ? "not-allowed" : "pointer",
            opacity: loading ? 0.6 : 1,
          }}
          onMouseOver={(e) =>
            (e.currentTarget.style.background = "var(--color-hover-light)")
          }
          onMouseOut={(e) =>
            (e.currentTarget.style.background = "var(--color-white)")
          }
        >
          {loading ? (
            <Spinner size={18} />
          ) : (
            <svg width="18" height="18" viewBox="0 0 48 48">
              <path
                fill="#FFC107"
                d="M43.611 20.083H42V20H24v8h11.303c-1.649 4.657-6.08 8-11.303 8-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 12.955 4 4 12.955 4 24s8.955 20 20 20 20-8.955 20-20c0-1.341-.138-2.65-.389-3.917z"
              />
              <path
                fill="#FF3D00"
                d="M6.306 14.691l6.571 4.819C14.655 15.108 18.961 12 24 12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 16.318 4 9.656 8.337 6.306 14.691z"
              />
              <path
                fill="#4CAF50"
                d="M24 44c5.166 0 9.86-1.977 13.409-5.192l-6.19-5.238C29.211 35.091 26.715 36 24 36c-5.202 0-9.619-3.317-11.283-7.946l-6.522 5.025C9.505 39.556 16.227 44 24 44z"
              />
              <path
                fill="#1976D2"
                d="M43.611 20.083H42V20H24v8h11.303c-.792 2.237-2.231 4.166-4.087 5.571.001-.001 6.19 5.238 6.19 5.238C36.971 39.205 44 34 44 24c0-1.341-.138-2.65-.389-3.917z"
              />
            </svg>
          )}
          {loading ? "Signing in…" : "Continue with Google"}
        </button>

        {/* Feature preview */}
        <div style={{ marginTop: 28, display: "grid", gap: 12 }}>
          {PREVIEW.map((p) => {
            const Icon = p.icon;
            return (
              <div
                key={p.label}
                style={{ display: "flex", gap: 10, alignItems: "center" }}
              >
                <span
                  style={{
                    width: 28,
                    height: 28,
                    flexShrink: 0,
                    borderRadius: 8,
                    background: "var(--color-secondary)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "var(--color-text-1)",
                  }}
                >
                  <Icon size={15} />
                </span>
                <span
                  style={{ fontSize: "0.8125rem", color: "var(--color-text-2)" }}
                >
                  {p.label}
                </span>
              </div>
            );
          })}
        </div>

        <p
          style={{
            marginTop: 28,
            textAlign: "center",
            fontSize: "0.6875rem",
            color: "var(--color-text-3)",
            lineHeight: 1.6,
          }}
        >
          By continuing you agree to our{" "}
          <a href="/terms" style={{ textDecoration: "underline" }}>
            Terms
          </a>{" "}
          and{" "}
          <a href="/privacy" style={{ textDecoration: "underline" }}>
            Privacy Policy
          </a>
          .
        </p>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div
          style={{
            minHeight: "100vh",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Spinner size={28} />
        </div>
      }
    >
      <LoginInner />
    </Suspense>
  );
}
