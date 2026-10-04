import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { getService } from "@/lib/api";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const service = await getService(slug);
  return service ? { title: service.title, description: service.summary } : {};
}

export default async function ServiceDetailPage({ params }: Props) {
  await connection();
  const { slug } = await params;
  const service = await getService(slug);
  if (!service) notFound();

  return (
    <section className="section">
      <div className="container prose">
        <p className="eyebrow">
          <Link href="/services">Services</Link>
        </p>
        <h1>{service.title}</h1>
        <p className="lead">{service.summary}</p>
        {service.description && <p className="pre-line">{service.description}</p>}
        <div className="actions">
          <Link href="/contact" className="btn">
            Discuss this service
          </Link>
        </div>
      </div>
    </section>
  );
}
