import { bundledLanguages, codeToHtml } from "shiki";
import RichText from "@/components/RichText";
import { mediaPath } from "@/lib/api";
import { languageLabel, normalizeLanguage } from "@/lib/codeLanguages";
import type { CodeBlock as CodeBlockData, PostBlock } from "@/lib/types";
import CopyButton from "./CopyButton";

export function headingId(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .slice(0, 80);
}

async function CodeBlock({ block }: { block: CodeBlockData }) {
  const lang = normalizeLanguage(block.language);
  // Shiki escapes the code itself, so the generated HTML is safe to inject.
  const html = await codeToHtml(block.code.replace(/\n+$/, ""), {
    lang: lang in bundledLanguages ? lang : "text",
    theme: "github-dark-default",
  });
  const label = block.filename || (lang !== "text" ? languageLabel(lang) : "");

  return (
    <div className="code-block">
      <div className="code-head">
        <span className="code-name">{label}</span>
        <CopyButton text={block.code} />
      </div>
      <div className="code-body" dangerouslySetInnerHTML={{ __html: html }} />
    </div>
  );
}

export default function PostBody({ blocks }: { blocks: PostBlock[] }) {
  return (
    <div className="post-body">
      {blocks.map((block, i) => {
        switch (block.type) {
          case "text":
            return block.text.trim() ? <RichText key={i} text={block.text} /> : null;
          case "heading": {
            const Tag = block.level === 3 ? "h3" : "h2";
            const id = headingId(block.text);
            return (
              <Tag key={i} id={id || undefined} className="post-heading">
                {block.text}
                {id && (
                  <a href={`#${id}`} className="post-anchor" aria-label={`Link to ${block.text}`}>
                    #
                  </a>
                )}
              </Tag>
            );
          }
          case "code":
            return block.code.trim() ? <CodeBlock key={i} block={block} /> : null;
          case "image":
            return block.src ? (
              <figure key={i} className="post-figure">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={mediaPath(block.src) ?? block.src} alt={block.alt} loading="lazy" />
                {block.caption && <figcaption>{block.caption}</figcaption>}
              </figure>
            ) : null;
          case "note":
            return block.text.trim() ? (
              <aside key={i} className={`post-note post-note-${block.tone}`}>
                <strong>{block.tone === "warning" ? "Watch out" : "Note"}</strong>
                <RichText text={block.text} />
              </aside>
            ) : null;
          default:
            return null;
        }
      })}
    </div>
  );
}
