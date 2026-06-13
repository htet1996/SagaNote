import * as React from "react";
import { cn } from "@/lib/utils";

const fieldBase: React.CSSProperties = {
  width: "100%",
  borderRadius: 8,
  border: "1px solid var(--color-border-light)",
  background: "var(--color-white)",
  color: "inherit",
  fontSize: "0.875rem",
  outline: "none",
  transition: "border 0.15s ease",
};

export const Input = React.forwardRef<
  HTMLInputElement,
  React.InputHTMLAttributes<HTMLInputElement>
>(({ className, style, ...props }, ref) => {
  return (
    <input
      ref={ref}
      className={cn(className)}
      style={{ ...fieldBase, height: 40, padding: "0 12px", ...style }}
      onFocus={(e) => {
        e.currentTarget.style.border = "1px solid var(--color-primary)";
        props.onFocus?.(e);
      }}
      onBlur={(e) => {
        e.currentTarget.style.border = "1px solid var(--color-border-light)";
        props.onBlur?.(e);
      }}
      {...props}
    />
  );
});
Input.displayName = "Input";

export const Textarea = React.forwardRef<
  HTMLTextAreaElement,
  React.TextareaHTMLAttributes<HTMLTextAreaElement>
>(({ className, style, ...props }, ref) => {
  return (
    <textarea
      ref={ref}
      className={cn(className)}
      style={{
        ...fieldBase,
        padding: "10px 12px",
        minHeight: 100,
        resize: "vertical",
        lineHeight: 1.6,
        ...style,
      }}
      onFocus={(e) => {
        e.currentTarget.style.border = "1px solid var(--color-primary)";
        props.onFocus?.(e);
      }}
      onBlur={(e) => {
        e.currentTarget.style.border = "1px solid var(--color-border-light)";
        props.onBlur?.(e);
      }}
      {...props}
    />
  );
});
Textarea.displayName = "Textarea";

export function Label({
  className,
  style,
  ...props
}: React.LabelHTMLAttributes<HTMLLabelElement>) {
  return (
    <label
      className={cn(className)}
      style={{
        display: "block",
        fontSize: "0.8125rem",
        fontWeight: 500,
        marginBottom: 6,
        color: "var(--color-text-1)",
        ...style,
      }}
      {...props}
    />
  );
}
