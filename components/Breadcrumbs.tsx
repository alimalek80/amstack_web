import Link from "next/link";

export type Crumb = { label: string; href?: string };

const SITE_URL = process.env.SITE_URL ?? "https://amstack.org";

// "Home" is added automatically. The last item is the current page (no link).
export default function Breadcrumbs({ items }: { items: Crumb[] }) {
  const all: Crumb[] = [{ label: "Home", href: "/" }, ...items];
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: all.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.label,
      ...(item.href ? { item: new URL(item.href, SITE_URL).toString() } : {}),
    })),
  };

  return (
    <nav className="container breadcrumbs" aria-label="Breadcrumb">
      <ol>
        {all.map((item, index) => {
          const isLast = index === all.length - 1;
          return (
            <li key={item.label + index}>
              {item.href && !isLast ? (
                <Link href={item.href}>{item.label}</Link>
              ) : (
                <span aria-current={isLast ? "page" : undefined}>{item.label}</span>
              )}
            </li>
          );
        })}
      </ol>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }}
      />
    </nav>
  );
}
