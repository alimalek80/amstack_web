"use client";

import { type ClipboardEvent, type KeyboardEvent, useRef } from "react";
import { CODE_LANGUAGES } from "@/lib/codeLanguages";
import { looksLikeMarkdown, markdownToBlocks } from "@/lib/markdownBlocks";
import type { PostBlock } from "@/lib/types";
import ImagePicker from "./ImagePicker";

export type EditorBlock = PostBlock & { key: string };
type BlockType = PostBlock["type"];

let counter = 0;
export const withKey = (block: PostBlock): EditorBlock => ({ ...block, key: `b${Date.now()}-${counter++}` });

export function newBlock(type: BlockType, lastLanguage = "python"): EditorBlock {
  switch (type) {
    case "text":
      return withKey({ type, text: "" });
    case "heading":
      return withKey({ type, text: "", level: 2 });
    case "code":
      return withKey({ type, code: "", language: lastLanguage, filename: "" });
    case "image":
      return withKey({ type, src: "", alt: "", caption: "" });
    case "note":
      return withKey({ type, text: "", tone: "info" });
  }
}

const ADDERS: { type: BlockType; label: string }[] = [
  { type: "text", label: "Text" },
  { type: "heading", label: "Heading" },
  { type: "code", label: "Code" },
  { type: "image", label: "Image" },
  { type: "note", label: "Note" },
];

const TYPE_LABEL: Record<BlockType, string> = {
  text: "Text",
  heading: "Heading",
  code: "Code",
  image: "Image",
  note: "Note",
};

function Inserter({ onAdd, always }: { onAdd: (type: BlockType) => void; always?: boolean }) {
  return (
    <div className={always ? "dash-inserter is-always" : "dash-inserter"}>
      <span className="dash-inserter-line" aria-hidden="true" />
      <div className="dash-inserter-buttons">
        {ADDERS.map((a) => (
          <button key={a.type} type="button" onClick={() => onAdd(a.type)} className={a.type === "code" ? "is-code" : undefined}>
            + {a.label}
          </button>
        ))}
      </div>
    </div>
  );
}

// Tab indents inside code; press Esc first to move focus out with Tab.
function useCodeKeys() {
  const released = useRef(false);
  return (event: KeyboardEvent<HTMLTextAreaElement>, onChange: (value: string) => void) => {
    if (event.key === "Escape") {
      released.current = true;
      return;
    }
    if (event.key !== "Tab" || released.current) {
      released.current = false;
      return;
    }
    event.preventDefault();
    const el = event.currentTarget;
    const { selectionStart: start, selectionEnd: end, value } = el;
    const lineStart = value.lastIndexOf("\n", start - 1) + 1;
    if (event.shiftKey) {
      const removed = value.slice(lineStart, lineStart + 2).match(/^ {1,2}/)?.[0].length ?? 0;
      if (!removed) return;
      onChange(value.slice(0, lineStart) + value.slice(lineStart + removed));
      requestAnimationFrame(() => el.setSelectionRange(start - removed, end - removed));
    } else {
      onChange(value.slice(0, start) + "  " + value.slice(end));
      requestAnimationFrame(() => el.setSelectionRange(start + 2, start + 2));
    }
  };
}

function BlockFields({
  block,
  update,
  onPasteMarkdown,
}: {
  block: EditorBlock;
  update: (patch: Partial<PostBlock>) => void;
  onPasteMarkdown: (blocks: PostBlock[]) => void;
}) {
  const codeKeys = useCodeKeys();

  function pasteText(event: ClipboardEvent<HTMLTextAreaElement>) {
    const text = event.clipboardData.getData("text/plain");
    if (looksLikeMarkdown(text)) {
      event.preventDefault();
      onPasteMarkdown(markdownToBlocks(text));
    }
  }

  switch (block.type) {
    case "text":
      return (
        <textarea
          className="dash-textarea"
          value={block.text}
          onChange={(e) => update({ text: e.target.value })}
          onPaste={pasteText}
          placeholder="Write a paragraph. **bold**, `code`, [link](https://…), lines starting with - become a list."
          rows={3}
          aria-label="Text"
        />
      );
    case "heading":
      return (
        <div className="dash-heading-row">
          <select
            value={block.level}
            onChange={(e) => update({ level: Number(e.target.value) as 2 | 3 })}
            aria-label="Heading size"
          >
            <option value={2}>H2 Section</option>
            <option value={3}>H3 Sub-section</option>
          </select>
          <input
            className={block.level === 2 ? "dash-heading-input" : "dash-heading-input is-small"}
            value={block.text}
            onChange={(e) => update({ text: e.target.value })}
            placeholder="Heading"
            aria-label="Heading text"
          />
        </div>
      );
    case "code":
      return (
        <div className="dash-code">
          <div className="dash-code-head">
            <select value={block.language} onChange={(e) => update({ language: e.target.value })} aria-label="Language">
              {!CODE_LANGUAGES.some((l) => l.value === block.language) && (
                <option value={block.language}>{block.language}</option>
              )}
              {CODE_LANGUAGES.map((l) => (
                <option key={l.value} value={l.value}>
                  {l.label}
                </option>
              ))}
            </select>
            <input
              value={block.filename}
              onChange={(e) => update({ filename: e.target.value })}
              placeholder="File name (optional), e.g. views.py"
              aria-label="File name"
            />
          </div>
          <textarea
            className="dash-code-input"
            value={block.code}
            onChange={(e) => update({ code: e.target.value })}
            onKeyDown={(e) => codeKeys(e, (value) => update({ code: value }))}
            placeholder="Paste or type code…"
            spellCheck={false}
            autoCapitalize="off"
            autoCorrect="off"
            rows={6}
            aria-label="Code"
          />
        </div>
      );
    case "image":
      return block.src ? (
        <div className="dash-image">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={block.src} alt="" />
          <div className="dash-image-fields">
            <label className="dash-field">
              <span>Alt text (what the image shows)</span>
              <input value={block.alt} onChange={(e) => update({ alt: e.target.value })} />
            </label>
            <label className="dash-field">
              <span>Caption (optional)</span>
              <input value={block.caption} onChange={(e) => update({ caption: e.target.value })} />
            </label>
            <button type="button" className="dash-link-btn" onClick={() => update({ src: "" })}>
              Replace image
            </button>
          </div>
        </div>
      ) : (
        <ImagePicker label="Upload image" onUploaded={(img) => update({ src: img.url })} />
      );
    case "note":
      return (
        <div className={`dash-note dash-note-${block.tone}`}>
          <select
            value={block.tone}
            onChange={(e) => update({ tone: e.target.value as "info" | "warning" })}
            aria-label="Note type"
          >
            <option value="info">Note</option>
            <option value="warning">Warning</option>
          </select>
          <textarea
            className="dash-textarea"
            value={block.text}
            onChange={(e) => update({ text: e.target.value })}
            placeholder="A tip or a warning for the reader."
            rows={2}
            aria-label="Note text"
          />
        </div>
      );
  }
}

export default function BlockEditor({
  blocks,
  onChange,
}: {
  blocks: EditorBlock[];
  onChange: (blocks: EditorBlock[]) => void;
}) {
  const lastLanguage = [...blocks].reverse().find((b) => b.type === "code");
  const defaultLanguage = lastLanguage?.type === "code" ? lastLanguage.language : "python";

  function focusBlock(key: string) {
    requestAnimationFrame(() => {
      document.querySelector<HTMLElement>(`[data-block="${key}"] textarea, [data-block="${key}"] input, [data-block="${key}"] button`)?.focus();
    });
  }

  function insert(index: number, type: BlockType) {
    const block = newBlock(type, defaultLanguage);
    onChange([...blocks.slice(0, index), block, ...blocks.slice(index)]);
    focusBlock(block.key);
  }

  function update(index: number, patch: Partial<PostBlock>) {
    onChange(blocks.map((b, i) => (i === index ? ({ ...b, ...patch } as EditorBlock) : b)));
  }

  function move(index: number, dir: -1 | 1) {
    const target = index + dir;
    if (target < 0 || target >= blocks.length) return;
    const next = [...blocks];
    [next[index], next[target]] = [next[target], next[index]];
    onChange(next);
  }

  function remove(index: number) {
    const block = blocks[index];
    const content = block.type === "code" ? block.code : block.type === "image" ? block.src : block.text;
    const hasContent = content.trim() !== "";
    if (hasContent && !window.confirm(`Remove this ${TYPE_LABEL[block.type].toLowerCase()} block?`)) return;
    onChange(blocks.filter((_, i) => i !== index));
  }

  // Pasted Markdown: replace an empty block, otherwise insert after it.
  function pasteMarkdown(index: number, parsed: PostBlock[]) {
    const current = blocks[index];
    const keep = current.type === "text" && !current.text.trim() ? 0 : 1;
    onChange([...blocks.slice(0, index + keep), ...parsed.map(withKey), ...blocks.slice(index + 1)]);
  }

  return (
    <div className="dash-blocks">
      {blocks.length === 0 && <p className="dash-muted dash-blocks-empty">Start the post by adding a block.</p>}
      {blocks.map((block, i) => (
        <div key={block.key}>
          {i > 0 && <Inserter onAdd={(type) => insert(i, type)} />}
          <div className={`dash-block dash-block-${block.type}`} data-block={block.key}>
            <div className="dash-block-bar">
              <span className="dash-block-type">{TYPE_LABEL[block.type]}</span>
              <div className="dash-block-tools">
                <button type="button" onClick={() => move(i, -1)} disabled={i === 0} aria-label="Move block up">
                  ↑
                </button>
                <button type="button" onClick={() => move(i, 1)} disabled={i === blocks.length - 1} aria-label="Move block down">
                  ↓
                </button>
                <button type="button" onClick={() => remove(i)} aria-label="Remove block" className="dash-danger">
                  ✕
                </button>
              </div>
            </div>
            <BlockFields block={block} update={(patch) => update(i, patch)} onPasteMarkdown={(parsed) => pasteMarkdown(i, parsed)} />
          </div>
        </div>
      ))}
      <Inserter onAdd={(type) => insert(blocks.length, type)} always />
    </div>
  );
}
