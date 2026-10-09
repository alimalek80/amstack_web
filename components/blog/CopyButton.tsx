"use client";

import { useState } from "react";

const COPY = "M9 9h10v11H9zM5 15V4h10";
const CHECK = "M5 12.5l4.5 4.5L19 7.5";

export default function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      // Clipboard can be blocked (for example on plain http); the code stays selectable.
    }
  }

  return (
    <button
      type="button"
      className={copied ? "code-copy is-copied" : "code-copy"}
      onClick={copy}
      aria-label={copied ? "Copied" : "Copy code"}
      title={copied ? "Copied" : "Copy code"}
    >
      <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d={copied ? CHECK : COPY} />
      </svg>
      <span className="sr-only" aria-live="polite">
        {copied ? "Copied" : ""}
      </span>
    </button>
  );
}
