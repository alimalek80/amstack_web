import type { ReactNode } from "react";
import { bundledLanguages, codeToHtml } from "shiki";
import { mediaPath } from "@/lib/api";
import { languageLabel, normalizeLanguage } from "@/lib/codeLanguages";
import type { RichMark, RichNode } from "@/lib/types";
import CopyButton from "./CopyButton";

// Renders the post document (Tiptap JSON) to React. Only known node and mark types are
// rendered; the backend already rejects anything else. No HTML from the post is injected,
// except Shiki's output, which escapes the code itself.

const SAFE_HREF = /^(https?:\/\/|mailto:|\/(?!\/)|#)/i;

function textOf(node: RichNode): string {
  if (node.type === "text") return node.text ?? "";
  if (node.type === "hardBreak") return "\n";
  return (node.content ?? []).map(textOf).join("");
}

function slug(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .slice(0, 80);
}

async function CodeBlock({ code, language }: { code: string; language: string }) {
  const lang = normalizeLanguage(language);
  const html = await codeToHtml(code.replace(/\n+$/, ""), {
    lang: lang in bundledLanguages ? lang : "text",
    theme: "github-dark-default",
  });
  return (
    <div className="code-block">
      <div className="code-head">
        <span className="code-name">{lang !== "text" ? languageLabel(lang) : ""}</span>
        <CopyButton text={code} />
      </div>
      <div className="code-body" dangerouslySetInnerHTML={{ __html: html }} />
    </div>
  );
}

function withMark(children: ReactNode, mark: RichMark, key: string): ReactNode {
  switch (mark.type) {
    case "bold":
      return <strong key={key}>{children}</strong>;
    case "italic":
      return <em key={key}>{children}</em>;
    case "underline":
      return <u key={key}>{children}</u>;
    case "strike":
      return <s key={key}>{children}</s>;
    case "code":
      return <code key={key}>{children}</code>;
    case "highlight":
      return <mark key={key}>{children}</mark>;
    case "link": {
      const href = String(mark.attrs?.href ?? "");
      if (!SAFE_HREF.test(href)) return children;
      const external = /^https?:\/\//i.test(href);
      return (
        <a key={key} href={href} {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}>
          {children}
        </a>
      );
    }
    default:
      return children;
  }
}

type Ctx = { ids: Set<string> };

function uniqueId(text: string, ctx: Ctx): string {
  const base = slug(text) || "section";
  let id = base;
  for (let n = 2; ctx.ids.has(id); n++) id = `${base}-${n}`;
  ctx.ids.add(id);
  return id;
}

function renderChildren(node: RichNode, ctx: Ctx): ReactNode[] {
  return (node.content ?? []).map((child, i) => renderNode(child, String(i), ctx));
}

function renderNode(node: RichNode, key: string, ctx: Ctx): ReactNode {
  switch (node.type) {
    case "text":
      // Code mark innermost so it wraps the bare text, then the rest around it.
      return [...(node.marks ?? [])]
        .sort((a, b) => (a.type === "code" ? -1 : b.type === "code" ? 1 : 0))
        .reduce<ReactNode>((acc, mark, i) => withMark(acc, mark, `${key}-${i}`), node.text ?? "");
    case "paragraph":
      return node.content?.length ? <p key={key}>{renderChildren(node, ctx)}</p> : null;
    case "heading": {
      const level = Math.min(6, Math.max(1, Number(node.attrs?.level) || 2));
      const Tag = `h${level}` as "h1";
      const text = textOf(node);
      if (!text.trim()) return null;
      const id = uniqueId(text, ctx);
      return (
        <Tag key={key} id={id} className="post-heading">
          {renderChildren(node, ctx)}
          <a href={`#${id}`} className="post-anchor" aria-label={`Link to ${text}`}>
            #
          </a>
        </Tag>
      );
    }
    case "bulletList":
      return <ul key={key}>{renderChildren(node, ctx)}</ul>;
    case "orderedList":
      return (
        <ol key={key} start={Number(node.attrs?.start) || 1}>
          {renderChildren(node, ctx)}
        </ol>
      );
    case "listItem":
      return <li key={key}>{renderChildren(node, ctx)}</li>;
    case "blockquote":
      return <blockquote key={key}>{renderChildren(node, ctx)}</blockquote>;
    case "table":
      return (
        <div key={key} className="table-wrap">
          <table>
            <tbody>{renderChildren(node, ctx)}</tbody>
          </table>
        </div>
      );
    case "tableRow":
      return <tr key={key}>{renderChildren(node, ctx)}</tr>;
    case "tableHeader":
    case "tableCell": {
      const Cell = node.type === "tableHeader" ? "th" : "td";
      const span = (v: unknown) => (Number(v) > 1 ? Number(v) : undefined);
      return (
        <Cell key={key} colSpan={span(node.attrs?.colspan)} rowSpan={span(node.attrs?.rowspan)}>
          {renderChildren(node, ctx)}
        </Cell>
      );
    }
    case "horizontalRule":
      return <hr key={key} />;
    case "hardBreak":
      return <br key={key} />;
    case "codeBlock": {
      const code = textOf(node);
      return code.trim() ? <CodeBlock key={key} code={code} language={String(node.attrs?.language ?? "")} /> : null;
    }
    case "image": {
      const src = String(node.attrs?.src ?? "");
      if (!/^(\/media\/|https:\/\/)/.test(src)) return null;
      const caption = String(node.attrs?.title ?? "");
      return (
        <figure key={key} className="post-figure">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={mediaPath(src) ?? src} alt={String(node.attrs?.alt ?? "")} loading="lazy" />
          {caption && <figcaption>{caption}</figcaption>}
        </figure>
      );
    }
    default:
      return null;
  }
}

export default function RichContent({ doc }: { doc: RichNode }) {
  const ctx: Ctx = { ids: new Set() };
  return <div className="post-body rich">{renderChildren(doc, ctx)}</div>;
}
