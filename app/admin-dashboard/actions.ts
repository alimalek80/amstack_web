"use server";

import { updateTag } from "next/cache";
import { headers } from "next/headers";
import { API_ORIGIN, BLOG_TAG } from "@/lib/api";

// Called by the dashboard after a save, so the public blog shows the change right away
// instead of after the normal cache time. Only works for a logged-in superuser.
export async function refreshBlog(): Promise<void> {
  const cookie = (await headers()).get("cookie") ?? "";
  const response = await fetch(`${API_ORIGIN}/api/dashboard/auth/me/`, {
    headers: { cookie },
    cache: "no-store",
  });
  if (response.ok) updateTag(BLOG_TAG);
}
