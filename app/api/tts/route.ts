import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { isBurmese } from "@/lib/utils";

export const maxDuration = 60;

// Hard cap on input length to prevent abuse of the TTS proxy.
const MAX_TTS_CHARS = 1500;

interface Segment {
  text: string;
  lang: "my" | "en";
}

/**
 * Split text into sentences, detect language per sentence, and group
 * consecutive same-language sentences together.
 */
function segmentByLanguage(text: string): Segment[] {
  // Split on sentence boundaries (keep Burmese "။" too)
  const sentences = text
    .split(/(?<=[.!?။])\s+|။/g)
    .map((s) => s.trim())
    .filter(Boolean);

  const segments: Segment[] = [];
  for (const sentence of sentences) {
    const lang: "my" | "en" = isBurmese(sentence) ? "my" : "en";
    const last = segments[segments.length - 1];
    if (last && last.lang === lang) {
      last.text += " " + sentence;
    } else {
      segments.push({ text: sentence, lang });
    }
  }
  return segments;
}

/**
 * Split a segment into <=180 char chunks at word boundaries (Google TTS limit).
 */
function chunkText(text: string, max = 180): string[] {
  if (text.length <= max) return [text];
  const chunks: string[] = [];
  const words = text.split(/\s+/);
  let current = "";
  for (const word of words) {
    if ((current + " " + word).trim().length > max) {
      if (current) chunks.push(current.trim());
      current = word;
    } else {
      current = (current + " " + word).trim();
    }
  }
  if (current) chunks.push(current.trim());
  return chunks;
}

/**
 * Fetch a single TTS chunk from Google Translate's tts endpoint.
 */
async function fetchTtsChunk(text: string, lang: string): Promise<Buffer> {
  const url = `https://translate.google.com/translate_tts?ie=UTF-8&q=${encodeURIComponent(
    text
  )}&tl=${lang}&client=tw-ob`;

  const res = await fetch(url, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      Referer: "https://translate.google.com/",
    },
  });

  if (!res.ok) {
    throw new Error(`TTS fetch failed (${res.status})`);
  }
  const arrayBuffer = await res.arrayBuffer();
  return Buffer.from(arrayBuffer);
}

/**
 * POST /api/tts
 * Body: { text }. Auto-detects language per sentence and returns audio/mpeg.
 */
export async function POST(request: NextRequest) {
  // Require an authenticated user — this is not an open proxy.
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: { text?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  const text = (body.text || "").trim().slice(0, MAX_TTS_CHARS);
  if (!text) {
    return NextResponse.json({ error: "No text provided" }, { status: 400 });
  }

  try {
    const segments = segmentByLanguage(text);
    const buffers: Buffer[] = [];

    for (const segment of segments) {
      const chunks = chunkText(segment.text);
      for (const chunk of chunks) {
        if (!chunk.trim()) continue;
        const buf = await fetchTtsChunk(chunk, segment.lang);
        buffers.push(buf);
      }
    }

    if (buffers.length === 0) {
      return NextResponse.json({ error: "Nothing to speak" }, { status: 400 });
    }

    const combined = Buffer.concat(buffers);
    return new NextResponse(new Uint8Array(combined), {
      status: 200,
      headers: {
        "Content-Type": "audio/mpeg",
        "Cache-Control": "no-store",
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "TTS failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
