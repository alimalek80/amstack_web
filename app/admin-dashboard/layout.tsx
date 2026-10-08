import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./dashboard.css";

export const metadata: Metadata = {
  title: { default: "Dashboard", template: "%s | amstack dashboard" },
  robots: { index: false, follow: false },
};

export default function DashboardRootLayout({ children }: { children: ReactNode }) {
  return <div className="dash-root">{children}</div>;
}
