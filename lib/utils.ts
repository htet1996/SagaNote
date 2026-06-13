import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Merge Tailwind classes safely (used by shadcn-style components).
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Format a number of seconds as MM:SS (used for timers + credit display).
 */
export function formatDuration(totalSeconds: number): string {
  const safe = Math.max(0, Math.floor(totalSeconds || 0));
  const minutes = Math.floor(safe / 60);
  const seconds = safe % 60;
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

/**
 * Human-friendly minute label for credits (e.g. 1800 -> "30 min").
 */
export function creditsToMinutes(credits: number): number {
  return Math.floor((credits || 0) / 60);
}

/**
 * Format MMK currency with thousands separators.
 */
export function formatMMK(amount: number): string {
  return `${(amount || 0).toLocaleString("en-US")} MMK`;
}

/**
 * Format bytes into a readable size string.
 */
export function formatBytes(bytes: number): string {
  if (!bytes) return "0 B";
  const units = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${units[i]}`;
}

/**
 * Lightweight "time ago" formatter (avoids a date-fns import where not needed).
 */
export function timeAgo(dateInput: string | Date): string {
  const date = typeof dateInput === "string" ? new Date(dateInput) : dateInput;
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);

  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  const weeks = Math.floor(days / 7);
  if (weeks < 4) return `${weeks}w ago`;
  return date.toLocaleDateString();
}

/**
 * Truncate text to a max length with an ellipsis.
 */
export function truncate(text: string, max = 120): string {
  if (!text) return "";
  return text.length > max ? `${text.slice(0, max).trim()}…` : text;
}

/**
 * Time-based greeting used on the dashboard.
 */
export function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

/**
 * Detect whether a string is "mostly" Burmese (Myanmar Unicode block).
 * Used by the TTS endpoint to pick a language per sentence.
 */
export function isBurmese(text: string): boolean {
  if (!text) return false;
  const burmeseChars = (text.match(/[က-႟]/g) || []).length;
  const totalChars = (text.match(/\S/g) || []).length || 1;
  return burmeseChars / totalChars > 0.15;
}
