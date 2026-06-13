import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import { Toaster } from "sonner";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: "SagaNote — Your Voice, Structured",
  description:
    "SagaNote transforms voice recordings and meetings into structured Notion notes using AI. Built for Myanmar.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "SagaNote",
  },
  applicationName: "SagaNote",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#111111",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={inter.variable}>
      <body>
        {children}
        <Toaster
          position="top-center"
          toastOptions={{
            style: {
              borderRadius: "8px",
              border: "1px solid var(--color-border-light)",
              fontSize: "0.8125rem",
            },
          }}
        />
      </body>
    </html>
  );
}
