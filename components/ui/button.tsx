"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

type Variant = "primary" | "secondary" | "outline" | "ghost" | "danger";
type Size = "sm" | "md" | "lg" | "icon";

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  fullWidth?: boolean;
}

/**
 * Monochrome button. Hover handled via JS handlers (per Next.js 16 rule 7)
 * so inline styles don't clash with Tailwind hover variants.
 */
export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = "primary",
      size = "md",
      loading = false,
      fullWidth = false,
      disabled,
      children,
      style,
      ...props
    },
    ref
  ) => {
    const sizes: Record<Size, React.CSSProperties> = {
      sm: { height: 34, padding: "0 12px", fontSize: "0.8125rem" },
      md: { height: 40, padding: "0 16px", fontSize: "0.875rem" },
      lg: { height: 48, padding: "0 22px", fontSize: "0.9375rem" },
      icon: { height: 40, width: 40, padding: 0 },
    };

    const base: React.CSSProperties = {
      display: "inline-flex",
      alignItems: "center",
      justifyContent: "center",
      gap: 8,
      borderRadius: 8,
      fontWeight: 500,
      border: "1px solid transparent",
      transition: "background 0.15s ease, opacity 0.15s ease, border 0.15s ease",
      cursor: disabled || loading ? "not-allowed" : "pointer",
      opacity: disabled || loading ? 0.55 : 1,
      width: fullWidth ? "100%" : sizes[size].width,
      whiteSpace: "nowrap",
      ...sizes[size],
    };

    const variants: Record<
      Variant,
      { rest: React.CSSProperties; hoverBg: string }
    > = {
      primary: {
        rest: { background: "#111111", color: "#ffffff" },
        hoverBg: "#000000",
      },
      secondary: {
        rest: {
          background: "var(--color-secondary)",
          color: "#111111",
          border: "1px solid var(--color-border-light)",
        },
        hoverBg: "var(--color-hover-light)",
      },
      outline: {
        rest: {
          background: "transparent",
          color: "inherit",
          border: "1px solid var(--color-border-light)",
        },
        hoverBg: "var(--color-hover-light)",
      },
      ghost: {
        rest: { background: "transparent", color: "inherit" },
        hoverBg: "var(--color-hover-light)",
      },
      danger: {
        rest: {
          background: "transparent",
          color: "#111111",
          border: "1px solid var(--color-border-light)",
        },
        hoverBg: "#fee",
      },
    };

    const v = variants[variant];

    return (
      <button
        ref={ref}
        className={cn(className)}
        disabled={disabled || loading}
        {...props}
        style={{ ...base, ...v.rest, ...style }}
        onMouseOver={(e) => {
          if (!disabled && !loading)
            e.currentTarget.style.background = v.hoverBg;
          props.onMouseOver?.(e);
        }}
        onMouseOut={(e) => {
          if (!disabled && !loading)
            e.currentTarget.style.background = (v.rest.background ||
              "transparent") as string;
          props.onMouseOut?.(e);
        }}
      >
        {loading && (
          <span
            className="animate-spin-slow"
            style={{
              width: 14,
              height: 14,
              borderRadius: "50%",
              border: "2px solid currentColor",
              borderTopColor: "transparent",
              display: "inline-block",
            }}
          />
        )}
        {children}
      </button>
    );
  }
);

Button.displayName = "Button";
