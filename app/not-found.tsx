import Link from "next/link";
import SiteLayout from "./(site)/layout";

// Rendered at the root (outside the site layout), so it adds the header and footer itself.
export default function NotFound() {
  return (
    <SiteLayout>
      <section className="section">
        <div className="container">
          <h1>Page not found</h1>
          <p className="lead">The page you are looking for does not exist.</p>
          <div className="actions">
            <Link href="/" className="btn">
              Back to home
            </Link>
          </div>
        </div>
      </section>
    </SiteLayout>
  );
}
