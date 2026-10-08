import Link from "next/link";
import { headers } from "next/headers";
import { notFound, redirect } from "next/navigation";
import PostArticle from "@/components/blog/PostArticle";
import { API_ORIGIN } from "@/lib/api";
import type { DashPost } from "@/lib/dashboard";
import type { PostDetail } from "@/lib/types";

export const metadata = { title: "Preview" };

// Shows any post (drafts too) exactly as the public page renders it, for a logged-in superuser.
export default async function PreviewPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!/^\d+$/.test(id)) notFound();

  const cookie = (await headers()).get("cookie") ?? "";
  const response = await fetch(`${API_ORIGIN}/api/dashboard/posts/${id}/`, {
    headers: { cookie },
    cache: "no-store",
  });
  if (response.status === 401 || response.status === 403) {
    redirect(`/admin-dashboard/login?next=/admin-dashboard/preview/${id}`);
  }
  if (!response.ok) notFound();

  const data = (await response.json()) as DashPost;
  const post: PostDetail = {
    title: data.title,
    slug: data.slug,
    excerpt: data.excerpt,
    category: data.category_name ? { name: data.category_name, slug: "" } : null,
    cover_image: data.cover_url,
    published_at: data.published_at,
    reading_minutes: data.reading_minutes,
    body: data.body,
    repo_url: data.repo_url,
    updated_at: data.updated_at,
  };

  return (
    <div className="dash-preview">
      <div className="dash-preview-bar">
        <span className={data.is_published ? "dash-pill dash-pill-live" : "dash-pill"}>
          {data.is_published ? "Published" : "Draft"} preview
        </span>
        <span className="dash-muted">Shows the last saved version.</span>
        <Link href={`/admin-dashboard/posts/${data.id}`} className="dash-btn">
          Back to editor
        </Link>
      </div>
      <main className="section">
        <PostArticle post={post} />
      </main>
    </div>
  );
}
