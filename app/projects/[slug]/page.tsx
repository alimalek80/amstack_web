import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import Breadcrumbs from "@/components/Breadcrumbs";
import RichText from "@/components/RichText";
import { getProject, mediaPath } from "@/lib/api";

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

        {sections.map((section) => (
          <div key={section.label} className="case-section">
            <h2 className="eyebrow">{section.label}</h2>
            <RichText text={section.text} />
          </div>
        ))}

        <div className="actions">
          {project.live_url && (
            <a href={project.live_url} className="btn btn-ghost" rel="noopener noreferrer">
              Visit live site
            </a>
          )}
          <Link href="/contact" className="btn">
            Start a similar project
          </Link>
        </div>
      </div>
    </section>
  );
}
