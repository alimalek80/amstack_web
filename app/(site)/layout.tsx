import type { ReactNode } from "react";
import Footer from "@/components/Footer";
import Header from "@/components/Header";
import { getSettings } from "@/lib/api";

export default async function SiteLayout({ children }: { children: ReactNode }) {
  const settings = await getSettings();
  return (
    <>
      <Header />
      <main>{children}</main>
      <Footer settings={settings} />
    </>
  );
}
