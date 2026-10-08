"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export type GalleryImage = { src: string; alt: string; caption: string };

export default function ProjectGallery({ images }: { images: GalleryImage[] }) {
  const [active, setActive] = useState<number | null>(null);
  const lastWheel = useRef(0);
  const touchX = useRef<number | null>(null);
  const count = images.length;

  const close = useCallback(() => setActive(null), []);
  const step = useCallback(
    (dir: 1 | -1) => setActive((i) => (i === null ? i : (i + dir + count) % count)),
    [count],
  );

  useEffect(() => {
    if (active === null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
      else if (e.key === "ArrowRight") step(1);
      else if (e.key === "ArrowLeft") step(-1);
    };
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [active, close, step]);

  if (count === 0) return null;
  const current = active !== null ? images[active] : null;

  return (
    <>
      <ul className="gallery-thumbs" aria-label="Project gallery">
        {images.map((img, i) => (
          <li key={i}>
            <button type="button" onClick={() => setActive(i)} aria-label={`Open image ${i + 1} of ${count}`}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={img.src} alt={img.alt} loading="lazy" />
            </button>
          </li>
        ))}
      </ul>

      {current && (
        <div
          className="lightbox"
          role="dialog"
          aria-modal="true"
          aria-label="Image preview"
          onClick={close}
          onWheel={(e) => {
            const now = Date.now();
            if (now - lastWheel.current < 350 || Math.abs(e.deltaY) + Math.abs(e.deltaX) < 10) return;
            lastWheel.current = now;
            step((Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY) > 0 ? 1 : -1);
          }}
          onTouchStart={(e) => {
            touchX.current = e.touches[0].clientX;
          }}
          onTouchEnd={(e) => {
            if (touchX.current === null) return;
            const dx = e.changedTouches[0].clientX - touchX.current;
            touchX.current = null;
            if (Math.abs(dx) > 50) step(dx < 0 ? 1 : -1);
          }}
        >
          <button type="button" className="lightbox-close" onClick={close} aria-label="Close preview">
            ×
          </button>
          {count > 1 && (
            <>
              <button
                type="button"
                className="lightbox-nav lightbox-prev"
                onClick={(e) => {
                  e.stopPropagation();
                  step(-1);
                }}
                aria-label="Previous image"
              >
                ‹
              </button>
              <button
                type="button"
                className="lightbox-nav lightbox-next"
                onClick={(e) => {
                  e.stopPropagation();
                  step(1);
                }}
                aria-label="Next image"
              >
                ›
              </button>
            </>
          )}
          <figure className="lightbox-figure" onClick={(e) => e.stopPropagation()}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={current.src} alt={current.alt} />
            <figcaption>
              {current.caption && <span>{current.caption} · </span>}
              {(active ?? 0) + 1} / {count}
            </figcaption>
          </figure>
        </div>
      )}
    </>
  );
}
