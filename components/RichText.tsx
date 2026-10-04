import type { ReactNode } from "react";

// Tiny, safe formatter for text written in the Django admin:
//   **bold**   [link text](https://example.com)   lines starting with "- " become a list.
// Blank line = new paragraph. No raw HTML is ever rendered.

const INLINE = /\*\*(.+?)\*\*|\[([^\]]+)\]\(([^)\s]+)\)/g;

function isSafeUrl(url: string): boolean {
  return /^(https?:\/\/|mailto:|\/(?!\/)|#)/i.test(url);
}

function renderInline(text: string, keyPrefix = "i"): ReactNode[] {
  const nodes: ReactNode[] = [];
  let last = 0;
  let n = 0;
  for (const match of text.matchAll(INLINE)) {
    const index = match.index ?? 0;
    if (index > last) nodes.push(text.slice(last, index));
    const key = `${keyPrefix}-${n++}`;
    if (match[1] !== undefined) {
      nodes.push(<strong key={key}>{renderInline(match[1], key)}</strong>);
    } else if (isSafeUrl(match[3])) {
      const external = /^https?:\/\//i.test(match[3]);
      nodes.push(
        <a
          key={key}
          href={match[3]}
          {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
        >
          {match[2]}
        </a>,
      );
    } else {
      nodes.push(match[0]);
    }
    last = index + match[0].length;
  }
  if (last < text.length) nodes.push(text.slice(last));
  return nodes;
}

type Block = { type: "p"; lines: string[] } | { type: "ul"; items: string[] };

function parseBlocks(text: string): Block[] {
  const blocks: Block[] = [];
  let current: Block | null = null;
  for (const raw of text.replace(/\r\n/g, "\n").split("\n")) {
    const line = raw.trimEnd();
    if (!line.trim()) {
      current = null;
      continue;
    }
    const bullet = /^\s*[-*]\s+(.*)$/.exec(line);
    if (bullet) {
      if (current?.type !== "ul") {
        current = { type: "ul", items: [] };
        blocks.push(current);
      }
      current.items.push(bullet[1]);
    } else {
      if (current?.type !== "p") {
        current = { type: "p", lines: [] };
        blocks.push(current);
      }
      current.lines.push(line);
    }
  }
  return blocks;
}

export default function RichText({ text }: { text: string }) {
  return (
    <>
      {parseBlocks(text).map((block, i) =>
        block.type === "ul" ? (
          <ul key={i} className="rich-list">
            {block.items.map((item, j) => (
              <li key={j}>{renderInline(item, `${i}-${j}`)}</li>
            ))}
          </ul>
        ) : (
          <p key={i} className="pre-line">
            {renderInline(block.lines.join("\n"), `${i}`)}
          </p>
        ),
      )}
    </>
  );
}
