import type { SiteSettings } from "@/lib/types";

export default function Footer({ settings }: { settings: SiteSettings }) {
  return (
    <footer className="site-footer">
      <div className="container footer-inner">
        <span>&copy; {new Date().getFullYear()} amstack</span>
        <div className="footer-links">
          {settings.email && <a href={`mailto:${settings.email}`}>{settings.email}</a>}
          {settings.linkedin_url && (
            <a href={settings.linkedin_url} rel="noopener noreferrer">
              LinkedIn
            </a>
          )}
          {settings.github_url && (
            <a href={settings.github_url} rel="noopener noreferrer">
              GitHub
            </a>
          )}
        </div>
      </div>
    </footer>
  );
}
