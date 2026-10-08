import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import Breadcrumbs from "@/components/Breadcrumbs";
import ProjectGallery from "@/components/ProjectGallery";
import RichText from "@/components/RichText";
import { getProject, mediaPath } from "@/lib/api";

function displayHost(url: string): string {
  try {
    return new URL(url).host.replace(/^www\./, "");
  } catch {
    return url;
  }
}

function displayRepo(url: string): string {
  try {
    const u = new URL(url);
    return (u.host.replace(/^www\./, "") + u.pathname).replace(/\/$/, "");
  } catch {
    return url;
  }
}

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const project = await getProject(slug);
  return project ? { title: project.title, description: project.summary } : {};
}

export default async function ProjectDetailPage({ params }: Props) {
  await connection();
  const { slug } = await params;
  const project = await getProject(slug);
  if (!project) notFound();

  const image = mediaPath(project.cover_image);
  const gallery = project.images.map((img) => ({
    src: mediaPath(img.image) ?? "",
    alt: img.alt || project.title,
    caption: img.caption,
  }));
  const sections = [
    { label: "Problem", text: project.problem },
    { label: "Solution", text: project.solution },
    { label: "Result", text: project.result },
  ].filter((section) => section.text);

  return (
    <section className="section">
      <Breadcrumbs items={[{ label: "Projects", href: "/projects" }, { label: project.title }]} />
      <div className="container prose">
        <h1>{project.title}</h1>
        {project.client_name && <p className="meta">{project.client_name}</p>}
        <p className="lead">{project.summary}</p>

        {project.tech_stack.length > 0 && (
          <ul className="chips">
            {project.tech_stack.map((tech) => (
              <li key={tech.slug} className="chip">
                {tech.name}
              </li>
            ))}
          </ul>
        )}

        {image && (
          // eslint-disable-next-line @next/next/no-img-element
          <img className="cover" src={image} alt={project.title} />
        )}

        <ProjectGallery images={gallery} />

        {sections.map((section) => (
          <div key={section.label} className="case-section">
            <h2 className="eyebrow">{section.label}</h2>
            <RichText text={section.text} />
          </div>
        ))}

        {(project.live_url || project.repo_url) && (
          <div className="project-links">
            {project.live_url && (
              <a href={project.live_url} className="project-link" target="_blank" rel="noopener noreferrer">
                <span className="project-link-icon" aria-hidden="true">
                  <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="9" />
                    <path d="M3 12h18M12 3c2.5 2.6 3.8 5.6 3.8 9s-1.3 6.4-3.8 9c-2.5-2.6-3.8-5.6-3.8-9S9.5 5.6 12 3z" />
                  </svg>
                </span>
                <span className="project-link-text">
                  <strong>Live website</strong>
                  <small>{displayHost(project.live_url)}</small>
                </span>
                <span className="project-link-arrow" aria-hidden="true">↗</span>
              </a>
            )}
            {project.repo_url && (
              <a href={project.repo_url} className="project-link" target="_blank" rel="noopener noreferrer">
                <span className="project-link-icon" aria-hidden="true">
                  <svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor">
                    <path d="M12 2C6.48 2 2 6.58 2 12.25c0 4.53 2.87 8.37 6.84 9.73.5.1.68-.22.68-.49 0-.24-.01-.88-.01-1.73-2.78.62-3.37-1.37-3.37-1.37-.45-1.18-1.11-1.5-1.11-1.5-.91-.64.07-.62.07-.62 1 .07 1.53 1.05 1.53 1.05.9 1.56 2.35 1.11 2.92.85.09-.66.35-1.11.64-1.37-2.22-.26-4.56-1.13-4.56-5.04 0-1.11.39-2.02 1.03-2.74-.1-.26-.45-1.3.1-2.71 0 0 .84-.28 2.75 1.05a9.4 9.4 0 0 1 5 0c1.91-1.33 2.75-1.05 2.75-1.05.55 1.41.2 2.45.1 2.71.64.72 1.03 1.63 1.03 2.74 0 3.92-2.34 4.78-4.57 5.03.36.32.68.94.68 1.9 0 1.37-.01 2.47-.01 2.81 0 .27.18.59.69.49A10.2 10.2 0 0 0 22 12.25C22 6.58 17.52 2 12 2z" />
                  </svg>
                </span>
                <span className="project-link-text">
                  <strong>Source code</strong>
                  <small>{displayRepo(project.repo_url)}</small>
                </span>
                <span className="project-link-arrow" aria-hidden="true">↗</span>
              </a>
            )}
          </div>
        )}

        <div className="actions">
          <Link href="/contact" className="btn">
            Start a similar project
          </Link>
        </div>
      </div>
    </section>
  );
}
