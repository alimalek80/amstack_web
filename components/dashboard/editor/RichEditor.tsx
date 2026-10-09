"use client";

import CodeBlock from "@tiptap/extension-code-block";
import Highlight from "@tiptap/extension-highlight";
import Image from "@tiptap/extension-image";
import { Placeholder } from "@tiptap/extensions";
import { type Editor, EditorContent, ReactNodeViewRenderer, useEditor, useEditorState } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { marked } from "marked";
import { type ReactNode, useRef, useState } from "react";
import { uploadImage } from "@/lib/dashboard";
import type { RichDoc } from "@/lib/types";
import CodeBlockView, { codeLanguage } from "./CodeBlockView";

const CodeBlockWithLanguage = CodeBlock.extend({
  addNodeView() {
    return ReactNodeViewRenderer(CodeBlockView);
  },
});

// Plain text that looks like Markdown (headings, code fences, lists, bold, links...).
const MARKDOWN_HINT =
  /^#{1,6}\s|^\s*(```|~~~)|^\s*[-*+]\s+\S|^\s*\d+\.\s+\S|^>\s|\*\*[^*\n]+\*\*|\[[^\]\n]+\]\([^)\s]+\)|`[^`\n]+`/m;
// HTML on the clipboard that already carries real formatting (from a web page or document).
const RICH_HTML = /<(p|h[1-6]|li|pre|strong|b|em|i|a|blockquote|table)[\s>]/i;

function markdownToHtml(markdown: string): string {
  return marked.parse(markdown, { gfm: true, breaks: false, async: false }) as string;
}

function imageFiles(list: FileList | null | undefined): File[] {
  return Array.from(list ?? []).filter((f) => f.type.startsWith("image/"));
}

const BLOCK_OPTIONS = [
  { value: "p", label: "Paragraph" },
  { value: "1", label: "Heading 1" },
  { value: "2", label: "Heading 2" },
  { value: "3", label: "Heading 3" },
  { value: "4", label: "Heading 4" },
  { value: "5", label: "Heading 5" },
  { value: "6", label: "Heading 6" },
] as const;

function Icon({ d }: { d: string }) {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d={d} />
    </svg>
  );
}

const ICONS = {
  bulletList: "M9 6h11M9 12h11M9 18h11M4.5 6h.01M4.5 12h.01M4.5 18h.01",
  orderedList: "M10 6h10M10 12h10M10 18h10M4 4.5h1v4M4 8.5h2M4 14.5c0-.8 2-.8 2 0s-2 1.6-2 3h2",
  quote: "M7 7h4v4c0 3-1.5 5-4 6M14 7h4v4c0 3-1.5 5-4 6",
  codeBlock: "M8 8l-4 4 4 4M16 8l4 4-4 4M13.5 5l-3 14",
  link: "M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1",
  image: "M4 5h16v14H4zM4 16l5-5 4 4 2-2 5 5M15 9.5h.01",
  divider: "M4 12h16",
  undo: "M9 14L4 9l5-5M4 9h10a6 6 0 0 1 0 12h-2",
  redo: "M15 14l5-5-5-5M20 9H10a6 6 0 0 0 0 12h2",
};

function ToolButton({
  label,
  active,
  disabled,
  onClick,
  children,
}: {
  label: string;
  active?: boolean;
  disabled?: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      className={active ? "rt-tool is-active" : "rt-tool"}
      title={label}
      aria-label={label}
      aria-pressed={active}
      disabled={disabled}
      // Keep the text selection while clicking the toolbar.
      onMouseDown={(e) => e.preventDefault()}
      onClick={onClick}
    >
      {children}
    </button>
  );
}

function Toolbar({ editor, onImage, uploading }: { editor: Editor; onImage: () => void; uploading: boolean }) {
  const s = useEditorState({
    editor,
    selector: ({ editor: e }) => {
      const level = [1, 2, 3, 4, 5, 6].find((l) => e.isActive("heading", { level: l }));
      return {
        block: level ? String(level) : e.isActive("codeBlock") ? "code" : "p",
        bold: e.isActive("bold"),
        italic: e.isActive("italic"),
        underline: e.isActive("underline"),
        strike: e.isActive("strike"),
        highlight: e.isActive("highlight"),
        code: e.isActive("code"),
        link: e.isActive("link"),
        bulletList: e.isActive("bulletList"),
        orderedList: e.isActive("orderedList"),
        blockquote: e.isActive("blockquote"),
        codeBlock: e.isActive("codeBlock"),
        image: e.isActive("image"),
        canUndo: e.can().undo(),
        canRedo: e.can().redo(),
      };
    },
  });

  const chain = () => editor.chain().focus();

  function setBlock(value: string) {
    if (value === "p") chain().setParagraph().run();
    else chain().setHeading({ level: Number(value) as 1 | 2 | 3 | 4 | 5 | 6 }).run();
  }

  function editLink() {
    const current = String(editor.getAttributes("link").href ?? "");
    const href = window.prompt("Link address (leave empty to remove the link)", current || "https://");
    if (href === null) return;
    if (!href.trim() || href.trim() === "https://") chain().extendMarkRange("link").unsetLink().run();
    else chain().extendMarkRange("link").setLink({ href: href.trim() }).run();
  }

  function editImage() {
    const attrs = editor.getAttributes("image");
    const alt = window.prompt("Describe the image (alt text, for screen readers and SEO)", String(attrs.alt ?? ""));
    if (alt === null) return;
    const title = window.prompt("Caption shown under the image (optional)", String(attrs.title ?? ""));
    if (title === null) return;
    chain().updateAttributes("image", { alt, title }).run();
  }

  return (
    <div className="rt-toolbar" role="toolbar" aria-label="Formatting">
      <select
        className="rt-block-select"
        value={s.block === "code" ? "p" : s.block}
        onChange={(e) => setBlock(e.target.value)}
        aria-label="Text style"
        disabled={s.codeBlock}
      >
        {BLOCK_OPTIONS.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>

      <span className="rt-sep" />
      <ToolButton label="Bold (Ctrl+B) · **text**" active={s.bold} onClick={() => chain().toggleBold().run()}>
        <b>B</b>
      </ToolButton>
      <ToolButton label="Italic (Ctrl+I) · *text*" active={s.italic} onClick={() => chain().toggleItalic().run()}>
        <i>I</i>
      </ToolButton>
      <ToolButton label="Underline (Ctrl+U)" active={s.underline} onClick={() => chain().toggleUnderline().run()}>
        <u>U</u>
      </ToolButton>
      <ToolButton label="Strikethrough · ~~text~~" active={s.strike} onClick={() => chain().toggleStrike().run()}>
        <s>S</s>
      </ToolButton>
      <ToolButton label="Highlight (Ctrl+Shift+H) · ==text==" active={s.highlight} onClick={() => chain().toggleHighlight().run()}>
        <span className="rt-hl">H</span>
      </ToolButton>
      <ToolButton label="Inline code (Ctrl+E) · `code`" active={s.code} onClick={() => chain().toggleCode().run()}>
        <span className="rt-mono">{"</>"}</span>
      </ToolButton>
      <ToolButton label="Link" active={s.link} onClick={editLink}>
        <Icon d={ICONS.link} />
      </ToolButton>

      <span className="rt-sep" />
      <ToolButton label="Bullet list · - item" active={s.bulletList} onClick={() => chain().toggleBulletList().run()}>
        <Icon d={ICONS.bulletList} />
      </ToolButton>
      <ToolButton label="Numbered list · 1. item" active={s.orderedList} onClick={() => chain().toggleOrderedList().run()}>
        <Icon d={ICONS.orderedList} />
      </ToolButton>
      <ToolButton label="Quote · > text" active={s.blockquote} onClick={() => chain().toggleBlockquote().run()}>
        <Icon d={ICONS.quote} />
      </ToolButton>
      <ToolButton
        label="Code block (Ctrl+Alt+C) · ``` then space"
        active={s.codeBlock}
        onClick={() => chain().toggleCodeBlock({ language: codeLanguage.last }).run()}
      >
        <Icon d={ICONS.codeBlock} />
        <span className="rt-tool-text">Code</span>
      </ToolButton>
      <ToolButton label="Divider · ---" onClick={() => chain().setHorizontalRule().run()}>
        <Icon d={ICONS.divider} />
      </ToolButton>
      <ToolButton label={uploading ? "Uploading image…" : "Insert image (or paste / drop one)"} disabled={uploading} onClick={onImage}>
        <Icon d={ICONS.image} />
      </ToolButton>
      {s.image && (
        <button type="button" className="rt-tool rt-tool-wide" onMouseDown={(e) => e.preventDefault()} onClick={editImage}>
          Alt text &amp; caption
        </button>
      )}

      <span className="rt-sep rt-push" />
      <ToolButton label="Undo (Ctrl+Z)" disabled={!s.canUndo} onClick={() => chain().undo().run()}>
        <Icon d={ICONS.undo} />
      </ToolButton>
      <ToolButton label="Redo (Ctrl+Shift+Z)" disabled={!s.canRedo} onClick={() => chain().redo().run()}>
        <Icon d={ICONS.redo} />
      </ToolButton>
    </div>
  );
}

export default function RichEditor({
  initial,
  onChange,
}: {
  initial: RichDoc;
  onChange: (doc: RichDoc) => void;
}) {
  const fileInput = useRef<HTMLInputElement>(null);
  const editorRef = useRef<Editor | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");

  async function insertImages(files: File[], position?: number) {
    const editor = editorRef.current;
    if (!editor || !files.length) return;
    setUploading(true);
    setUploadError("");
    try {
      for (const file of files) {
        const image = await uploadImage(file);
        const alt = file.name.replace(/\.[^.]+$/, "").replace(/[-_]+/g, " ");
        const node = { type: "image", attrs: { src: image.url, alt } };
        if (position !== undefined) editor.chain().focus().insertContentAt(position, node).run();
        else editor.chain().focus().insertContent(node).run();
      }
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : "Image upload failed.");
    } finally {
      setUploading(false);
    }
  }

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        codeBlock: false,
        heading: { levels: [1, 2, 3, 4, 5, 6] },
        link: { openOnClick: false, autolink: true, defaultProtocol: "https" },
      }),
      CodeBlockWithLanguage.configure({ enableTabIndentation: true, tabSize: 2, defaultLanguage: "text" }),
      Highlight,
      Image,
      Placeholder.configure({
        placeholder: "Start writing… Markdown works as you type: ## heading, **bold**, ```python for code, - list, > quote.",
      }),
    ],
    // An empty doc would load with no paragraph at all (no caret target, no placeholder).
    content: initial.content?.length ? initial : "",
    onCreate: ({ editor: e }) => {
      editorRef.current = e;
    },
    onUpdate: ({ editor: e }) => onChange(e.getJSON() as RichDoc),
    editorProps: {
      attributes: { class: "rt-content post-body rich", "aria-label": "Post content" },
      handlePaste: (_view, event) => {
        const e = editorRef.current;
        const files = imageFiles(event.clipboardData?.files);
        if (files.length) {
          insertImages(files);
          return true;
        }
        if (!e || e.isActive("codeBlock")) return false;
        const text = event.clipboardData?.getData("text/plain") ?? "";
        const html = event.clipboardData?.getData("text/html") ?? "";
        if (text && MARKDOWN_HINT.test(text) && !RICH_HTML.test(html)) {
          e.chain().focus().insertContent(markdownToHtml(text)).run();
          return true;
        }
        return false;
      },
      handleDrop: (view, event, _slice, moved) => {
        const files = imageFiles(event.dataTransfer?.files);
        if (moved || !files.length) return false;
        event.preventDefault();
        const pos = view.posAtCoords({ left: event.clientX, top: event.clientY })?.pos;
        insertImages(files, pos);
        return true;
      },
    },
  });

  if (!editor) return <div className="rt-editor rt-loading">Loading editor…</div>;

  return (
    <div className="rt-editor">
      <Toolbar editor={editor} uploading={uploading} onImage={() => fileInput.current?.click()} />
      {uploadError && (
        <p className="dash-alert rt-upload-error" role="alert">
          {uploadError}
        </p>
      )}
      <EditorContent editor={editor} />
      <input
        ref={fileInput}
        type="file"
        accept="image/png,image/jpeg,image/webp,image/gif"
        hidden
        multiple
        onChange={(e) => {
          insertImages(imageFiles(e.target.files));
          e.target.value = "";
        }}
      />
    </div>
  );
}
