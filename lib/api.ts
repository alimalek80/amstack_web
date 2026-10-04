import type {
  ProjectDetail,
  ProjectSummary,
  ServiceDetail,
  ServiceSummary,
  SiteSettings,
} from "./types";

const API_ORIGIN = process.env.API_ORIGIN ?? "http://127.0.0.1:8000";

// Responses are cached by Next.js for 10 minutes, so most visits never reach Django.
const REVALIDATE_SECONDS = Number(process.env.API_REVALIDATE_SECONDS ?? 600);

export class ApiError extends Error {
  constructor(
    public status: number,
    path: string,
  ) {
    super(`API request failed (${status}): ${path}`);
  }
}

async function apiGet<T>(path: string): Promise<T> {
  const response = await fetch(`${API_ORIGIN}/api${path}`, {
    next: { revalidate: REVALIDATE_SECONDS },
  });
  if (!response.ok) throw new ApiError(response.status, path);
  return response.json() as Promise<T>;
}

async function getOrNull<T>(path: string): Promise<T | null> {
  try {
    return await apiGet<T>(path);
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) return null;
    throw error;
  }
}

export const DEFAULT_SETTINGS: SiteSettings = {
  hero_headline: "Websites, online stores, bots and SaaS, built end to end",
  hero_subheadline:
    "Company sites, shops, custom features, website chatbots, Telegram bots and SaaS platforms, from simple to advanced.",
  about_text: "",
  email: "",
  linkedin_url: "",
  github_url: "",
  booking_url: "",
};

// Never throws: the footer and hero can fall back to defaults if the API is down.
export async function getSettings(): Promise<SiteSettings> {
  try {
    return await apiGet<SiteSettings>("/settings/");
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export const getServices = () => apiGet<ServiceSummary[]>("/services/");
export const getService = (slug: string) => getOrNull<ServiceDetail>(`/services/${slug}/`);

export const getProjects = (featuredOnly = false) =>
  apiGet<ProjectSummary[]>(featuredOnly ? "/projects/?featured=true" : "/projects/");
export const getProject = (slug: string) => getOrNull<ProjectDetail>(`/projects/${slug}/`);

// Django returns absolute image URLs using the host it was called with (for example
// http://backend:8000 inside Docker), which a browser cannot open. Keep only the path
// so the image is requested from this site's own domain.
export function mediaPath(url: string | null): string | null {
  if (!url) return null;
  try {
    return new URL(url).pathname;
  } catch {
    return url;
  }
}
