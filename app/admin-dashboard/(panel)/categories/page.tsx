"use client";

import { type FormEvent, useEffect, useState } from "react";
import { refreshBlog } from "../../actions";
import { dash, type DashCategory, DashError } from "@/lib/dashboard";

type Draft = { name: string; slug: string; description: string; order: number };
const EMPTY: Draft = { name: "", slug: "", description: "", order: 0 };

function CategoryForm({
  initial,
  submitLabel,
  onSubmit,
  onCancel,
}: {
  initial: Draft;
  submitLabel: string;
  onSubmit: (draft: Draft) => Promise<void>;
  onCancel?: () => void;
}) {
  const [draft, setDraft] = useState(initial);
  const [error, setError] = useState<DashError | Error | null>(null);
  const [busy, setBusy] = useState(false);
  const set = (patch: Partial<Draft>) => setDraft((d) => ({ ...d, ...patch }));

  async function submit(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await onSubmit(draft);
      if (!onCancel) setDraft(EMPTY);
    } catch (err) {
      setError(err as Error);
    } finally {
      setBusy(false);
    }
  }

  const fieldError = (name: string) => (error instanceof DashError ? error.field(name) : undefined);

  return (
    <form className="dash-cat-form" onSubmit={submit}>
      <label className="dash-field">
        <span>Name</span>
        <input value={draft.name} onChange={(e) => set({ name: e.target.value })} required maxLength={100} />
        {fieldError("name") && <small className="dash-error">{fieldError("name")}</small>}
      </label>
      <label className="dash-field">
        <span>Slug</span>
        <input
          value={draft.slug}
          onChange={(e) => set({ slug: e.target.value })}
          placeholder="Made from the name"
          pattern="[-a-zA-Z0-9_]*"
        />
        {fieldError("slug") && <small className="dash-error">{fieldError("slug")}</small>}
      </label>
      <label className="dash-field dash-field-wide">
        <span>Description (optional)</span>
        <input value={draft.description} onChange={(e) => set({ description: e.target.value })} />
      </label>
      <label className="dash-field">
        <span>Order</span>
        <input type="number" min={0} value={draft.order} onChange={(e) => set({ order: Number(e.target.value) || 0 })} />
      </label>
      <div className="dash-cat-actions">
        <button type="submit" className="dash-btn dash-btn-primary" disabled={busy}>
          {busy ? "Saving…" : submitLabel}
        </button>
        {onCancel && (
          <button type="button" className="dash-btn" onClick={onCancel}>
            Cancel
          </button>
        )}
      </div>
      {error && !(error instanceof DashError && (error.field("name") || error.field("slug"))) && (
        <p className="dash-alert dash-field-wide" role="alert">
          {error.message}
        </p>
      )}
    </form>
  );
}

export default function CategoriesPage() {
  const [categories, setCategories] = useState<DashCategory[] | null>(null);
  const [editing, setEditing] = useState<number | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    dash<DashCategory[]>("/categories/")
      .then(setCategories)
      .catch((err: Error) => setError(err.message));
  }, []);

  const sorted = (list: DashCategory[]) =>
    [...list].sort((a, b) => a.order - b.order || a.name.localeCompare(b.name));

  async function create(draft: Draft) {
    const created = await dash<DashCategory>("/categories/", { method: "POST", json: draft });
    setCategories((list) => sorted([...(list ?? []), { ...created, post_count: 0 }]));
    refreshBlog();
  }

  async function update(id: number, draft: Draft) {
    const saved = await dash<DashCategory>(`/categories/${id}/`, { method: "PATCH", json: draft });
    setCategories((list) => sorted((list ?? []).map((c) => (c.id === id ? { ...c, ...saved } : c))));
    setEditing(null);
    refreshBlog();
  }

  async function remove(category: DashCategory) {
    const note = category.post_count ? ` Its ${category.post_count} post(s) will have no category.` : "";
    if (!window.confirm(`Delete the category "${category.name}"?${note}`)) return;
    try {
      await dash(`/categories/${category.id}/`, { method: "DELETE" });
      setCategories((list) => list?.filter((c) => c.id !== category.id) ?? null);
      refreshBlog();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not delete the category.");
    }
  }

  return (
    <div className="dash-page">
      <header className="dash-page-head">
        <h1>Categories</h1>
      </header>

      <section className="dash-card">
        <h2>Add a category</h2>
        <CategoryForm initial={EMPTY} submitLabel="Add category" onSubmit={create} />
      </section>

      {error && (
        <p className="dash-alert" role="alert">
          {error}
        </p>
      )}

      {categories === null && !error ? (
        <p className="dash-muted">Loading categories…</p>
      ) : categories?.length === 0 ? (
        <p className="dash-empty">No categories yet. Add one above, for example “Django” or “Next.js”.</p>
      ) : (
        <ul className="dash-cat-list">
          {categories?.map((category) =>
            editing === category.id ? (
              <li key={category.id} className="dash-card">
                <CategoryForm
                  initial={category}
                  submitLabel="Save"
                  onSubmit={(draft) => update(category.id, draft)}
                  onCancel={() => setEditing(null)}
                />
              </li>
            ) : (
              <li key={category.id} className="dash-cat-row">
                <div>
                  <strong>{category.name}</strong>
                  <small className="dash-muted">
                    /{category.slug} · {category.post_count} post{category.post_count === 1 ? "" : "s"}
                    {category.description && ` · ${category.description}`}
                  </small>
                </div>
                <div className="dash-row-actions">
                  <button type="button" className="dash-link-btn" onClick={() => setEditing(category.id)}>
                    Edit
                  </button>
                  <button type="button" className="dash-link-btn dash-danger" onClick={() => remove(category)}>
                    Delete
                  </button>
                </div>
              </li>
            ),
          )}
        </ul>
      )}
    </div>
  );
}
