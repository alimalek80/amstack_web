"use client";

import { useEffect, useRef, useState } from "react";
import { recordPostView } from "@/lib/views";
import { formatViews } from "@/lib/format";
import EyeIcon from "@/components/blog/EyeIcon";

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
          <EyeIcon size={16} />
          <span>{formatViews(count)}</span>
        </>
      )}
    </p>
  );
}
