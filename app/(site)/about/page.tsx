import type { Metadata } from "next";
import Link from "next/link";
import { connection } from "next/server";
import Breadcrumbs from "@/components/Breadcrumbs";
import RichText from "@/components/RichText";
import { getSettings, mediaPath } from "@/lib/api";

export const metadata: Metadata = {
  title: "About",
  description: "Who is behind amstack and how I work.",
};

export default async function AboutPage() {
  await connection();
  const settings = await getSettings();
  const photo = mediaPath(settings.about_photo);

  return (
    <section className="section">
      <Breadcrumbs items={[{ label: "About" }]} />
      <div className={photo ? "container about-layout" : "container prose"}>
        {photo && (
          // eslint-disable-next-line @next/next/no-img-element
          <img className="about-photo" src={photo} alt="Portrait photo" />
        )}
        <div className="prose">
          <h1>About</h1>
          {settings.about_text ? (
            <RichText text={settings.about_text} />
          ) : (
            <p className="lead">More about me will appear here soon.</p>
          )}
          <div className="actions">
            <Link href="/services" className="btn btn-ghost">
              See services
            </Link>
            <Link href="/contact" className="btn">
              Get in touch
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
