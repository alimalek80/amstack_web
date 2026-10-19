// Browser only: records one view and returns the new total, or null on any failure.
export async function recordPostView(slug: string): Promise<number | null> {
  try {
    const response = await fetch(`/api/blog/posts/${encodeURIComponent(slug)}/view/`, {
      method: "POST",
      headers: { Accept: "application/json" },
      cache: "no-store",
    });
    if (!response.ok) return null;
    const data = (await response.json()) as { view_count?: unknown };
    return typeof data.view_count === "number" ? data.view_count : null;
  } catch {
    return null;
  }
}
