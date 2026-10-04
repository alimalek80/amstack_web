import Link from "next/link";
import { connection } from "next/server";
import ProjectCard from "@/components/ProjectCard";
import RichText from "@/components/RichText";
import { getProjects, getServices, getSettings, mediaPath } from "@/lib/api";

export default async function HomePage() {
  // Render per request (the API may not be reachable at build time);
  // the data itself is cached by the API client.
  await connection();
  const [settings, featured, services] = await Promise.all([
    getSettings(),
    getProjects(true),
    getServices(),
  ]);

  return (
    <>
      <section className="hero">
        <div className="container">
          <h1>{settings.hero_headline}</h1>
          {settings.hero_subheadline && <p className="lead">{settings.hero_subheadline}</p>}
          <div className="actions">
            <Link href="/contact" className="btn">
              Start a project
            </Link>
            {settings.booking_url && (
              <a href={settings.booking_url} className="btn btn-ghost" rel="noopener noreferrer">
                Book a call
              </a>
            )}
          </div>
        </div>
      </section>

      {services.length > 0 && (
        <section className="section">
          <div className="container">
            <h2>Services</h2>
            <div className="grid">
              {services.map((service) => (
                <Link key={service.slug} href={`/services/${service.slug}`} className="card">
                  <div className="card-body">
                    {mediaPath(service.icon) && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img className="card-icon" src={mediaPath(service.icon)!} alt="" loading="lazy" />
                    )}
                    <h3>{service.title}</h3>
                    <p>{service.summary}</p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {featured.length > 0 && (
        <section className="section">
          <div className="container">
            <h2>Selected work</h2>
            <div className="grid">
              {featured.slice(0, 3).map((project) => (
                <ProjectCard key={project.slug} project={project} />
              ))}
            </div>
            <p className="more">
              <Link href="/projects">All projects &rarr;</Link>
            </p>
          </div>
        </section>
      )}

      {settings.about_text && (
        <section className="section">
          <div className="container prose">
            <h2>About</h2>
            <RichText text={settings.about_text} />
            <p className="more">
              <Link href="/about">More about me &rarr;</Link>
            </p>
          </div>
        </section>
      )}

      <section className="section">
        <div className="container">
          <h2>Have a project in mind?</h2>
          <p className="lead">Tell me what you are building and I will tell you how I can help.</p>
          <div className="actions">
            <Link href="/contact" className="btn">
              Get in touch
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
