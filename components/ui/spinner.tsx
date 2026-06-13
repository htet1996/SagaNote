import { LogoMark } from "@/components/shared/Logo";

/**
 * Simple circular spinner.
 */
export function Spinner({
  size = 18,
  className,
}: {
  size?: number;
  className?: string;
}) {
  return (
    <span
      className={`animate-spin-slow ${className || ""}`}
      style={{
        width: size,
        height: size,
        borderRadius: "50%",
        border: "2px solid var(--color-border-light)",
        borderTopColor: "var(--color-text-1)",
        display: "inline-block",
      }}
    />
  );
}

/**
 * Three bouncing dots — used for "AI thinking" and full-screen loaders.
 */
export function LoadingDots({ size = 8 }: { size?: number }) {
  return (
    <span style={{ display: "inline-flex", gap: 5, alignItems: "center" }}>
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className="animate-bounce-dot"
          style={{
            width: size,
            height: size,
            borderRadius: "50%",
            background: "currentColor",
            animationDelay: `${i * 0.16}s`,
          }}
        />
      ))}
    </span>
  );
}

/**
 * Full-screen branded loader (logo + dots).
 */
export function FullPageLoader({ label }: { label?: string }) {
  return (
    <div
      style={{
        minHeight: "60vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 18,
        color: "var(--color-text-2)",
      }}
    >
      <LogoMark size={44} />
      <LoadingDots />
      {label && (
        <span style={{ fontSize: "0.8125rem", color: "var(--color-text-3)" }}>
          {label}
        </span>
      )}
    </div>
  );
}
