import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Logo } from "@/components/shared/Logo";

interface LegalSection {
  title: string;
  titleMy: string;
  en: string;
  my: string;
}

/**
 * Shared layout for static legal pages (Privacy, Terms).
 * Renders each section bilingually (English + Burmese).
 */
export function LegalPage({
  heading,
  headingMy,
  updated,
  sections,
}: {
  heading: string;
  headingMy: string;
  updated: string;
  sections: LegalSection[];
}) {
  return (
    <div style={{ minHeight: "100vh", background: "var(--color-white)" }}>
      <header
        style={{
          borderBottom: "1px solid var(--color-border-light)",
          padding: "14px 20px",
        }}
      >
        <div
          style={{
            maxWidth: 760,
            margin: "0 auto",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <Link href="/">
            <Logo size={28} />
          </Link>
          <Link
            href="/"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              fontSize: "0.8125rem",
              color: "var(--color-text-2)",
            }}
          >
            <ArrowLeft size={15} /> Back home
          </Link>
        </div>
      </header>

      <main
        style={{ maxWidth: 760, margin: "0 auto", padding: "48px 20px 80px" }}
      >
        <h1>{heading}</h1>
        <p
          style={{
            fontSize: "1.125rem",
            color: "var(--color-text-2)",
            marginTop: 4,
          }}
        >
          {headingMy}
        </p>
        <p
          style={{
            fontSize: "0.75rem",
            color: "var(--color-text-3)",
            marginTop: 12,
          }}
        >
          Last updated: {updated}
        </p>

        <div style={{ marginTop: 36, display: "grid", gap: 32 }}>
          {sections.map((s, i) => (
            <section key={i}>
              <h2 style={{ fontSize: "1.25rem" }}>
                {i + 1}. {s.title}
              </h2>
              <h3
                style={{
                  color: "var(--color-text-2)",
                  fontWeight: 500,
                  marginTop: 2,
                }}
              >
                {s.titleMy}
              </h3>
              <p
                style={{
                  marginTop: 12,
                  color: "var(--color-text-2)",
                  whiteSpace: "pre-line",
                }}
              >
                {s.en}
              </p>
              <p
                style={{
                  marginTop: 12,
                  color: "var(--color-text-2)",
                  whiteSpace: "pre-line",
                }}
              >
                {s.my}
              </p>
            </section>
          ))}
        </div>
      </main>
    </div>
  );
}
