import type { Metadata } from "next";
import { connection } from "next/server";
import ContactForm from "@/components/ContactForm";
import { getSettings } from "@/lib/api";

export const metadata: Metadata = {
  title: "Contact",
  description: "Tell me about your project.",
};

export default async function ContactPage() {
  await connection();
  const settings = await getSettings();

  return (
    <section className="section">
      <div className="container contact-layout">
        <div>
          <h1>Contact</h1>
          <p className="lead">Tell me about your project and I will reply as soon as I can.</p>
          <ContactForm />
        </div>
        <aside className="contact-aside">
          {settings.booking_url && (
            <p>
              Prefer a call?
              <br />
              <a href={settings.booking_url} rel="noopener noreferrer">
                Book a time
              </a>
            </p>
          )}
          {settings.email && (
            <p>
              Email
              <br />
              <a href={`mailto:${settings.email}`}>{settings.email}</a>
            </p>
          )}
        </aside>
      </div>
    </section>
  );
}
