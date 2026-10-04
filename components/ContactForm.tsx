"use client";

import { useState, type FormEvent } from "react";

const BUDGETS = [
  { value: "", label: "Prefer not to say" },
  { value: "under_2k", label: "Under €2,000" },
  { value: "2k_5k", label: "€2,000 – €5,000" },
  { value: "5k_10k", label: "€5,000 – €10,000" },
  { value: "over_10k", label: "Over €10,000" },
  { value: "not_sure", label: "Not sure yet" },
];

type Status = "idle" | "sending" | "sent" | "error";
type FieldErrors = Record<string, string[] | undefined>;

export default function ContactForm() {
  const [status, setStatus] = useState<Status>("idle");
  const [errorText, setErrorText] = useState("");
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const payload = Object.fromEntries(new FormData(form));
    setStatus("sending");
    setErrorText("");
    setFieldErrors({});

    try {
      const response = await fetch("/api/contact/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (response.status === 201) {
        form.reset();
        setStatus("sent");
        return;
      }
      if (response.status === 400) {
        setFieldErrors((await response.json()) as FieldErrors);
        setErrorText("Please check the highlighted fields.");
      } else if (response.status === 429) {
        setErrorText("You have sent several messages recently. Please try again later or email me directly.");
      } else {
        setErrorText("Something went wrong. Please try again or email me directly.");
      }
      setStatus("error");
    } catch {
      setErrorText("Network error. Please check your connection and try again.");
      setStatus("error");
    }
  }

  if (status === "sent") {
    return (
      <div className="notice" role="status">
        <strong>Thank you!</strong> Your message has been sent and I will get back to you soon.
      </div>
    );
  }

  return (
    <form className="form" onSubmit={onSubmit}>
      <label>
        Name
        <input name="name" required maxLength={120} autoComplete="name" />
        {fieldErrors.name && <span className="field-error">{fieldErrors.name[0]}</span>}
      </label>

      <label>
        Email
        <input name="email" type="email" required autoComplete="email" />
        {fieldErrors.email && <span className="field-error">{fieldErrors.email[0]}</span>}
      </label>

      <label>
        Budget
        <select name="budget" defaultValue="">
          {BUDGETS.map((budget) => (
            <option key={budget.value} value={budget.value}>
              {budget.label}
            </option>
          ))}
        </select>
      </label>

      <label>
        Message
        <textarea name="message" required rows={6} maxLength={5000} />
        {fieldErrors.message && <span className="field-error">{fieldErrors.message[0]}</span>}
      </label>

      {/* Honeypot: invisible to people, bots tend to fill it in. */}
      <div className="hp" aria-hidden="true">
        <label>
          Website
          <input type="text" name="website" tabIndex={-1} autoComplete="off" />
        </label>
      </div>

      {status === "error" && (
        <p className="notice error" role="alert">
          {errorText}
        </p>
      )}

      <button type="submit" className="btn" disabled={status === "sending"}>
        {status === "sending" ? "Sending..." : "Send message"}
      </button>
    </form>
  );
}
