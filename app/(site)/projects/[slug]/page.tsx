import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import Breadcrumbs from "@/components/Breadcrumbs";
import ProjectGallery from "@/components/ProjectGallery";
import RepoLink from "@/components/RepoLink";
import RichText from "@/components/RichText";
import { getProject, mediaPath } from "@/lib/api";

function displayHost(url: string): string {
  try {
    return new URL(url).host.replace(/^www\./, "");
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
            {project.repo_url && <RepoLink url={project.repo_url} />}
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
