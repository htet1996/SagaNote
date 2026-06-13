import { NextResponse, type NextRequest } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import {
  transcribeAudio,
  translateToBurmese,
  generateMeetingMinutes,
  extractActionItems,
  categorizeContent,
} from "@/lib/ai/gemini";
import {
  buildTranscriptionBlocks,
  createNotionPage,
} from "@/lib/notion/client";
import { z } from "zod";

const bodySchema = z.object({
  recording_id: z.string().uuid(),
  save_preference: z.enum(["en", "my", "both"]).default("both"),
  generate_minutes: z.boolean().default(false),
  generate_actions: z.boolean().default(false),
});

// Allow long-running AI work
export const maxDuration = 300;

/**
 * POST /api/transcribe
 * Runs the full pipeline: transcribe → translate → categorize → minutes →
 * actions → store → deduct credits → save to Notion.
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
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const { recording_id, save_preference, generate_minutes, generate_actions } =
    parsed.data;

  // 1. Get the recording + verify ownership
  const { data: recording, error: recError } = await supabase
    .from("recordings")
    .select("*")
    .eq("id", recording_id)
    .eq("user_id", user.id)
    .single();

  if (recError || !recording) {
    return NextResponse.json(
      { error: "Recording not found" },
      { status: 404 }
    );
  }

  if (!recording.audio_url) {
    return NextResponse.json(
      { error: "Recording has no audio" },
      { status: 400 }
    );
  }

  // SSRF guard: only fetch audio from our own Supabase storage bucket.
  // The audio_url is inserted by the browser, so it must NOT be trusted blindly.
  const allowedPrefix = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/`;
  if (!recording.audio_url.startsWith(allowedPrefix)) {
    return NextResponse.json(
      { error: "Invalid audio source" },
      { status: 400 }
    );
  }

  // Credit check (cost = ceil(duration / 60) * 60, min 60)
  const cost = Math.max(60, Math.ceil(recording.duration_seconds / 60) * 60);

  const { data: profile } = await supabase
    .from("users")
    .select(
      "credits_balance, notion_access_token, notion_workspace_id"
    )
    .eq("id", user.id)
    .single();

  if (!profile || profile.credits_balance < cost) {
    return NextResponse.json(
      { error: "Insufficient credits", required: cost },
      { status: 402 }
    );
  }

  try {
    // 2. Mark processing
    await supabase
      .from("recordings")
      .update({ status: "processing" })
      .eq("id", recording_id);

    // 3. Transcribe
    const englishText = await transcribeAudio(recording.audio_url);

    // 4. Translate if needed
    let burmeseText: string | null = null;
    if (save_preference !== "en") {
      burmeseText = await translateToBurmese(englishText);
    }

    // 5. Categorize
    const meta = await categorizeContent(englishText);

    // 6. Minutes
    let summary: string | null = null;
    if (generate_minutes) {
      summary = await generateMeetingMinutes(englishText);
    }

    // 7. Action items
    let actionItems: string[] = [];
    if (generate_actions) {
      actionItems = await extractActionItems(englishText);
    }

    // 8. Save to Notion (best-effort) if connected + config exists
    let notionPageId: string | null = null;
    let notionDatabaseId: string | null = null;

    if (profile.notion_access_token) {
      const { data: notionConfig } = await supabase
        .from("notion_configs")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();

      const dbId =
        notionConfig?.transcription_db_id ||
        (recording.recording_type === "meeting"
          ? notionConfig?.meetings_db_id
          : null) ||
        notionConfig?.notes_db_id ||
        null;

      try {
        const blocks = buildTranscriptionBlocks({
          englishText: save_preference !== "my" ? englishText : null,
          burmeseText: save_preference !== "en" ? burmeseText : null,
          summary,
          actionItems,
        });

        notionPageId = await createNotionPage({
          accessToken: profile.notion_access_token,
          title: meta.title,
          databaseId: dbId,
          blocks,
        });
        notionDatabaseId = dbId;
      } catch {
        // Notion failures should not fail the whole transcription
        notionPageId = null;
      }
    }

    // 9. Insert transcription row
    const { data: transcription, error: insertError } = await supabase
      .from("transcriptions")
      .insert({
        recording_id,
        user_id: user.id,
        english_text: save_preference !== "my" ? englishText : null,
        burmese_text: save_preference !== "en" ? burmeseText : null,
        save_preference,
        summary,
        action_items: actionItems,
        notion_page_id: notionPageId,
        notion_database_id: notionDatabaseId,
      })
      .select()
      .single();

    if (insertError || !transcription) {
      throw new Error(insertError?.message || "Failed to save transcription");
    }

    // 10. Deduct credits via RPC (service role — the RPC is no longer
    //     callable by the user-scoped client for security reasons).
    await createServiceClient().rpc("deduct_credits", {
      p_user_id: user.id,
      p_amount: cost,
      p_desc: `Transcription: ${meta.title}`,
    });

    // 11. Mark done
    await supabase
      .from("recordings")
      .update({ status: "done" })
      .eq("id", recording_id);

    return NextResponse.json({
      success: true,
      transcription_id: transcription.id,
      credits_used: cost,
      notion_saved: !!notionPageId,
    });
  } catch (err) {
    // Roll the recording back to failed
    await supabase
      .from("recordings")
      .update({ status: "failed" })
      .eq("id", recording_id);

    const message =
      err instanceof Error ? err.message : "Transcription failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
