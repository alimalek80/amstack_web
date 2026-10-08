"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { refreshBlog } from "../actions";
import { dash, type DashPostRow } from "@/lib/dashboard";
import { formatDate } from "@/lib/format";

type Filter = "all" | "published" | "draft";

export default function PostsPage() {
  const [posts, setPosts] = useState<DashPostRow[] | null>(null);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState<Filter>("all");
  const [query, setQuery] = useState("");

  useEffect(() => {
    dash<DashPostRow[]>("/posts/")
      .then(setPosts)
      .catch((err: Error) => setError(err.message));
  }, []);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return (posts ?? []).filter(
      (p) =>
        (filter === "all" || (filter === "published") === p.is_published) &&
        (!q || p.title.toLowerCase().includes(q) || p.category?.name.toLowerCase().includes(q)),
    );
  }, [posts, filter, query]);

  async function remove(post: DashPostRow) {
    if (!window.confirm(`Delete "${post.title}"? This cannot be undone.`)) return;
    try {
      await dash(`/posts/${post.id}/`, { method: "DELETE" });
      setPosts((list) => list?.filter((p) => p.id !== post.id) ?? null);
      refreshBlog();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not delete the post.");
    }
  }

  const counts = {
    all: posts?.length ?? 0,
    published: posts?.filter((p) => p.is_published).length ?? 0,
    draft: posts?.filter((p) => !p.is_published).length ?? 0,
  };

  return (
    <div className="dash-page">
      <header className="dash-page-head">
        <h1>Posts</h1>
        <Link href="/admin-dashboard/posts/new" className="dash-btn dash-btn-primary">
          + New post
        </Link>
      </header>

      <div className="dash-toolbar">
        <div className="dash-tabs" role="tablist" aria-label="Filter posts">
          {(["all", "published", "draft"] as const).map((f) => (
            <button
              key={f}
              type="button"
              role="tab"
              aria-selected={filter === f}
              className={filter === f ? "is-active" : undefined}
              onClick={() => setFilter(f)}
            >
              {f === "all" ? "All" : f === "published" ? "Published" : "Drafts"} <span>{counts[f]}</span>
            </button>
          ))}
        </div>
        <input
          type="search"
          className="dash-search"
          placeholder="Search posts"
          aria-label="Search posts"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>

      {error && (
        <p className="dash-alert" role="alert">
          {error}
        </p>
      )}

      {posts === null && !error ? (
        <p className="dash-muted">Loading posts…</p>
      ) : visible.length === 0 ? (
        <div className="dash-empty">
          <p>{posts?.length ? "No posts match this filter." : "No posts yet. Write your first tutorial."}</p>
          {!posts?.length && (
            <Link href="/admin-dashboard/posts/new" className="dash-btn dash-btn-primary">
              Write a post
            </Link>
          )}
        </div>
      ) : (
        <div className="dash-table-wrap">
          <table className="dash-table">
            <thead>
              <tr>
                <th>Title</th>
                <th>Category</th>
                <th>Status</th>
                <th>Updated</th>
                <th>
                  <span className="sr-only">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {visible.map((post) => (
                <tr key={post.id}>
                  <td>
                    <Link href={`/admin-dashboard/posts/${post.id}`} className="dash-row-title">
                      {post.title}
                    </Link>
                    <small className="dash-muted">/blog/{post.slug}</small>
                  </td>
                  <td>{post.category?.name ?? <span className="dash-muted">None</span>}</td>
                  <td>
                    <span className={post.is_published ? "dash-pill dash-pill-live" : "dash-pill"}>
                      {post.is_published ? "Published" : "Draft"}
                    </span>
                  </td>
                  <td>{formatDate(post.updated_at)}</td>
                  <td className="dash-row-actions">
                    <Link href={`/admin-dashboard/posts/${post.id}`}>Edit</Link>
                    {post.is_published ? (
                      <a href={`/blog/${post.slug}`} target="_blank" rel="noopener noreferrer">
                        View
                      </a>
                    ) : (
                      <a href={`/admin-dashboard/preview/${post.id}`} target="_blank" rel="noopener noreferrer">
                        Preview
                      </a>
                    )}
                    <button type="button" className="dash-link-btn dash-danger" onClick={() => remove(post)}>
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
