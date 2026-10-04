import type { Metadata } from "next";
import Link from "next/link";
import { connection } from "next/server";
import { getServices } from "@/lib/api";

export const metadata: Metadata = {
  title: "Services",
  description: "Websites, online stores, custom features, chatbots, Telegram bots and SaaS development.",
};

export default async function ServicesPage() {
  await connection();
  const services = await getServices();

  return (
    <section className="section">
      <div className="container">
        <h1>Services</h1>
        {services.length === 0 ? (
          <p className="lead">Services will appear here soon.</p>
        ) : (
          <div className="grid">
            {services.map((service) => (
              <Link key={service.slug} href={`/services/${service.slug}`} className="card">
                <div className="card-body">
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
