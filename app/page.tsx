"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Mic,
  Monitor,
  Languages,
  FileText,
  ListChecks,
  Bot,
  ArrowRight,
} from "lucide-react";
import { Logo } from "@/components/shared/Logo";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CREDIT_PACKAGES } from "@/lib/constants";
import { formatMMK } from "@/lib/utils";

const FEATURES = [
  {
    icon: Mic,
    title: "Voice Recording",
    desc: "Capture ideas, memos, and thoughts the moment they happen — straight from your microphone.",
  },
  {
    icon: Monitor,
    title: "Meeting Capture",
    desc: "Record meetings and calls directly from your browser tab with system audio.",
  },
  {
    icon: Languages,
    title: "AI Transcription",
    desc: "Gemini 2.5 Flash turns speech into clean, well-punctuated text in seconds.",
  },
  {
    icon: FileText,
    title: "Burmese Translation",
    desc: "Every transcript can be translated into fluent Burmese, side by side with English.",
  },
  {
    icon: ListChecks,
    title: "Meeting Minutes",
    desc: "Automatic summaries, decisions, and action items extracted from any conversation.",
  },
  {
    icon: Bot,
    title: "AI Voice Agent",
    desc: "Talk to an assistant that knows your notes — voice in, voice out, like a phone call.",
  },
];

const STEPS = [
  {
    n: "01",
    title: "Record or Upload",
    desc: "Speak into your mic, capture a meeting, or upload an audio file.",
  },
  {
    n: "02",
    title: "AI Structures It",
    desc: "We transcribe, translate, summarize, and pull out action items automatically.",
  },
  {
    n: "03",
    title: "Saved to Notion",
    desc: "Your structured notes land in your Notion workspace, organized and searchable.",
  },
];

export default function LandingPage() {
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);

  const navLink = (label: string, href: string) => (
    <a
      href={href}
      onClick={() => setMenuOpen(false)}
      style={{
        fontSize: "0.875rem",
        color: "var(--color-text-2)",
        padding: "6px 0",
      }}
      onMouseOver={(e) => (e.currentTarget.style.color = "var(--color-text-1)")}
      onMouseOut={(e) => (e.currentTarget.style.color = "var(--color-text-2)")}
    >
      {label}
    </a>
  );

  return (
    <div style={{ minHeight: "100vh", background: "var(--color-white)" }}>
      {/* ---------- Navbar ---------- */}
      <header
        style={{
          position: "sticky",
          top: 0,
          zIndex: 50,
          background: "rgba(255,255,255,0.85)",
          backdropFilter: "blur(10px)",
          borderBottom: "1px solid var(--color-border-light)",
        }}
      >
        <nav
          style={{
            maxWidth: 1120,
            margin: "0 auto",
            padding: "14px 20px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <Logo size={30} />

          <div
            style={{ display: "flex", alignItems: "center", gap: 28 }}
            className="hidden-mobile"
          >
            {navLink("Features", "#features")}
            {navLink("How it works", "#how")}
            {navLink("Pricing", "#pricing")}
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push("/login")}
            >
              Sign in
            </Button>
            <Button size="sm" onClick={() => router.push("/login")}>
              Get Started Free
            </Button>
          </div>
        </nav>
      </header>

      {/* ---------- Hero ---------- */}
      <section
        style={{
          maxWidth: 880,
          margin: "0 auto",
          padding: "90px 20px 70px",
          textAlign: "center",
        }}
      >
        <Badge variant="outline" style={{ marginBottom: 22 }}>
          AI Voice → Notion · Built for Myanmar
        </Badge>
        <h1
          style={{
            fontSize: "clamp(2.4rem, 6vw, 3.8rem)",
            lineHeight: 1.05,
            letterSpacing: "-0.03em",
            fontWeight: 600,
          }}
        >
          Your Voice, Structured
        </h1>
        <p
          style={{
            marginTop: 22,
            fontSize: "1.0625rem",
            color: "var(--color-text-2)",
            maxWidth: 580,
            marginInline: "auto",
            lineHeight: 1.6,
          }}
        >
          SagaNote turns voice recordings and meetings into clean, organized
          Notion notes — transcribed, translated to Burmese, and summarized by
          AI. Speak freely. We&apos;ll handle the rest.
        </p>
        <div
          style={{
            marginTop: 34,
            display: "flex",
            gap: 12,
            justifyContent: "center",
            flexWrap: "wrap",
          }}
        >
          <Button size="lg" onClick={() => router.push("/login")}>
            Start Free — 30 min included <ArrowRight size={16} />
          </Button>
          <Button
            variant="outline"
            size="lg"
            onClick={() => {
              document
                .getElementById("how")
                ?.scrollIntoView({ behavior: "smooth" });
            }}
          >
            See how it works
          </Button>
        </div>
        <p
          style={{
            marginTop: 16,
            fontSize: "0.75rem",
            color: "var(--color-text-3)",
          }}
        >
          No credit card required · 30 minutes of free transcription
        </p>
      </section>

      {/* ---------- Features ---------- */}
      <section
        id="features"
        style={{ maxWidth: 1120, margin: "0 auto", padding: "40px 20px" }}
      >
        <div style={{ textAlign: "center", marginBottom: 44 }}>
          <h2>Everything you need to capture knowledge</h2>
          <p style={{ color: "var(--color-text-2)", marginTop: 10 }}>
            Six tools, one workflow — from raw speech to organized notes.
          </p>
        </div>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
            gap: 18,
          }}
        >
          {FEATURES.map((f) => {
            const Icon = f.icon;
            return (
              <div
                key={f.title}
                style={{
                  border: "1px solid var(--color-border-light)",
                  borderRadius: 12,
                  padding: 24,
                  background: "var(--color-white)",
                  transition: "box-shadow 0.2s ease, transform 0.2s ease",
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.boxShadow =
                    "0 4px 18px rgba(0,0,0,0.08)";
                  e.currentTarget.style.transform = "translateY(-2px)";
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.boxShadow = "none";
                  e.currentTarget.style.transform = "translateY(0)";
                }}
              >
                <div
                  style={{
                    width: 42,
                    height: 42,
                    borderRadius: 10,
                    background: "var(--color-primary)",
                    color: "#fff",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    marginBottom: 16,
                  }}
                >
                  <Icon size={20} />
                </div>
                <h3 style={{ marginBottom: 8 }}>{f.title}</h3>
                <p style={{ color: "var(--color-text-2)", fontSize: "0.875rem" }}>
                  {f.desc}
                </p>
              </div>
            );
          })}
        </div>
      </section>

      {/* ---------- How it works ---------- */}
      <section
        id="how"
        style={{
          background: "var(--color-secondary)",
          padding: "70px 20px",
          marginTop: 40,
        }}
      >
        <div style={{ maxWidth: 1120, margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: 44 }}>
            <h2>How it works</h2>
            <p style={{ color: "var(--color-text-2)", marginTop: 10 }}>
              Three steps from your voice to a structured note.
            </p>
          </div>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
              gap: 24,
            }}
          >
            {STEPS.map((s) => (
              <div key={s.n}>
                <div
                  style={{
                    fontSize: "2.5rem",
                    fontWeight: 600,
                    color: "var(--color-text-3)",
                    letterSpacing: "-0.03em",
                  }}
                >
                  {s.n}
                </div>
                <h3 style={{ marginTop: 8, marginBottom: 8 }}>{s.title}</h3>
                <p style={{ color: "var(--color-text-2)" }}>{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ---------- Pricing ---------- */}
      <section
        id="pricing"
        style={{ maxWidth: 1120, margin: "0 auto", padding: "70px 20px" }}
      >
        <div style={{ textAlign: "center", marginBottom: 44 }}>
          <h2>Simple, credit-based pricing</h2>
          <p style={{ color: "var(--color-text-2)", marginTop: 10 }}>
            Pay only for what you transcribe. 1 minute = 60 credits.
          </p>
        </div>

        {/* Free trial highlight */}
        <div
          style={{
            border: "1px solid var(--color-primary)",
            borderRadius: 12,
            padding: 28,
            marginBottom: 24,
            display: "flex",
            flexWrap: "wrap",
            justifyContent: "space-between",
            alignItems: "center",
            gap: 16,
            background: "var(--color-primary)",
            color: "#fff",
          }}
        >
          <div>
            <h3 style={{ color: "#fff" }}>Free Trial</h3>
            <p style={{ color: "rgba(255,255,255,0.7)", marginTop: 4 }}>
              30 minutes of transcription, free on signup. No card needed.
            </p>
          </div>
          <Button
            variant="secondary"
            size="lg"
            onClick={() => router.push("/login")}
          >
            Claim Free Trial
          </Button>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(230px, 1fr))",
            gap: 18,
          }}
        >
          {CREDIT_PACKAGES.map((pkg) => (
            <div
              key={pkg.id}
              style={{
                position: "relative",
                border: pkg.popular
                  ? "1.5px solid var(--color-primary)"
                  : "1px solid var(--color-border-light)",
                borderRadius: 12,
                padding: 24,
                background: "var(--color-white)",
                textAlign: "center",
              }}
            >
              {pkg.popular && (
                <Badge
                  variant="solid"
                  style={{
                    position: "absolute",
                    top: -10,
                    left: "50%",
                    transform: "translateX(-50%)",
                  }}
                >
                  Most Popular
                </Badge>
              )}
              <div
                style={{
                  fontSize: "1.75rem",
                  fontWeight: 600,
                  letterSpacing: "-0.02em",
                }}
              >
                {formatMMK(pkg.amountMMK)}
              </div>
              <div
                style={{
                  color: "var(--color-text-2)",
                  marginTop: 6,
                  fontSize: "0.875rem",
                }}
              >
                {pkg.minutes} minutes
              </div>
              <Button
                fullWidth
                variant={pkg.popular ? "primary" : "outline"}
                style={{ marginTop: 18 }}
                onClick={() => router.push("/login")}
              >
                Get Started
              </Button>
            </div>
          ))}
        </div>
      </section>

      {/* ---------- Footer ---------- */}
      <footer
        style={{
          borderTop: "1px solid var(--color-border-light)",
          padding: "40px 20px",
        }}
      >
        <div
          style={{
            maxWidth: 1120,
            margin: "0 auto",
            display: "flex",
            flexWrap: "wrap",
            justifyContent: "space-between",
            alignItems: "center",
            gap: 16,
          }}
        >
          <Logo size={26} />
          <div style={{ display: "flex", gap: 20, alignItems: "center" }}>
            {navLink("Privacy Policy", "/privacy")}
            {navLink("Terms", "/terms")}
          </div>
          <p style={{ fontSize: "0.75rem", color: "var(--color-text-3)" }}>
            © {new Date().getFullYear()} SagaNote. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
