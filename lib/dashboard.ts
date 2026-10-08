// Browser-side client for the superuser dashboard API (/api/dashboard/*).
// Uses the Django session cookie; every write sends the CSRF token from the csrftoken cookie.

import type { PostBlock } from "./types";

export type DashUser = { email: string; name: string };
export type DashCategory = {
  id: number;
  name: string;
  slug: string;
  description: string;
  order: number;
  post_count: number;
};
export type DashPostRow = {
  id: number;
  title: string;
  slug: string;
  category: { name: string; slug: string } | null;
  is_published: boolean;
  published_at: string | null;
  updated_at: string;
};
export type DashPost = {
  id: number;
  title: string;
  slug: string;
  excerpt: string;
  category: number | null;
  category_name: string | null;
  cover: number | null;
  cover_url: string | null;
  body: PostBlock[];
  repo_url: string;
  is_published: boolean;
  published_at: string | null;
  reading_minutes: number;
  created_at: string;
  updated_at: string;
};
export type DashImage = { id: number; url: string };

export class DashError extends Error {
  constructor(
    public status: number,
    public data: unknown,
  ) {
    super(errorMessage(status, data));
  }

  // Message for one field, if the API returned field errors.
  field(name: string): string | undefined {
    const value = (this.data as Record<string, unknown> | null)?.[name];
    return Array.isArray(value) ? String(value[0]) : typeof value === "string" ? value : undefined;
  }
}

function errorMessage(status: number, data: unknown): string {
  if (data && typeof data === "object") {
    const record = data as Record<string, unknown>;
    if (typeof record.detail === "string") return record.detail;
    const first = Object.entries(record)[0];
    if (first) {
      const [field, value] = first;
      const text = Array.isArray(value) ? String(value[0]) : String(value);
      return field === "non_field_errors" ? text : `${field.replace(/_/g, " ")}: ${text}`;
    }
  }
  if (status === 413) return "The file is too large.";
  if (status >= 500) return "The server had a problem. Try again in a moment.";
  return `Request failed (${status}).`;
}

function csrfToken(): string {
  const match = document.cookie.match(/(?:^|;\s*)csrftoken=([^;]+)/);
  return match ? decodeURIComponent(match[1]) : "";
}

type Options = { method?: "GET" | "POST" | "PATCH" | "PUT" | "DELETE"; json?: unknown; form?: FormData };

// Paths must end with a slash, as Django expects.
export async function dash<T>(path: string, { method = "GET", json, form }: Options = {}): Promise<T> {
  const headers: Record<string, string> = { Accept: "application/json" };
  let body: BodyInit | undefined;
  if (json !== undefined) {
    headers["Content-Type"] = "application/json";
    body = JSON.stringify(json);
  } else if (form) {
    body = form;
  }
  if (method !== "GET") headers["X-CSRFToken"] = csrfToken();

  const response = await fetch(`/api/dashboard${path}`, {
    method,
    headers,
    body,
    credentials: "same-origin",
    cache: "no-store",
  });
  if (response.status === 204) return undefined as T;
  const data = await response.json().catch(() => null);
  if (!response.ok) throw new DashError(response.status, data);
  return data as T;
}

export function uploadImage(file: File): Promise<DashImage> {
  const form = new FormData();
  form.append("image", file);
  return dash<DashImage>("/images/", { method: "POST", form });
}

export function isAuthError(error: unknown): boolean {
  return error instanceof DashError && (error.status === 401 || error.status === 403);
}
