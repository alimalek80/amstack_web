import type { Metadata } from "next";
import { Archivo, Instrument_Sans, JetBrains_Mono } from "next/font/google";
import type { ReactNode } from "react";
import Footer from "@/components/Footer";
import Header from "@/components/Header";
import { getSettings } from "@/lib/api";
import "./globals.css";

const SITE_URL = process.env.SITE_URL ?? "https://amstack.org";

// Display (headings), body and a mono face for small labels.
const display = Archivo({ subsets: ["latin"], axes: ["wdth"], variable: "--font-display" });
const body = Instrument_Sans({ subsets: ["latin"], variable: "--font-body" });
const mono = JetBrains_Mono({ subsets: ["latin"], variable: "--font-mono" });

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "amstack | Websites, online stores, bots and SaaS",
    template: "%s | amstack",
  },
  description:
    "Custom company websites, online stores, web apps, website chatbots, Telegram bots and SaaS platforms, from simple to advanced.",
};

export default async function RootLayout({ children }: { children: ReactNode }) {
  const settings = await getSettings();
  return (
    <html lang="en" className={`${display.variable} ${body.variable} ${mono.variable}`}>
      <body>
        <Header />
        <main>{children}</main>
        <Footer settings={settings} />
      </body>
    </html>
  );
}
