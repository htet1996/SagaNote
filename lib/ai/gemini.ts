import { GoogleGenerativeAI } from "@google/generative-ai";
import type { ContentCategory } from "@/types";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export const geminiFlash = genAI.getGenerativeModel({
  model: "gemini-2.5-flash",
});

// ------------------------------------------------------------
// Helpers
// ------------------------------------------------------------

/**
 * Strip markdown code fences and surrounding noise so JSON.parse works
 * on Gemini output that is wrapped in ```json ... ``` blocks.
 */
function extractJson(raw: string): string {
  let text = raw.trim();
  // Remove ```json ... ``` or ``` ... ``` fences
  text = text.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "");
  return text.trim();
}

/**
 * Fetch an audio URL and return its base64 contents + mime type.
 * Used to feed audio into Gemini's multimodal input.
 */
export async function audioUrlToBase64(
  url: string
): Promise<{ data: string; mimeType: string }> {
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Failed to fetch audio (${res.status})`);
  }
  const mimeType = res.headers.get("content-type") || "audio/webm";
  const arrayBuffer = await res.arrayBuffer();
  const data = Buffer.from(arrayBuffer).toString("base64");
  return { data, mimeType };
}

// ------------------------------------------------------------
// AI functions
// ------------------------------------------------------------

/**
 * Transcribe an audio file (by URL) to clean English text.
 * If the speaker is not English, transcribe phonetically/translated to English.
 */
export async function transcribeAudio(audioUrl: string): Promise<string> {
  const { data, mimeType } = await audioUrlToBase64(audioUrl);

  const result = await geminiFlash.generateContent([
    {
      inlineData: { data, mimeType },
    },
    {
      text: `You are an expert transcriptionist. Transcribe the spoken content of this audio into clean, well-punctuated ENGLISH text.
- If the audio is already in English, transcribe it verbatim with proper punctuation.
- If the audio is in another language (e.g. Burmese), translate the meaning into natural English.
- Remove filler words and false starts but keep the full meaning.
- Return ONLY the transcript text with no preamble, labels, or quotes.`,
    },
  ]);

  return result.response.text().trim();
}

/**
 * Translate English text to Burmese (Myanmar).
 */
export async function translateToBurmese(englishText: string): Promise<string> {
  const result = await geminiFlash.generateContent(
    `Translate the following text into natural, fluent Burmese (Myanmar language).
Keep the tone and meaning intact. Return ONLY the Burmese translation with no preamble or notes.

Text:
${englishText}`
  );

  return result.response.text().trim();
}

/**
 * Generate structured meeting minutes (markdown) from a transcript.
 */
export async function generateMeetingMinutes(
  transcript: string
): Promise<string> {
  const result = await geminiFlash.generateContent(
    `You are a professional meeting secretary. From the transcript below, produce concise, well-structured meeting minutes in Markdown.

Use these sections (omit a section if there is genuinely no content for it):
## Summary
A 2-3 sentence overview.
## Key Discussion Points
- bullet points
## Decisions Made
- bullet points
## Next Steps
- bullet points

Return ONLY the markdown. Do not wrap it in code fences.

Transcript:
${transcript}`
  );

  return result.response.text().trim();
}

/**
 * Extract action items from a transcript. Returns a string[] of tasks.
 * Falls back to an empty array if parsing fails.
 */
export async function extractActionItems(
  transcript: string
): Promise<string[]> {
  try {
    const result = await geminiFlash.generateContent(
      `From the transcript below, extract concrete action items / tasks.
Return ONLY a JSON array of short task strings, e.g. ["Send the report to Aung", "Schedule follow-up call"].
If there are no action items, return [].
Do not include any text outside the JSON array.

Transcript:
${transcript}`
    );

    const parsed = JSON.parse(extractJson(result.response.text()));
    if (Array.isArray(parsed)) {
      return parsed.filter((x): x is string => typeof x === "string");
    }
    return [];
  } catch {
    return [];
  }
}

/**
 * Categorize transcript content. Returns { category, tags, title }.
 * Falls back to sensible defaults if parsing fails.
 */
export async function categorizeContent(
  transcript: string
): Promise<ContentCategory> {
  const fallback: ContentCategory = {
    category: "General",
    tags: [],
    title: "Untitled Recording",
  };

  try {
    const result = await geminiFlash.generateContent(
      `Analyze the transcript below and return ONLY a JSON object with this exact shape:
{"title": "a short descriptive title (max 8 words)", "category": "one of: Meeting, Idea, Task, Note, Interview, Lecture, General", "tags": ["3-5", "lowercase", "keywords"]}
Do not include any text outside the JSON object.

Transcript:
${transcript}`
    );

    const parsed = JSON.parse(extractJson(result.response.text()));
    return {
      title:
        typeof parsed.title === "string" && parsed.title.trim()
          ? parsed.title.trim()
          : fallback.title,
      category:
        typeof parsed.category === "string" && parsed.category.trim()
          ? parsed.category.trim()
          : fallback.category,
      tags: Array.isArray(parsed.tags)
        ? parsed.tags.filter((t: unknown): t is string => typeof t === "string")
        : [],
    };
  } catch {
    return fallback;
  }
}
