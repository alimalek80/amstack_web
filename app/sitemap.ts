import type { MetadataRoute } from "next";
import { getPosts, getProjects, getServices } from "@/lib/api";

// Built per request so it works without the API being reachable at build time.
export const dynamic = "force-dynamic";

const SITE_URL = process.env.SITE_URL ?? "https://amstack.org";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const pages = ["", "/services", "/projects", "/blog", "/about", "/contact"].map((path) => ({
    url: `${SITE_URL}${path}`,
  }));
  try {
    const [services, projects, posts] = await Promise.all([getServices(), getProjects(), getPosts()]);
    return [
      ...pages,
      ...services.map((service) => ({ url: `${SITE_URL}/services/${service.slug}` })),
      ...projects.map((project) => ({ url: `${SITE_URL}/projects/${project.slug}` })),
      ...posts.map((post) => ({
        url: `${SITE_URL}/blog/${post.slug}`,
        lastModified: post.published_at ?? undefined,
      })),
    ];
  } catch {
    return pages;
  }
}
