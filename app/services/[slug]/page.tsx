import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import Breadcrumbs from "@/components/Breadcrumbs";
import RichText from "@/components/RichText";
import type { ServiceImage } from "@/lib/types";
import { getService, mediaPath } from "@/lib/api";

type Block = { type: "text"; text: string } | { type: "image"; image: ServiceImage };

// Replaces "[image N]" markers in the description with the N-th uploaded image.
// Images that are never mentioned are appended after the text.
function buildBlocks(description: string, images: ServiceImage[]): Block[] {
  const blocks: Block[] = [];
  const used = new Set<number>();
  description.split(/\[image\s*(\d+)\]/i).forEach((part, i) => {
    if (i % 2 === 0) {
      const text = part.trim();
      if (text) blocks.push({ type: "text", text });
    } else {
      const index = Number(part) - 1;
      if (images[index] && !used.has(index)) {
        used.add(index);
        blocks.push({ type: "image", image: images[index] });
      }
    }
  });
  images.forEach((image, index) => {
    if (!used.has(index)) blocks.push({ type: "image", image });
  });
  return blocks;
}

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

  const blocks = buildBlocks(service.description, service.images);

  return (
    <section className="section">
      <Breadcrumbs items={[{ label: "Services", href: "/services" }, { label: service.title }]} />
      <div className="container prose">
        <h1>{service.title}</h1>
        <p className="lead">{service.summary}</p>
        {blocks.map((block, i) =>
          block.type === "text" ? (
            <RichText key={i} text={block.text} />
          ) : (
            <figure key={i} className="figure">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={mediaPath(block.image.image) ?? ""} alt={block.image.alt} loading="lazy" />
              {block.image.caption && <figcaption>{block.image.caption}</figcaption>}
            </figure>
          ),
        )}
        <div className="actions">
          <Link href="/contact" className="btn">
            Discuss this service
          </Link>
        </div>
      </div>
    </section>
  );
}
