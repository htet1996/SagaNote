import * as React from "react";
import { cn } from "@/lib/utils";

/**
 * Card surface — white in light mode, dark-card in dark mode.
 */
export function Card({
  className,
  style,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("sg-card", className)}
      style={{
        background: "var(--color-white)",
        border: "1px solid var(--color-border-light)",
        borderRadius: 12,
        boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
        ...style,
      }}
      {...props}
    />
  );
}

export function CardHeader({
  className,
  style,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={className}
      style={{ padding: "20px 20px 0 20px", ...style }}
      {...props}
    />
  );
}

export function CardContent({
  className,
  style,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={className}
      style={{ padding: 20, ...style }}
      {...props}
    />
  );
}

export function CardTitle({
  className,
  style,
  ...props
}: React.HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h3
      className={className}
      style={{ fontSize: "1.125rem", fontWeight: 500, ...style }}
      {...props}
    />
  );
}

export function CardDescription({
  className,
  style,
  ...props
}: React.HTMLAttributes<HTMLParagraphElement>) {
  return (
    <p
      className={className}
      style={{
        fontSize: "0.875rem",
        color: "var(--color-text-2)",
        marginTop: 4,
        ...style,
      }}
      {...props}
    />
  );
}
