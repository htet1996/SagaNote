// ============================================================
// SagaNote constants — packages, payment methods, navigation.
// ============================================================

import type { CreditPackage, PaymentMethodInfo } from "@/types";

export const APP_NAME = "SagaNote";

// Trial credits granted on signup (30 minutes = 1800 seconds)
export const TRIAL_CREDITS = 1800;

// Credit cost helpers
export const AGENT_CREDIT_COST = 60; // per voice agent turn

// Receiver info shown on the credits payment screen
export const PAYMENT_RECEIVER = {
  name: "Htet Min Paing",
  phone: "09420974005",
};

// Credit packages. credits are stored in SECONDS (1 min = 60 credits).
export const CREDIT_PACKAGES: CreditPackage[] = [
  { id: "pkg-5000", amountMMK: 5000, minutes: 50, credits: 50 * 60 },
  {
    id: "pkg-10000",
    amountMMK: 10000,
    minutes: 120,
    credits: 120 * 60,
    popular: true,
  },
  { id: "pkg-25000", amountMMK: 25000, minutes: 320, credits: 320 * 60 },
  { id: "pkg-50000", amountMMK: 50000, minutes: 700, credits: 700 * 60 },
];

export const PAYMENT_METHODS: PaymentMethodInfo[] = [
  { id: "kbzpay", name: "KBZPay", qr: "/payment-qr/kbzpay.jpg" },
  { id: "wavepay", name: "WavePay", qr: "/payment-qr/wavepay.jpg" },
  { id: "ayapay", name: "AyaPay", qr: "/payment-qr/ayapay.jpg" },
  { id: "cbpay", name: "CBPay", qr: "/payment-qr/cbpay.jpg" },
];

// Preset note tags
export const PRESET_TAGS = [
  "idea",
  "todo",
  "important",
  "meeting",
  "follow-up",
  "personal",
];
