"use client";

import { useEffect, useRef, useState } from "react";
import { recordPostView } from "@/lib/api";
import { formatViews } from "@/lib/format";

// Records one view per page visit and shows the total. Public post page only.
export default function ViewCount({ slug }: { slug: string }) {
  const [count, setCount] = useState<number | null>(null);
  const sentFor = useRef<string | null>(null);

  useEffect(() => {
    // Strict Mode runs effects twice in dev; the ref survives that, so only one POST is sent.
    // No abort in cleanup on purpose: it would cancel the only request.
    if (sentFor.current === slug) return;
    sentFor.current = slug;
    recordPostView(slug).then((value) => {
      if (value !== null) setCount(value);
    });
  }, [slug]);

  return (
    <p className="post-views">
      {count !== null && (
        <>
          <svg
            viewBox="0 0 24 24"
            width="16"
            height="16"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
            focusable="false"
          >
            <path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12z" />
            <circle cx="12" cy="12" r="3" />
          </svg>
          <span>{formatViews(count)}</span>
        </>
      )}
    </p>
  );
}
