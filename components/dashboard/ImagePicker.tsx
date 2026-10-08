"use client";

import { type ClipboardEvent, type DragEvent, useRef, useState } from "react";
import { type DashImage, uploadImage } from "@/lib/dashboard";

const ACCEPT = "image/png,image/jpeg,image/webp,image/gif";

// Upload area: click to choose, drop a file, or paste a screenshot.
export default function ImagePicker({
  label,
  onUploaded,
}: {
  label: string;
  onUploaded: (image: DashImage) => void;
}) {
  const input = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [over, setOver] = useState(false);

  async function upload(file: File | undefined | null) {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setError("Choose an image file (PNG, JPG, WebP or GIF).");
      return;
    }
    setBusy(true);
    setError("");
    try {
      onUploaded(await uploadImage(file));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed.");
    } finally {
      setBusy(false);
      if (input.current) input.current.value = "";
    }
  }

  function onDrop(event: DragEvent) {
    event.preventDefault();
    setOver(false);
    upload(event.dataTransfer.files[0]);
  }

  function onPaste(event: ClipboardEvent) {
    const file = Array.from(event.clipboardData.files).find((f) => f.type.startsWith("image/"));
    if (file) {
      event.preventDefault();
      upload(file);
    }
  }

  return (
    <div
      className={over ? "dash-drop is-over" : "dash-drop"}
      onDragOver={(e) => {
        e.preventDefault();
        setOver(true);
      }}
      onDragLeave={() => setOver(false)}
      onDrop={onDrop}
      onPaste={onPaste}
      tabIndex={0}
    >
      <button type="button" className="dash-btn" onClick={() => input.current?.click()} disabled={busy}>
        {busy ? "Uploading…" : label}
      </button>
      <span className="dash-muted">or drop / paste an image here</span>
      <input
        ref={input}
        type="file"
        accept={ACCEPT}
        hidden
        onChange={(e) => upload(e.target.files?.[0])}
      />
      {error && (
        <small className="dash-error" role="alert">
          {error}
        </small>
      )}
    </div>
  );
}
