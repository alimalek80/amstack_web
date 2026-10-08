import type { ReactNode } from "react";
import DashShell from "@/components/dashboard/DashShell";

export default function PanelLayout({ children }: { children: ReactNode }) {
  return <DashShell>{children}</DashShell>;
}
