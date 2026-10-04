import type { MetadataRoute } from "next";
import { getProjects, getServices } from "@/lib/api";

// Built per request so it works without the API being reachable at build time.
export const dynamic = "force-dynamic";

const SITE_URL = process.env.SITE_URL ?? "https://amstack.org";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const pages = ["", "/services", "/projects", "/contact"].map((path) => ({
    url: `${SITE_URL}${path}`,
  }));
  try {
    const [services, projects] = await Promise.all([getServices(), getProjects()]);
    return [
      ...pages,
      ...services.map((service) => ({ url: `${SITE_URL}/services/${service.slug}` })),
      ...projects.map((project) => ({ url: `${SITE_URL}/projects/${project.slug}` })),
    ];
  } catch {
    return pages;
  }
}
