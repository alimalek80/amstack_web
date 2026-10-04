import Link from "next/link";

export default function NotFound() {
  return (
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
  );
}
