import Link from "next/link";

export default function Header() {
  return (
    <header className="site-header">
      <div className="container header-inner">
        <Link href="/" className="brand">
          amstack<span className="dot">.</span>
        </Link>
        <nav className="nav" aria-label="Main">
          <Link href="/services">Services</Link>
          <Link href="/projects">Projects</Link>
          <Link href="/contact" className="btn btn-small">
            Let&apos;s talk
          </Link>
        </nav>
      </div>
    </header>
  );
}
