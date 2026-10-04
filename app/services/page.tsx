import type { Metadata } from "next";
import Link from "next/link";
import { connection } from "next/server";
import Breadcrumbs from "@/components/Breadcrumbs";
import { getServices, mediaPath } from "@/lib/api";

export const metadata: Metadata = {
  title: "Services",
  description: "Websites, online stores, custom features, chatbots, Telegram bots and SaaS development.",
};

export default async function ServicesPage() {
  await connection();
  const services = await getServices();

  return (
    <section className="section">
      <Breadcrumbs items={[{ label: "Services" }]} />
      <div className="container">
        <h1>Services</h1>
        {services.length === 0 ? (
          <p className="lead">Services will appear here soon.</p>
        ) : (
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
        )}
      </div>
    </section>
  );
}
