import * as React from "react";
import { cn } from "@/lib/utils";

type BadgeVariant = "default" | "solid" | "outline" | "muted";

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
}

/**
 * Pill badge — monochrome. `solid` = black bg + white text (active state).
 */
export function Badge({
  className,
  variant = "default",
  style,
  ...props
}: BadgeProps) {
  const variants: Record<BadgeVariant, React.CSSProperties> = {
    default: {
      background: "var(--color-secondary)",
      color: "var(--color-text-1)",
      border: "1px solid var(--color-border-light)",
    },
    solid: { background: "#111111", color: "#ffffff" },
    outline: {
      background: "transparent",
      color: "var(--color-text-2)",
      border: "1px solid var(--color-border-light)",
    },
    muted: {
      background: "var(--color-secondary)",
      color: "var(--color-text-3)",
    },
  };

  return (
    <span
      className={cn(className)}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 4,
        fontSize: "0.6875rem",
        fontWeight: 500,
        padding: "3px 10px",
        borderRadius: 99,
        lineHeight: 1.4,
        whiteSpace: "nowrap",
        ...variants[variant],
        ...style,
      }}
      {...props}
    />
  );
}
