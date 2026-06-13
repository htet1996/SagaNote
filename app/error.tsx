"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/shared/Logo";

/**
 * Global error boundary for the App Router.
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log to the console; in production wire this to a reporting service.
    console.error(error);
  }, [error]);

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 16,
        padding: 20,
        textAlign: "center",
        background: "var(--color-secondary)",
      }}
    >
      <Logo size={34} className="logo-invert-dark" />
      <h1 style={{ fontSize: "1.5rem", marginTop: 8 }}>Something went wrong</h1>
      <p style={{ color: "var(--color-text-2)", maxWidth: 380 }}>
        An unexpected error occurred. You can try again, or head back to your
        dashboard.
      </p>
      <div style={{ display: "flex", gap: 10, marginTop: 8 }}>
        <Button variant="outline" onClick={() => (window.location.href = "/dashboard")}>
          Go to dashboard
        </Button>
        <Button onClick={reset}>Try again</Button>
      </div>
    </div>
  );
}
