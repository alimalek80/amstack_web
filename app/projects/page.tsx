import type { Metadata } from "next";
import { connection } from "next/server";
import ProjectCard from "@/components/ProjectCard";
import { getProjects } from "@/lib/api";

export const metadata: Metadata = {
  title: "Projects",
  description: "Selected projects and case studies.",
};

export default async function ProjectsPage() {
  await connection();
  const projects = await getProjects();

  return (
    <section className="section">
      <div className="container">
        <h1>Projects</h1>
        {projects.length === 0 ? (
          <p className="lead">Case studies will appear here soon.</p>
        ) : (
          <div className="grid">
            {projects.map((project) => (
              <ProjectCard key={project.slug} project={project} />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
