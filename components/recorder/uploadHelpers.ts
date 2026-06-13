"use client";

import { createClient } from "@/lib/supabase/client";
import type { RecordingType } from "@/types";

export interface UploadResult {
  recordingId: string;
  audioUrl: string;
}

/**
 * Upload an audio blob/file to the Supabase "recordings" bucket and create a
 * matching `recordings` row with status "pending".
 * Path: {userId}/{timestamp}.{ext}
 */
export async function uploadRecording(opts: {
  blob: Blob;
  durationSeconds: number;
  type: RecordingType;
  ext?: string;
}): Promise<UploadResult> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) throw new Error("Not signed in");

  const ext = opts.ext || "webm";
  const timestamp = Date.now();
  const path = `${user.id}/${timestamp}.${ext}`;

  const { error: uploadError } = await supabase.storage
    .from("recordings")
    .upload(path, opts.blob, {
      contentType: opts.blob.type || "audio/webm",
      upsert: false,
    });

  if (uploadError) {
    throw new Error(`Upload failed: ${uploadError.message}`);
  }

  const {
    data: { publicUrl },
  } = supabase.storage.from("recordings").getPublicUrl(path);

  const { data: recording, error: insertError } = await supabase
    .from("recordings")
    .insert({
      user_id: user.id,
      audio_url: publicUrl,
      duration_seconds: Math.round(opts.durationSeconds),
      recording_type: opts.type,
      status: "pending",
      file_size_bytes: opts.blob.size,
    })
    .select()
    .single();

  if (insertError || !recording) {
    throw new Error(insertError?.message || "Failed to create recording");
  }

  return { recordingId: recording.id, audioUrl: publicUrl };
}

/**
 * Kick off transcription for a recording via the API.
 */
export async function startTranscription(opts: {
  recordingId: string;
  savePreference: "en" | "my" | "both";
  generateMinutes: boolean;
  generateActions: boolean;
}): Promise<{ transcription_id: string; credits_used: number }> {
  const res = await fetch("/api/transcribe", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      recording_id: opts.recordingId,
      save_preference: opts.savePreference,
      generate_minutes: opts.generateMinutes,
      generate_actions: opts.generateActions,
    }),
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || "Transcription failed");
  }
  return data;
}
