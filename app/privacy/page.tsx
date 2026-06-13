import type { Metadata } from "next";
import { LegalPage } from "@/components/shared/LegalPage";

export const metadata: Metadata = {
  title: "Privacy Policy — SagaNote",
};

export default function PrivacyPage() {
  return (
    <LegalPage
      heading="Privacy Policy"
      headingMy="ကိုယ်ရေးအချက်အလက် မူဝါဒ"
      updated="June 2026"
      sections={[
        {
          title: "What data we collect",
          titleMy: "ကျွန်ုပ်တို့ စုဆောင်းသော အချက်အလက်များ",
          en: "We collect your account information (name, email, profile photo) from Google sign-in. We store the audio recordings you create, their transcriptions, translations, notes, and payment records. When you connect Notion, we securely store an access token to write notes on your behalf.",
          my: "သင် Google ဖြင့် ဝင်ရောက်သည့်အခါ အကောင့်အချက်အလက် (အမည်၊ အီးမေးလ်၊ ပရိုဖိုင်ဓာတ်ပုံ) ကို ရယူပါသည်။ သင်ဖန်တီးသော အသံဖိုင်များ၊ ၎င်းတို့၏ စာသားပြောင်းချက်များ၊ ဘာသာပြန်ချက်များ၊ မှတ်စုများနှင့် ငွေပေးချေမှုမှတ်တမ်းများကို သိမ်းဆည်းပါသည်။ Notion ချိတ်ဆက်သည့်အခါ သင့်ကိုယ်စား မှတ်စုများရေးသားရန် access token ကို လုံခြုံစွာ သိမ်းဆည်းပါသည်။",
        },
        {
          title: "How we use it",
          titleMy: "မည်သို့ အသုံးပြုသနည်း",
          en: "Your data is used only to provide the SagaNote service: transcribing audio, translating text, generating summaries, and saving notes to your Notion. We do not sell your data or use it for advertising.",
          my: "သင့်အချက်အလက်များကို SagaNote ဝန်ဆောင်မှု ပေးရန်အတွက်သာ အသုံးပြုပါသည် — အသံကို စာသားပြောင်းခြင်း၊ ဘာသာပြန်ခြင်း၊ အကျဉ်းချုပ်ထုတ်ခြင်းနှင့် Notion သို့ မှတ်စုသိမ်းခြင်း။ သင့်အချက်အလက်များကို ရောင်းချခြင်း သို့မဟုတ် ကြော်ငြာအတွက် အသုံးပြုခြင်း မရှိပါ။",
        },
        {
          title: "Third parties",
          titleMy: "ပြင်ပ ဝန်ဆောင်မှုများ",
          en: "We rely on trusted providers to operate: Supabase (database, authentication, and file storage), Google Gemini (AI transcription and translation), and Notion (note storage). Audio you submit is processed by Google Gemini to produce transcripts.",
          my: "ဝန်ဆောင်မှု လည်ပတ်ရန် ယုံကြည်စိတ်ချရသော ဝန်ဆောင်မှုပေးသူများကို အသုံးပြုပါသည် — Supabase (ဒေတာ�‌ဘေ့စ်၊ အကောင့်ဝင်ခြင်းနှင့် ဖိုင်သိမ်းဆည်းမှု)၊ Google Gemini (AI စာသားပြောင်းခြင်းနှင့် ဘာသာပြန်ခြင်း) နှင့် Notion (မှတ်စုသိမ်းဆည်းမှု)။ သင်တင်သွင်းသော အသံဖိုင်များကို စာသားထုတ်ရန် Google Gemini မှ စီမံဆောင်ရွက်ပါသည်။",
        },
        {
          title: "Data retention",
          titleMy: "အချက်အလက် သိမ်းဆည်းကာလ",
          en: "We retain your recordings and notes until you delete them or close your account. You can request deletion of your account and associated data at any time by contacting us.",
          my: "သင်ဖျက်ပစ်သည် သို့မဟုတ် အကောင့်ပိတ်သည်အထိ သင့်အသံဖိုင်များနှင့် မှတ်စုများကို သိမ်းဆည်းထားပါသည်။ သင့်အကောင့်နှင့် ဆက်စပ်အချက်အလက်များ ဖျက်ပစ်ရန် အချိန်မရွေး ကျွန်ုပ်တို့ထံ ဆက်သွယ်နိုင်ပါသည်။",
        },
        {
          title: "Contact",
          titleMy: "ဆက်သွယ်ရန်",
          en: "For privacy questions or data deletion requests, contact the SagaNote team at the email address provided in the app footer.",
          my: "ကိုယ်ရေးကိုယ်တာ မေးခွန်းများ သို့မဟုတ် အချက်အလက်ဖျက်ရန် တောင်းဆိုမှုများအတွက် app ၏ အောက်ခြေတွင် ဖော်ပြထားသော အီးမေးလ်သို့ ဆက်သွယ်ပါ။",
        },
      ]}
    />
  );
}
