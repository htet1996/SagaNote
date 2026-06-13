"use client";

/**
 * Live waveform visualizer — 20 bars driven by amplitude levels (0..1).
 * When `levels` are all zero (idle), shows a flat baseline.
 */
export function Waveform({
  levels,
  height = 56,
  color = "var(--color-primary)",
}: {
  levels: number[];
  height?: number;
  color?: string;
}) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 3,
        height,
      }}
    >
      {levels.map((lvl, i) => {
        const barHeight = Math.max(3, lvl * height);
        return (
          <div
            key={i}
            style={{
              width: 4,
              height: barHeight,
              borderRadius: 99,
              background: color,
              transition: "height 0.08s linear",
            }}
          />
        );
      })}
    </div>
  );
}

/**
 * Static animated bars (used when we want motion without a live signal,
 * e.g. while the AI is speaking).
 */
export function AnimatedBars({
  count = 20,
  height = 40,
  color = "var(--color-primary)",
}: {
  count?: number;
  height?: number;
  color?: string;
}) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 3,
        height,
      }}
    >
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="animate-wave-bar"
          style={{
            width: 4,
            height: height * 0.7,
            borderRadius: 99,
            background: color,
            animationDelay: `${(i % 10) * 0.08}s`,
          }}
        />
      ))}
    </div>
  );
}
