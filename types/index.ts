// ============================================================
// SagaNote — Shared Types
// ============================================================

export type SavePreference = "en" | "my" | "both";
export type RecordingType = "voice" | "meeting" | "upload";
export type RecordingStatus = "pending" | "processing" | "done" | "failed";
export type PaymentStatus = "pending" | "approved" | "rejected";
export type PaymentMethod = "kbzpay" | "wavepay" | "ayapay" | "cbpay";
export type CreditLogType = "deduct" | "topup" | "trial" | "refund";
export type NotionSetupType = "template" | "existing";

// ------------------------------------------------------------
// Database row shapes (mirror Supabase schema)
// ------------------------------------------------------------

export interface UserProfile {
  id: string;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
  notion_access_token: string | null;
  notion_workspace_id: string | null;
  notion_workspace_name: string | null;
  notion_workspace_icon: string | null;
  credits_balance: number;
  is_trial_used: boolean;
  is_admin: boolean;
  preferred_language: SavePreference;
  created_at: string;
  updated_at: string;
}

export interface NotionConfig {
  id: string;
  user_id: string;
  setup_type: NotionSetupType;
  transcription_db_id: string | null;
  meetings_db_id: string | null;
  actions_db_id: string | null;
  notes_db_id: string | null;
  created_at: string;
}

export interface Recording {
  id: string;
  user_id: string;
  audio_url: string | null;
  duration_seconds: number;
  recording_type: RecordingType;
  status: RecordingStatus;
  file_size_bytes: number | null;
  created_at: string;
}

export interface Transcription {
  id: string;
  recording_id: string;
  user_id: string;
  english_text: string | null;
  burmese_text: string | null;
  save_preference: SavePreference;
  summary: string | null;
  action_items: string[];
  notion_page_id: string | null;
  notion_database_id: string | null;
  created_at: string;
}

// Transcription joined with its recording (used in list/detail views)
export interface TranscriptionWithRecording extends Transcription {
  recording?: Recording | null;
}

export interface Note {
  id: string;
  user_id: string;
  content: string;
  tags: string[];
  notion_page_id: string | null;
  created_at: string;
}

export interface Payment {
  id: string;
  user_id: string;
  amount_mmk: number;
  payment_method: PaymentMethod;
  screenshot_url: string | null;
  status: PaymentStatus;
  credits_granted: number | null;
  verified_by: string | null;
  note: string | null;
  created_at: string;
}

// Payment joined with the submitting user (admin view)
export interface PaymentWithUser extends Payment {
  user?: Pick<UserProfile, "email" | "full_name"> | null;
}

export interface CreditLog {
  id: string;
  user_id: string;
  amount: number;
  type: CreditLogType;
  description: string | null;
  created_at: string;
}

// ------------------------------------------------------------
// AI helper return shapes
// ------------------------------------------------------------

export interface ContentCategory {
  category: string;
  tags: string[];
  title: string;
}

// ------------------------------------------------------------
// Voice agent
// ------------------------------------------------------------

export type AgentState = "idle" | "listening" | "thinking" | "speaking";

export interface AgentMessage {
  id: string;
  role: "user" | "assistant";
  text: string;
}

export interface AgentVoiceResponse {
  transcript: string;
  response: string;
}

// ------------------------------------------------------------
// Pricing / packages
// ------------------------------------------------------------

export interface CreditPackage {
  id: string;
  amountMMK: number;
  credits: number; // stored as seconds
  minutes: number;
  popular?: boolean;
}

export interface PaymentMethodInfo {
  id: PaymentMethod;
  name: string;
  qr: string;
}
