import type { Metadata } from "next";
import { LegalPage } from "@/components/shared/LegalPage";

export const metadata: Metadata = {
  title: "Terms & Conditions — SagaNote",
};

export default function TermsPage() {
  return (
    <LegalPage
      heading="Terms & Conditions"
      headingMy="စည်းမျဉ်းစည်းကမ်းများ"
      updated="June 2026"
      sections={[
        {
          title: "Service description",
          titleMy: "ဝန်ဆောင်မှု အကြောင်း",
          en: "SagaNote is an AI-powered service that transcribes audio, translates between English and Burmese, summarizes meetings, and saves structured notes to Notion. The service uses a credit system where 1 minute of transcription costs 60 credits.",
          my: "SagaNote သည် အသံကို စာသားပြောင်းခြင်း၊ အင်္ဂလိပ်–မြန်မာ ဘာသာပြန်ခြင်း၊ အစည်းအဝေးများ အကျဉ်းချုပ်ခြင်းနှင့် Notion သို့ မှတ်စုသိမ်းဆည်းပေးသော AI ဝန်ဆောင်မှု ဖြစ်ပါသည်။ ဝန်ဆောင်မှုသည် credit စနစ်ကို အသုံးပြုပြီး စာသားပြောင်းခြင်း ၁ မိနစ်လျှင် credit ၆၀ ကုန်ကျပါသည်။",
        },
        {
          title: "User responsibilities",
          titleMy: "အသုံးပြုသူ၏ တာဝန်များ",
          en: "You are responsible for the content you record and upload. You must have the right to record any meeting or conversation you submit, and you must comply with local laws regarding recording consent. Do not upload illegal, harmful, or infringing content.",
          my: "သင်သိမ်းဆည်းနှင့် တင်သွင်းသော အကြောင်းအရာများအတွက် သင်၌ တာဝန်ရှိပါသည်။ သင်တင်သွင်းသော အစည်းအဝေး သို့မဟုတ် စကားဝိုင်းကို သိမ်းဆည်းပိုင်ခွင့် ရှိရမည်ဖြစ်ပြီး အသံသွင်းခွင့်ဆိုင်ရာ ဒေသခံ ဥပဒေများကို လိုက်နာရပါမည်။ တရားမဝင်၊ အန္တရာယ်ရှိ သို့မဟုတ် မူပိုင်ခွင့်ချိုးဖောက်သော အကြောင်းအရာများ မတင်ပါနှင့်။",
        },
        {
          title: "Payment & credits policy",
          titleMy: "ငွေပေးချေမှုနှင့် credit မူဝါဒ",
          en: "Credits are purchased via the payment methods shown in the app (KBZPay, WavePay, AyaPay, CBPay). Payments are verified manually within 1–24 hours. New accounts receive 30 minutes (1,800 credits) of free trial credits.",
          my: "Credit များကို app တွင် ဖော်ပြထားသော ငွေပေးချေနည်းများ (KBZPay၊ WavePay၊ AyaPay၊ CBPay) ဖြင့် ဝယ်ယူနိုင်ပါသည်။ ငွေပေးချေမှုများကို ၁–၂၄ နာရီအတွင်း လက်ဖြင့် စစ်ဆေးအတည်ပြုပါသည်။ အကောင့်အသစ်များသည် အခမဲ့ ၃၀ မိနစ် (credit ၁,၈၀၀) ရရှိပါသည်။",
        },
        {
          title: "Refund policy",
          titleMy: "ငွေပြန်အမ်းမူဝါဒ",
          en: "Credits are non-refundable once they have been used for transcription, translation, or AI agent sessions. Unused credits may be refundable at our discretion in case of a verified payment error.",
          my: "Credit များကို စာသားပြောင်းခြင်း၊ ဘာသာပြန်ခြင်း သို့မဟုတ် AI agent အသုံးပြုပြီးပါက ငွေပြန်အမ်းမည်မဟုတ်ပါ။ ငွေပေးချေမှု အမှားအယွင်း အတည်ပြုနိုင်ပါက မသုံးရသေးသော credit များကို ကျွန်ုပ်တို့၏ ဆုံးဖြတ်ချက်ဖြင့် ပြန်အမ်းနိုင်ပါသည်။",
        },
        {
          title: "Account termination",
          titleMy: "အကောင့် ပိတ်သိမ်းခြင်း",
          en: "We may suspend or terminate accounts that violate these terms, abuse the service, or engage in fraudulent payment activity. You may close your account at any time.",
          my: "ဤစည်းကမ်းများကို ချိုးဖောက်ခြင်း၊ ဝန်ဆောင်မှုကို အလွဲသုံးစားလုပ်ခြင်း သို့မဟုတ် လိမ်လည်ငွေပေးချေမှု ပြုလုပ်သော အကောင့်များကို ဆိုင်းငံ့ သို့မဟုတ် ပိတ်သိမ်းနိုင်ပါသည်။ သင့်အကောင့်ကို အချိန်မရွေး ပိတ်နိုင်ပါသည်။",
        },
        {
          title: "Limitation of liability",
          titleMy: "တာဝန်ကန့်သတ်ချက်",
          en: "SagaNote is provided 'as is'. AI transcriptions and translations may contain errors and should be reviewed before relying on them. We are not liable for any loss arising from use of the service to the maximum extent permitted by law.",
          my: "SagaNote ကို 'ရှိသည့်အတိုင်း' ပေးအပ်ထားပါသည်။ AI စာသားပြောင်းချက်များနှင့် ဘာသာပြန်ချက်များတွင် အမှားများ ပါဝင်နိုင်ပြီး အားကိုးအသုံးပြုမီ ပြန်လည်စစ်ဆေးသင့်ပါသည်။ ဝန်ဆောင်မှုအသုံးပြုခြင်းကြောင့် ဖြစ်ပေါ်လာသော ဆုံးရှုံးမှုများအတွက် ဥပဒေခွင့်ပြုသည့် အတိုင်းအတာအထိ ကျွန်ုပ်တို့ တာဝန်မယူပါ။",
        },
      ]}
    />
  );
}
