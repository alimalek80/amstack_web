"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { type ReactNode, useEffect, useState } from "react";
import { dash, type DashUser } from "@/lib/dashboard";

const NAV = [
  { href: "/admin-dashboard", label: "Posts", match: (p: string) => p === "/admin-dashboard" || /^\/admin-dashboard\/posts\/\d+/.test(p) },
  { href: "/admin-dashboard/posts/new", label: "New post", match: (p: string) => p === "/admin-dashboard/posts/new" },
  { href: "/admin-dashboard/categories", label: "Categories", match: (p: string) => p.startsWith("/admin-dashboard/categories") },
];

// Signed-in frame for every dashboard page: checks the session, then shows the sidebar.
export default function DashShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<DashUser | null>(null);

  useEffect(() => {
    dash<DashUser>("/auth/me/")
      .then(setUser)
      .catch(() => router.replace(`/admin-dashboard/login?next=${encodeURIComponent(pathname)}`));
    // Checked once per visit; the API itself rejects any expired session.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function logout() {
    await dash("/auth/logout/", { method: "POST" }).catch(() => {});
    router.replace("/admin-dashboard/login");
  }

  if (!user) {
    return (
      <div className="dash-loading" role="status">
        Checking your session…
      </div>
    );
  }

  return (
    <div className="dash-app">
      <aside className="dash-side">
        <Link href="/admin-dashboard" className="dash-brand">
          amstack<span>.</span> <small>dashboard</small>
        </Link>
        <nav className="dash-nav" aria-label="Dashboard">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={item.match(pathname) ? "is-active" : undefined}
              aria-current={item.match(pathname) ? "page" : undefined}
            >
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="dash-side-foot">
          <a href="/blog" target="_blank" rel="noopener noreferrer">
            View blog ↗
          </a>
          <span className="dash-user" title={user.email}>
            {user.email}
          </span>
          <button type="button" className="dash-link-btn" onClick={logout}>
            Log out
          </button>
        </div>
      </aside>
      <div className="dash-main">{children}</div>
    </div>
  );
}
