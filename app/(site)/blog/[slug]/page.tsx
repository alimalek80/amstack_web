import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import PostArticle from "@/components/blog/PostArticle";
import Breadcrumbs from "@/components/Breadcrumbs";
import { getPost, mediaPath } from "@/lib/api";

const SITE_URL = process.env.SITE_URL ?? "https://amstack.org";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPost(slug);
  if (!post) return {};
  const cover = mediaPath(post.cover_image);
  return {
    title: post.title,
    description: post.excerpt,
    openGraph: {
      type: "article",
      title: post.title,
      description: post.excerpt,
      publishedTime: post.published_at ?? undefined,
      images: cover ? [cover] : undefined,
    },
  };
}

export default async function BlogPostPage({ params }: Props) {
  await connection();
  const { slug } = await params;
  const post = await getPost(slug);
  if (!post) notFound();

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: post.title,
    description: post.excerpt,
    datePublished: post.published_at,
    dateModified: post.updated_at,
    mainEntityOfPage: `${SITE_URL}/blog/${post.slug}`,
    ...(post.cover_image ? { image: new URL(mediaPath(post.cover_image)!, SITE_URL).toString() } : {}),
  };

  return (
    <section className="section">
      <Breadcrumbs
        items={[
          { label: "Blog", href: "/blog" },
          ...(post.category ? [{ label: post.category.name, href: `/blog?category=${post.category.slug}` }] : []),
          { label: post.title },
        ]}
      />
      <PostArticle post={post} />
      <div className="container post-wrap">
        <div className="post-end">
          <p>Need help building something like this?</p>
          <div className="actions">
            <Link href="/contact" className="btn">
              Get in touch
            </Link>
            <Link href="/blog" className="btn btn-ghost">
              More tutorials
            </Link>
          </div>
        </div>
      </div>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }}
      />
    </section>
  );
}
