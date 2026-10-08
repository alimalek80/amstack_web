import type { Metadata } from "next";
import Link from "next/link";
import { connection } from "next/server";
import Breadcrumbs from "@/components/Breadcrumbs";
import { getBlogCategories, getPosts, mediaPath } from "@/lib/api";
import { formatDate } from "@/lib/format";

export const metadata: Metadata = {
  title: "Blog",
  description: "Code tutorials and notes on Django, Next.js, bots and shipping web products.",
};

type Props = { searchParams: Promise<{ category?: string }> };

export default async function BlogPage({ searchParams }: Props) {
  await connection();
  const { category } = await searchParams;
  const [posts, categories] = await Promise.all([getPosts(category), getBlogCategories()]);
  const active = categories.find((c) => c.slug === category);

  return (
    <section className="section">
      <Breadcrumbs items={active ? [{ label: "Blog", href: "/blog" }, { label: active.name }] : [{ label: "Blog" }]} />
      <div className="container">
        <h1>{active ? active.name : "Blog"}</h1>
        <p className="lead">
          {active?.description || "Step-by-step code tutorials and notes from real projects."}
        </p>

        {categories.length > 0 && (
          <nav className="blog-filter" aria-label="Categories">
            <Link href="/blog" className={!active ? "is-active" : undefined} aria-current={!active ? "page" : undefined}>
              All
            </Link>
            {categories.map((c) => (
              <Link
                key={c.slug}
                href={`/blog?category=${c.slug}`}
                className={active?.slug === c.slug ? "is-active" : undefined}
                aria-current={active?.slug === c.slug ? "page" : undefined}
              >
                {c.name} <span>{c.post_count}</span>
              </Link>
            ))}
          </nav>
        )}

        {posts.length === 0 ? (
          <p className="blog-empty">No posts here yet.</p>
        ) : (
          <ul className="blog-list">
            {posts.map((post) => {
              const cover = mediaPath(post.cover_image);
              return (
                <li key={post.slug}>
                  <Link href={`/blog/${post.slug}`} className="blog-item">
                    <div className="blog-item-text">
                      <p className="blog-meta">
                        {post.category && <span className="blog-cat">{post.category.name}</span>}
                        <span>{formatDate(post.published_at)}</span>
                        <span>{post.reading_minutes} min read</span>
                      </p>
                      <h2>{post.title}</h2>
                      {post.excerpt && <p className="blog-excerpt">{post.excerpt}</p>}
                    </div>
                    {cover && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img className="blog-thumb" src={cover} alt="" loading="lazy" />
                    )}
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </section>
  );
}
