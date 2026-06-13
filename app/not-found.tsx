import Link from "next/link";
import { Logo } from "@/components/shared/Logo";
import { Button } from "@/components/ui/button";

export default function NotFound() {
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
      <h1 style={{ fontSize: "3rem", marginTop: 8 }}>404</h1>
      <p style={{ color: "var(--color-text-2)" }}>
        We couldn&apos;t find the page you were looking for.
      </p>
      <Link href="/dashboard">
        <Button style={{ marginTop: 8 }}>Back to dashboard</Button>
      </Link>
    </div>
  );
}
