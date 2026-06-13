"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";

type Lang = "en" | "my";

interface HelpSection {
  titleEn: string;
  titleMy: string;
  en: string[];
  my: string[];
}

const SECTIONS: HelpSection[] = [
  {
    titleEn: "Getting Started",
    titleMy: "စတင်အသုံးပြုနည်း",
    en: [
      "Sign in with your Google account.",
      "You get 30 minutes (1,800 credits) of free trial on signup.",
      "Connect your Notion workspace from the Workspace page to save notes automatically.",
      "Start recording from the Recorder page.",
    ],
    my: [
      "သင့် Google အကောင့်ဖြင့် ဝင်ရောက်ပါ။",
      "အကောင့်ဖွင့်သည့်အခါ အခမဲ့ ၃၀ မိနစ် (credit ၁,၈၀၀) ရရှိပါမည်။",
      "မှတ်စုများ အလိုအလျောက်သိမ်းရန် Workspace စာမျက်နှာမှ သင့် Notion ကို ချိတ်ဆက်ပါ။",
      "Recorder စာမျက်နှာမှ အသံစတင်သွင်းပါ။",
    ],
  },
  {
    titleEn: "Voice Recording",
    titleMy: "အသံသွင်းနည်း",
    en: [
      "Go to Recorder and choose 'Voice Record'.",
      "Tap the microphone button to start. Allow microphone access when asked.",
      "Use Pause/Resume as needed, then tap the red stop button.",
      "Preview the audio, choose your language and AI options, then Save & Transcribe.",
    ],
    my: [
      "Recorder သို့သွားပြီး 'Voice Record' ကို ရွေးပါ။",
      "မိုက်ခရိုဖုန်းခလုတ်ကို နှိပ်၍ စတင်ပါ။ တောင်းဆိုသည့်အခါ မိုက်ခွင့်ပြုပါ။",
      "လိုအပ်သလို Pause/Resume သုံးပြီး အနီရောင် stop ခလုတ်ကို နှိပ်ပါ။",
      "အသံကို နားထောင်ကြည့်ပြီး ဘာသာစကားနှင့် AI ရွေးချယ်မှုများ ပြုလုပ်ကာ Save & Transcribe နှိပ်ပါ။",
    ],
  },
  {
    titleEn: "Meeting Recording",
    titleMy: "Meeting မှတ်တမ်းတင်နည်း",
    en: [
      "Go to Recorder and choose 'Meeting Record'.",
      "Tap Start Recording. In the browser dialog, select the tab/screen to capture.",
      "IMPORTANT: enable 'Share tab audio' so the meeting sound is recorded.",
      "Tap stop when done, choose to generate minutes and action items, then save.",
    ],
    my: [
      "Recorder သို့သွားပြီး 'Meeting Record' ကို ရွေးပါ။",
      "Start Recording ကို နှိပ်ပါ။ browser dialog တွင် ဖမ်းယူမည့် tab/screen ကို ရွေးပါ။",
      "အရေးကြီး — meeting အသံကို ဖမ်းယူနိုင်ရန် 'Share tab audio' ကို ဖွင့်ပါ။",
      "ပြီးဆုံးပါက stop နှိပ်၍ minutes နှင့် action items ထုတ်ရန် ရွေးပြီး သိမ်းပါ။",
    ],
  },
  {
    titleEn: "AI Transcription",
    titleMy: "AI ဘာသာပြန်ချက်",
    en: [
      "After saving a recording, our AI transcribes it to English text.",
      "You can choose English only, Burmese only, or both languages.",
      "Optionally generate meeting minutes (summary, decisions, next steps).",
      "Optionally extract action items as a checklist.",
      "Each minute of audio costs 60 credits.",
    ],
    my: [
      "အသံသိမ်းပြီးနောက် ကျွန်ုပ်တို့၏ AI က အင်္ဂလိပ်စာသားအဖြစ် ပြောင်းပေးပါသည်။",
      "အင်္ဂလိပ်သာ၊ မြန်မာသာ သို့မဟုတ် နှစ်မျိုးလုံး ရွေးနိုင်ပါသည်။",
      "လိုအပ်ပါက meeting minutes (အကျဉ်းချုပ်၊ ဆုံးဖြတ်ချက်၊ နောက်ဆက်တွဲ) ထုတ်နိုင်ပါသည်။",
      "လိုအပ်ပါက action items များကို စစ်ဆေးရန်စာရင်းအဖြစ် ထုတ်နိုင်ပါသည်။",
      "အသံ ၁ မိနစ်လျှင် credit ၆၀ ကုန်ကျပါသည်။",
    ],
  },
  {
    titleEn: "AI Voice Agent",
    titleMy: "AI Voice Agent သုံးနည်း",
    en: [
      "Open the AI Agent page and tap the microphone to start a conversation.",
      "Speak naturally in English or Burmese — the agent replies in the same language.",
      "It answers out loud and knows your recent notes for context.",
      "Tap stop to send your message; the agent listens again automatically after replying.",
      "Tap End to finish the session. Each turn costs 60 credits.",
    ],
    my: [
      "AI Agent စာမျက်နှာကို ဖွင့်ပြီး မိုက်ခလုတ်ကို နှိပ်၍ စကားပြောစတင်ပါ။",
      "အင်္ဂလိပ် သို့မဟုတ် မြန်မာဖြင့် သဘာဝအတိုင်း ပြောပါ — agent က တူညီသောဘာသာဖြင့် ပြန်ဖြေပါမည်။",
      "၎င်းသည် အသံဖြင့်ဖြေပြီး သင့်မှတ်စုများကို အကြောင်းအရာအဖြစ် သိရှိပါသည်။",
      "သင့်စကားပို့ရန် stop နှိပ်ပါ; ပြန်ဖြေပြီးနောက် agent က အလိုအလျောက် ပြန်နားထောင်ပါမည်။",
      "session ပြီးဆုံးရန် End နှိပ်ပါ။ တစ်ကြိမ်လျှင် credit ၆၀ ကုန်ကျပါသည်။",
    ],
  },
  {
    titleEn: "Notion Workspace",
    titleMy: "Notion ချိတ်ဆက်နည်း",
    en: [
      "Go to the Workspace page and tap Connect Notion.",
      "Authorize SagaNote in the Notion screen and grant access to your pages.",
      "Choose to use the SagaNote template or map your existing databases.",
      "Once configured, transcriptions and notes save to Notion automatically.",
    ],
    my: [
      "Workspace စာမျက်နှာသို့သွားပြီး Connect Notion ကို နှိပ်ပါ။",
      "Notion မျက်နှာပြင်တွင် SagaNote ကို ခွင့်ပြုပြီး သင့်စာမျက်နှာများသို့ ဝင်ခွင့်ပေးပါ။",
      "SagaNote template သုံးရန် သို့မဟုတ် ရှိပြီးသား database များ ချိတ်ရန် ရွေးပါ။",
      "ပြင်ဆင်ပြီးပါက transcription နှင့် မှတ်စုများ Notion သို့ အလိုအလျောက် သိမ်းပါမည်။",
    ],
  },
  {
    titleEn: "Credits & Payment",
    titleMy: "Credits ဝယ်နည်း",
    en: [
      "Go to the Credits page and choose a package.",
      "Select a payment method: KBZPay, WavePay, AyaPay, or CBPay.",
      "Scan the QR or pay to the displayed phone number.",
      "Upload your payment screenshot and submit.",
      "Credits are added after manual verification within 1–24 hours.",
    ],
    my: [
      "Credits စာမျက်နှာသို့သွားပြီး package တစ်ခု ရွေးပါ။",
      "ငွေပေးနည်း ရွေးပါ — KBZPay၊ WavePay၊ AyaPay သို့မဟုတ် CBPay။",
      "QR ကို scan ဖတ်ပါ သို့မဟုတ် ပြထားသော ဖုန်းနံပါတ်သို့ ပေးချေပါ။",
      "ငွေပေးချေမှု screenshot ကို တင်ပြီး submit လုပ်ပါ။",
      "Credits များကို ၁–၂၄ နာရီအတွင်း လက်ဖြင့်စစ်ဆေးပြီး ထည့်ပေးပါမည်။",
    ],
  },
];

export default function HelpPage() {
  const [lang, setLang] = useState<Lang>("en");
  const [open, setOpen] = useState<number | null>(0);

  return (
    <div style={{ maxWidth: 720, margin: "0 auto" }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          gap: 12,
          flexWrap: "wrap",
        }}
      >
        <div>
          <h1>Help & Guide</h1>
          <p style={{ color: "var(--color-text-2)", marginTop: 6 }}>
            {lang === "en"
              ? "Step-by-step instructions for every feature."
              : "လုပ်ဆောင်ချက်တိုင်းအတွက် အဆင့်ဆင့် လမ်းညွှန်ချက်များ။"}
          </p>
        </div>

        {/* Language toggle */}
        <div
          style={{
            display: "flex",
            border: "1px solid var(--color-border-light)",
            borderRadius: 8,
            overflow: "hidden",
            flexShrink: 0,
          }}
        >
          {(["en", "my"] as Lang[]).map((l) => (
            <button
              key={l}
              onClick={() => setLang(l)}
              style={{
                padding: "8px 16px",
                fontSize: "0.8125rem",
                fontWeight: 500,
                border: "none",
                background:
                  lang === l ? "var(--color-primary)" : "transparent",
                color: lang === l ? "#fff" : "var(--color-text-2)",
              }}
            >
              {l === "en" ? "English" : "မြန်မာ"}
            </button>
          ))}
        </div>
      </div>

      {/* Accordion */}
      <div style={{ marginTop: 24, display: "grid", gap: 10 }}>
        {SECTIONS.map((s, i) => {
          const isOpen = open === i;
          const steps = lang === "en" ? s.en : s.my;
          const title = lang === "en" ? s.titleEn : s.titleMy;
          return (
            <div
              key={i}
              style={{
                borderRadius: 12,
                border: "1px solid var(--color-border-light)",
                background: "var(--color-white)",
                overflow: "hidden",
              }}
            >
              <button
                onClick={() => setOpen(isOpen ? null : i)}
                style={{
                  width: "100%",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  padding: "16px 18px",
                  background: "transparent",
                  border: "none",
                  color: "inherit",
                  textAlign: "left",
                }}
              >
                <span style={{ fontWeight: 500, fontSize: "0.9375rem" }}>
                  {i + 1}. {title}
                </span>
                <ChevronDown
                  size={18}
                  style={{
                    transition: "transform 0.2s ease",
                    transform: isOpen ? "rotate(180deg)" : "none",
                    color: "var(--color-text-3)",
                  }}
                />
              </button>
              {isOpen && (
                <div
                  className="animate-fade-in"
                  style={{ padding: "0 18px 18px 18px" }}
                >
                  <ol
                    style={{
                      margin: 0,
                      paddingLeft: 20,
                      color: "var(--color-text-2)",
                      fontSize: "0.875rem",
                      lineHeight: 1.9,
                    }}
                  >
                    {steps.map((step, j) => (
                      <li key={j}>{step}</li>
                    ))}
                  </ol>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Examples (emojis allowed here per spec) */}
      <div
        style={{
          marginTop: 28,
          padding: 18,
          borderRadius: 12,
          background: "var(--color-secondary)",
          fontSize: "0.875rem",
          color: "var(--color-text-2)",
        }}
      >
        <strong>{lang === "en" ? "Examples" : "ဥပမာများ"}</strong>
        <ul style={{ marginTop: 8, paddingLeft: 18, lineHeight: 1.8 }}>
          <li>🎙️ {lang === "en" ? "Record a quick idea on the go" : "သွားရင်း အကြံတစ်ခု အမြန်သွင်းပါ"}</li>
          <li>💼 {lang === "en" ? "Capture a Zoom meeting and get minutes" : "Zoom meeting ဖမ်းပြီး minutes ရယူပါ"}</li>
          <li>🌐 {lang === "en" ? "Translate English audio into Burmese notes" : "အင်္ဂလိပ်အသံကို မြန်မာမှတ်စုအဖြစ် ဘာသာပြန်ပါ"}</li>
        </ul>
      </div>
    </div>
  );
}
