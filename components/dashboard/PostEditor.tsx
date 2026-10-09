"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { refreshBlog } from "@/app/admin-dashboard/actions";
import { type DashCategory, DashError, type DashPost, dash } from "@/lib/dashboard";
import { formatDate } from "@/lib/format";
import type { RichDoc, RichNode } from "@/lib/types";
import RichEditor from "./editor/RichEditor";
import ImagePicker from "./ImagePicker";

type Form = {
  title: string;
  slug: string;
  excerpt: string;
  category: number | null;
  cover: number | null;
  cover_url: string | null;
  repo_url: string;
  is_published: boolean;
  body: RichDoc;
};

const EMPTY_DOC: RichDoc = { type: "doc", content: [] };

function plainText(node: RichNode): string {
  if (node.type === "text") return node.text ?? "";
  return (node.content ?? []).map(plainText).join(" ");
}

function hasNode(node: RichNode, type: string): boolean {
  return node.type === type || (node.content ?? []).some((child) => hasNode(child, type));
}

// Tiptap keeps one empty paragraph in an empty editor; treat that as no content.
function isEmptyDoc(doc: RichDoc): boolean {
  return !plainText(doc).trim() && !hasNode(doc, "image") && !hasNode(doc, "horizontalRule");
}

const EMPTY: Form = {
  title: "",
  slug: "",
  excerpt: "",
  category: null,
  cover: null,
  cover_url: null,
  repo_url: "",
  is_published: false,
  body: EMPTY_DOC,
};

function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^\w\s-]/g, "")
    .trim()
    .replace(/[\s_-]+/g, "-")
    .slice(0, 200);
}

function fromPost(post: DashPost): Form {
  return {
    title: post.title,
    slug: post.slug,
    excerpt: post.excerpt,
    category: post.category,
    cover: post.cover,
    cover_url: post.cover_url,
    repo_url: post.repo_url,
    is_published: post.is_published,
    body: post.body?.type === "doc" ? post.body : EMPTY_DOC,
  };
}

function payload(form: Form, publish: boolean) {
  return {
    title: form.title.trim(),
    slug: form.slug.trim(),
    excerpt: form.excerpt.trim(),
    category: form.category,
    cover: form.cover,
    repo_url: form.repo_url.trim(),
    is_published: publish,
    body: isEmptyDoc(form.body) ? EMPTY_DOC : form.body,
  };
}

export default function PostEditor({ postId }: { postId?: number }) {
  const router = useRouter();
  const [form, setForm] = useState<Form | null>(postId ? null : EMPTY);
  const [saved, setSaved] = useState<string>(JSON.stringify(postId ? null : EMPTY));
  const [post, setPost] = useState<DashPost | null>(null);
  const [categories, setCategories] = useState<DashCategory[]>([]);
  const [slugTouched, setSlugTouched] = useState(Boolean(postId));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<DashError | Error | null>(null);
  const [notice, setNotice] = useState("");
  const [titleMissing, setTitleMissing] = useState(false);
  const titleRef = useRef<HTMLTextAreaElement>(null);

  // The formatting toolbar sticks right under the top bar, whose height changes when its
  // buttons wrap, so keep its real height in a CSS variable.
  const trackBarHeight = useCallback((bar: HTMLDivElement | null) => {
    if (!bar) return;
    const root = bar.parentElement!;
    const update = () => root.style.setProperty("--editor-bar-h", `${bar.offsetHeight}px`);
    const observer = new ResizeObserver(update);
    observer.observe(bar);
    update();
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    dash<DashCategory[]>("/categories/").then(setCategories).catch(() => {});
    if (!postId) return;
    dash<DashPost>(`/posts/${postId}/`)
      .then((p) => {
        const f = fromPost(p);
        setPost(p);
        setForm(f);
        setSaved(JSON.stringify(f));
      })
      .catch((err: Error) => setError(err));
  }, [postId]);

  const dirty = form !== null && JSON.stringify(form) !== saved;

  // Warn before leaving with unsaved changes.
  useEffect(() => {
    if (!dirty) return;
    const warn = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);

  const set = (patch: Partial<Form>) => setForm((f) => (f ? { ...f, ...patch } : f));

  const save = useCallback(
    async (publish: boolean) => {
      if (!form || busy) return;
      if (!form.title.trim()) {
        setTitleMissing(true);
        setError(new Error("Add a title before saving. It goes in the Title field at the top."));
        titleRef.current?.focus();
        return;
      }
      setBusy(true);
      setError(null);
      setNotice("");
      try {
        const body = payload(form, publish);
        const result = postId
          ? await dash<DashPost>(`/posts/${postId}/`, { method: "PATCH", json: body })
          : await dash<DashPost>("/posts/", { method: "POST", json: body });
        // Keep the editor's own document, so the snapshot matches what the editor reports next.
        const next = { ...fromPost(result), body: form.body };
        setPost(result);
        setForm(next);
        setSaved(JSON.stringify(next));
        setSlugTouched(true);
        refreshBlog();
        setNotice(publish ? (form.is_published ? "Changes are live." : "Published.") : form.is_published ? "Unpublished. The post is a draft again." : "Draft saved.");
        if (!postId) router.replace(`/admin-dashboard/posts/${result.id}`);
      } catch (err) {
        setError(err as Error);
      } finally {
        setBusy(false);
      }
    },
    [form, busy, postId, router],
  );

  // Ctrl/Cmd + S saves without changing the published state.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "s") {
        e.preventDefault();
        if (form) save(form.is_published);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [form, save]);

  const fieldError = (name: string) => (error instanceof DashError ? error.field(name) : undefined);
  const wordCount = useMemo(() => {
    const text = form ? plainText(form.body).trim() : "";
    return text ? text.split(/\s+/).length : 0;
  }, [form?.body]);

  if (!form) {
    return (
      <div className="dash-page">
        {error ? (
          <p className="dash-alert" role="alert">
            {error instanceof DashError && error.status === 404 ? "This post does not exist." : error.message}
          </p>
        ) : (
          <p className="dash-muted">Loading post…</p>
        )}
      </div>
    );
  }

  const status = form.is_published ? "Published" : "Draft";

  return (
    <div className="dash-editor">
      <div className="dash-editor-bar" ref={trackBarHeight}>
        <Link href="/admin-dashboard" className="dash-back">
          ← Posts
        </Link>
        <span className={form.is_published ? "dash-pill dash-pill-live" : "dash-pill"}>{status}</span>
        <span className="dash-save-state" aria-live="polite">
          {busy ? "Saving…" : dirty ? "Unsaved changes" : notice}
        </span>
        <div className="dash-editor-actions">
          {post && (
            <a
              href={form.is_published && !dirty ? `/blog/${post.slug}` : `/admin-dashboard/preview/${post.id}`}
              target="_blank"
              rel="noopener noreferrer"
              className="dash-btn"
              title={dirty ? "Preview shows the last saved version" : undefined}
            >
              {form.is_published && !dirty ? "View" : "Preview"}
            </a>
          )}
          {form.is_published ? (
            <>
              <button type="button" className="dash-btn" onClick={() => save(false)} disabled={busy}>
                Unpublish
              </button>
              <button type="button" className="dash-btn dash-btn-primary" onClick={() => save(true)} disabled={busy || !dirty}>
                Update
              </button>
            </>
          ) : (
            <>
              <button type="button" className="dash-btn" onClick={() => save(false)} disabled={busy}>
                Save draft
              </button>
              <button type="button" className="dash-btn dash-btn-primary" onClick={() => save(true)} disabled={busy}>
                Publish
              </button>
            </>
          )}
        </div>
      </div>

      {error && (
        <p className="dash-alert dash-editor-alert" role="alert">
          {error.message}
        </p>
      )}

      <div className="dash-editor-grid">
        <div className="dash-editor-main">
          <label className="dash-title-label" htmlFor="post-title">
            Title
          </label>
          <textarea
            id="post-title"
            ref={titleRef}
            className={titleMissing ? "dash-title-input is-invalid" : "dash-title-input"}
            value={form.title}
            onChange={(e) => {
              const title = e.target.value.replace(/\n/g, " ");
              if (title.trim()) setTitleMissing(false);
              set(slugTouched ? { title } : { title, slug: slugify(title) });
            }}
            placeholder="Write the post title…"
            rows={1}
            aria-invalid={titleMissing}
          />
          <textarea
            className="dash-excerpt-input"
            value={form.excerpt}
            onChange={(e) => set({ excerpt: e.target.value })}
            placeholder="One or two sentences: what will the reader learn or build?"
            rows={2}
            aria-label="Excerpt"
          />

          <div className="dash-blocks-head">
            <span className="dash-muted">
              {wordCount} words · about {Math.max(1, Math.round(wordCount / 200))} min read
            </span>
          </div>

          <RichEditor initial={form.body} onChange={(body) => set({ body })} />
        </div>

        <aside className="dash-editor-side">
          <section className="dash-card">
            <h2>Post settings</h2>
            <label className="dash-field">
              <span>Category</span>
              <select
                value={form.category ?? ""}
                onChange={(e) => set({ category: e.target.value ? Number(e.target.value) : null })}
              >
                <option value="">No category</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
              {categories.length === 0 && (
                <small className="dash-muted">
                  <Link href="/admin-dashboard/categories">Create a category</Link> first.
                </small>
              )}
            </label>
            <label className="dash-field">
              <span>URL slug</span>
              <div className="dash-prefixed">
                <span>/blog/</span>
                <input
                  value={form.slug}
                  onChange={(e) => {
                    setSlugTouched(true);
                    set({ slug: slugify(e.target.value) || e.target.value.toLowerCase() });
                  }}
                  placeholder="made-from-title"
                />
              </div>
              {fieldError("slug") && <small className="dash-error">{fieldError("slug")}</small>}
            </label>
            <label className="dash-field">
              <span>Repository link (optional)</span>
              <input
                type="url"
                value={form.repo_url}
                onChange={(e) => set({ repo_url: e.target.value })}
                placeholder="https://github.com/you/repo"
              />
              {fieldError("repo_url") && <small className="dash-error">{fieldError("repo_url")}</small>}
            </label>
          </section>

          <section className="dash-card">
            <h2>Cover image</h2>
            {form.cover_url ? (
              <div className="dash-cover">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={form.cover_url} alt="" />
                <button type="button" className="dash-link-btn dash-danger" onClick={() => set({ cover: null, cover_url: null })}>
                  Remove cover
                </button>
              </div>
            ) : (
              <ImagePicker label="Upload cover" onUploaded={(img) => set({ cover: img.id, cover_url: img.url })} />
            )}
          </section>

          {post && (
            <section className="dash-card dash-meta-card">
              <p>
                <span>Created</span> {formatDate(post.created_at)}
              </p>
              <p>
                <span>Published</span> {post.published_at ? formatDate(post.published_at) : "Not yet"}
              </p>
              <p>
                <span>Last saved</span> {formatDate(post.updated_at)}
              </p>
            </section>
          )}
          <p className="dash-muted dash-hint">Ctrl + S saves. Paste Markdown and it is converted. In code blocks, Tab indents.</p>
        </aside>
      </div>
    </div>
  );
}
