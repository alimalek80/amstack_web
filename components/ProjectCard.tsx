import Link from "next/link";
import { mediaPath } from "@/lib/api";
import type { ProjectSummary } from "@/lib/types";

export default function ProjectCard({ project }: { project: ProjectSummary }) {
  const image = mediaPath(project.cover_image);
  return (
    <Link href={`/projects/${project.slug}`} className="card">
      {image && (
        // Plain <img>: the file is served by Caddy/Django from this same domain.
        // eslint-disable-next-line @next/next/no-img-element
        <img className="card-img" src={image} alt="" loading="lazy" />
      )}
      <div className="card-body">
        <h3>{project.title}</h3>
        {project.client_name && <p className="meta">{project.client_name}</p>}
        <p>{project.summary}</p>
        {project.tech_stack.length > 0 && (
          <ul className="chips">
            {project.tech_stack.map((tech) => (
              <li key={tech.slug} className="chip">
                {tech.name}
              </li>
            ))}
          </ul>
        )}
      </div>
    </Link>
  );
}
