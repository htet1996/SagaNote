"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";

interface LogoProps {
  // height in px for the mark
  size?: number;
  // show the "SagaNote" wordmark beside the icon
  withText?: boolean;
  // render in white (for dark backgrounds)
  light?: boolean;
  className?: string;
}

// Inline SVG feather — used ONLY as a fallback if the real image is missing.
function FallbackFeather({ size, stroke }: { size: number; stroke: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 512 512"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label="SagaNote"
    >
      <g
        stroke={stroke}
        strokeWidth={18}
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      >
        <path d="M196 250 C 210 150, 280 80, 372 64 C 360 150, 320 210, 250 250 C 300 234, 340 196, 360 150 C 352 210, 318 252, 262 276 C 300 268, 330 244, 348 214 C 340 256, 308 286, 262 300 Z" />
        <path d="M360 92 C 300 168, 252 232, 214 300 C 196 332, 184 360, 176 386" />
        <path d="M300 160 L 262 196" />
        <path d="M250 252 L 216 286" />
        <path d="M176 386 L 160 410 L 184 402 Z" fill={stroke} />
        <path d="M150 420 C 240 470, 380 470, 430 392 C 446 366, 444 326, 412 308 C 392 296, 366 300, 352 320 C 344 332, 346 348, 360 354" />
        <path d="M150 420 C 176 436, 210 444, 248 446" />
      </g>
    </svg>
  );
}

/**
 * SagaNote logo MARK (icon only).
 * Renders the real logo image (public/logo-icon.png). If that file is missing,
 * it falls back to an inline SVG so the UI never shows a broken image.
 */
export function LogoMark({
  size = 32,
  light = false,
  className,
}: {
  size?: number;
  light?: boolean;
  className?: string;
}) {
  const [failed, setFailed] = useState(false);

  if (failed) {
    return <FallbackFeather size={size} stroke={light ? "#FFFFFF" : "#111111"} />;
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src="/logo-icon.svg"
      alt="SagaNote"
      height={size}
      style={{
        height: size,
        width: "auto",
        objectFit: "contain",
        display: "block",
        // invert a black icon to white on dark surfaces when requested
        filter: light ? "invert(1) brightness(2)" : "none",
      }}
      className={className}
      onError={() => setFailed(true)}
    />
  );
}

export function Logo({
  size = 32,
  withText = true,
  light = false,
  className,
}: LogoProps) {
  return (
    <span className={cn("inline-flex items-center gap-2", className)}>
      <LogoMark size={size} light={light} />
      {withText && (
        <span
          style={{
            // Match the site web font (Inter), not a serif face.
            fontFamily: "var(--font-sans)",
            fontWeight: 600,
            fontSize: size * 0.6,
            letterSpacing: "-0.02em",
            color: light ? "#FFFFFF" : "#111111",
            lineHeight: 1,
          }}
        >
          SagaNote
        </span>
      )}
    </span>
  );
}
