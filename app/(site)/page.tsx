import Link from "next/link";
import { connection } from "next/server";
import RichText from "@/components/RichText";
import { getProjects, getServices, getSettings, mediaPath } from "@/lib/api";
import type { CSSProperties } from "react";
import type { ProjectSummary } from "@/lib/types";

const HOME_PROJECTS = 3;
const HOME_SERVICES = 5;

// First plain paragraph of the about text: the home page only shows a teaser.
function aboutExcerpt(text: string): string {
  const blocks = text.replace(/\r\n/g, "\n").split(/\n\s*\n/);
  return blocks.find((block) => block.trim() && !/^\s*[-*]\s+/.test(block))?.trim() ?? "";
}

function WorkCard({ project }: { project: ProjectSummary }) {
  const image = mediaPath(project.cover_image);
  return (
    <Link href={`/projects/${project.slug}`} className="work-card">
      <div className="work-media">
        {image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={image} alt="" loading="lazy" />
        ) : (
          <span className="work-placeholder" aria-hidden="true">
            {project.title.charAt(0)}
          </span>
        )}
        <span className="work-view" aria-hidden="true">
          View case study &rarr;
        </span>
      </div>
      <div className="work-body">
        {project.client_name && <p className="work-client">{project.client_name}</p>}
        <h3>{project.title}</h3>
        <p className="work-summary">{project.summary}</p>
        {project.tech_stack.length > 0 && (
          <ul className="work-tags">
            {project.tech_stack.slice(0, 3).map((tech) => (
              <li key={tech.slug}>{tech.name}</li>
            ))}
          </ul>
        )}
      </div>
    </Link>
  );
}

export default async function HomePage() {
  // Render per request (the API may not be reachable at build time);
  // the data itself is cached by the API client.
  await connection();
  const [settings, featured, services] = await Promise.all([
    getSettings(),
    getProjects(true),
    getServices(),
  ]);

  // Always show three projects: featured first, then the newest others.
  let projects = featured.slice(0, HOME_PROJECTS);
  if (projects.length < HOME_PROJECTS) {
    const taken = new Set(projects.map((p) => p.slug));
    const others = (await getProjects()).filter((p) => !taken.has(p.slug));
    projects = [...projects, ...others].slice(0, HOME_PROJECTS);
  }

  const about = settings.about_text ? aboutExcerpt(settings.about_text) : "";
  const photo = mediaPath(settings.about_photo);
  const stack = services.slice(0, HOME_SERVICES);

  return (
    <>
      <section className="home-hero">
        <div className="container home-hero-inner">
          <div className="home-hero-copy">
            <p className="kicker">
              <span className="kicker-dot" aria-hidden="true" />
              amstack &middot; web development studio
            </p>
            <h1 className="home-title">{settings.hero_headline}</h1>
            {settings.hero_subheadline && <p className="home-lead">{settings.hero_subheadline}</p>}
            <div className="actions">
              <Link href="/contact" className="btn btn-lg">
                Start a project
              </Link>
              {settings.booking_url ? (
                <a href={settings.booking_url} className="btn btn-ghost btn-lg" rel="noopener noreferrer">
                  Book a call
                </a>
              ) : (
                <Link href="/projects" className="btn btn-ghost btn-lg">
                  See my work
                </Link>
              )}
            </div>
          </div>

          {stack.length > 0 && (
            <nav className="stack" aria-label="Services">
              <p className="stack-label">What I build</p>
              <ul>
                {stack.map((service, i) => (
                  <li key={service.slug} style={{ "--i": i } as CSSProperties}>
                    <Link href={`/services/${service.slug}`} className="stack-layer">
                      <span className="stack-text">
                        <strong>{service.title}</strong>
                        <small>{service.summary}</small>
                      </span>
                      <span className="stack-arrow" aria-hidden="true">
                        &rarr;
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
              <Link href="/services" className="stack-all">
                All services &rarr;
              </Link>
            </nav>
          )}
        </div>
      </section>

      {projects.length > 0 && (
        <section className="home-section">
          <div className="container">
            <div className="home-head">
              <div>
                <p className="kicker">Selected work</p>
                <h2>Recent projects</h2>
              </div>
              <Link href="/projects" className="link-arrow">
                See all projects <span aria-hidden="true">&rarr;</span>
              </Link>
            </div>
            <div className="work-grid">
              {projects.map((project) => (
                <WorkCard key={project.slug} project={project} />
              ))}
            </div>
          </div>
        </section>
      )}

      {about && (
        <section className="home-section home-about">
          <div className="container home-about-inner">
            {photo && (
              // eslint-disable-next-line @next/next/no-img-element
              <img className="home-about-photo" src={photo} alt="Portrait photo" loading="lazy" />
            )}
            <div className="home-about-copy">
              <p className="kicker">About</p>
              <h2>One developer, from first sketch to launch</h2>
              <div className="home-about-text">
                <RichText text={about} />
              </div>
              <Link href="/about" className="link-arrow">
                More about me <span aria-hidden="true">&rarr;</span>
              </Link>
            </div>
          </div>
        </section>
      )}

      <section className="home-cta">
        <div className="container home-cta-inner">
          <h2>Have a project in mind?</h2>
          <p>Tell me what you are building and I will tell you how I can help.</p>
          <div className="actions">
            <Link href="/contact" className="btn btn-dark btn-lg">
              Get in touch
            </Link>
            {settings.email && (
              <a href={`mailto:${settings.email}`} className="home-cta-mail">
                {settings.email}
              </a>
            )}
          </div>
        </div>
      </section>
    </>
  );
}
