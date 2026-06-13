import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { geminiFlash } from "@/lib/ai/gemini";
import { z } from "zod";

export const maxDuration = 120;

const bodySchema = z.object({
  message: z.string().min(1).max(4000),
});

/**
 * POST /api/agent
 * Text chat fallback for the AI agent. Returns { response }.
 */
export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let raw: unknown;
  try {
    raw = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  const parsed = bodySchema.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json({ error: "Validation failed" }, { status: 400 });
  }

  try {
    const { data: recent } = await supabase
      .from("transcriptions")
      .select("english_text, summary")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(3);

    const context =
      (recent || [])
        .map((r) => r.summary || r.english_text || "")
        .filter(Boolean)
        .join("\n---\n")
        .slice(0, 4000) || "No previous notes.";

    const result = await geminiFlash.generateContent(
      `You are SagaNote Assistant. Reply in the SAME language as the user (English or Burmese).
Keep responses concise (2-4 sentences). Use this context from the user's notes when relevant:
${context}

User: ${parsed.data.message}`
    );

    return NextResponse.json({ response: result.response.text().trim() });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Agent failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
