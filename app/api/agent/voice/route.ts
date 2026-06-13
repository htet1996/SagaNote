import { NextResponse, type NextRequest } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { geminiFlash } from "@/lib/ai/gemini";
import { AGENT_CREDIT_COST } from "@/lib/constants";

export const maxDuration = 120;

/* eslint-disable @typescript-eslint/no-explicit-any */

function extractJson(raw: string): string {
  return raw
    .trim()
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();
}

/**
 * POST /api/agent/voice
 * Voice-to-voice turn. Receives recorded audio, returns { transcript, response }.
 * The client plays `response` back via /api/tts.
 */
export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Credit check
  const { data: profile } = await supabase
    .from("users")
    .select("credits_balance")
    .eq("id", user.id)
    .single();

  if (!profile || profile.credits_balance < AGENT_CREDIT_COST) {
    return NextResponse.json(
      { error: "Insufficient credits", required: AGENT_CREDIT_COST },
      { status: 402 }
    );
  }

  // Parse audio from FormData
  let audioFile: File | null = null;
  try {
    const form = await request.formData();
    audioFile = form.get("audio") as File | null;
  } catch {
    return NextResponse.json({ error: "Invalid form data" }, { status: 400 });
  }

  if (!audioFile) {
    return NextResponse.json({ error: "No audio provided" }, { status: 400 });
  }

  try {
    const arrayBuffer = await audioFile.arrayBuffer();
    const base64 = Buffer.from(arrayBuffer).toString("base64");
    const mimeType = audioFile.type || "audio/webm";

    // Fetch 3 recent transcriptions for context
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

    const prompt = `You are SagaNote Voice Assistant. Transcribe user speech. Detect language.
Respond in SAME language (English or Burmese). Keep response 2-3 sentences.
Use this context from user's notes: ${context}
Return ONLY JSON: {"transcript": string, "response": string}`;

    const result = await geminiFlash.generateContent([
      { inlineData: { data: base64, mimeType } },
      { text: prompt },
    ]);

    let transcript = "";
    let response = "";
    try {
      const parsed = JSON.parse(extractJson(result.response.text()));
      transcript = typeof parsed.transcript === "string" ? parsed.transcript : "";
      response = typeof parsed.response === "string" ? parsed.response : "";
    } catch {
      // Fallback: treat the whole output as the response
      response = result.response.text().trim();
    }

    if (!response) {
      response = "Sorry, I didn't catch that. Could you say it again?";
    }

    // Deduct credits (service role — the RPC is locked down from clients).
    await createServiceClient().rpc("deduct_credits", {
      p_user_id: user.id,
      p_amount: AGENT_CREDIT_COST,
      p_desc: "Voice agent turn",
    });

    return NextResponse.json({ transcript, response });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Voice processing failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
