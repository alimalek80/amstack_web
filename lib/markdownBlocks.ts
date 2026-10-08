import { normalizeLanguage } from "./codeLanguages";
import type { PostBlock } from "./types";

// Turns Markdown (for example a tutorial drafted elsewhere) into post blocks:
//   ```lang [filename]  fenced code  -> code block   (also ```python title="views.py")
//   ## / ### heading                  -> heading block
//   ![alt](https://...)               -> image block (https or /media/ only)
//   > quoted lines                    -> note block
// Everything else stays as text, which already supports **bold**, `code`, [links](...) and "- " lists.
export function markdownToBlocks(markdown: string): PostBlock[] {
  const lines = markdown.replace(/\r\n?/g, "\n").split("\n");
  const blocks: PostBlock[] = [];
  let paragraph: string[] = [];

  const flush = () => {
    const text = paragraph.join("\n").replace(/^\n+|\s+$/g, "");
    if (text) blocks.push({ type: "text", text });
    paragraph = [];
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    const fence = /^\s*(`{3,}|~{3,})\s*([^\s`{]*)\s*(.*)$/.exec(line);
    if (fence) {
      flush();
      const code: string[] = [];
      for (i++; i < lines.length && !lines[i].trim().startsWith(fence[1]); i++) code.push(lines[i]);
      const filename = fence[3]
        .replace(/^title=/, "")
        .replace(/^["']|["']$/g, "")
        .replace(/\{.*\}/, "")
        .trim();
      blocks.push({ type: "code", language: normalizeLanguage(fence[2]), filename, code: code.join("\n") });
      continue;
    }

    const heading = /^(#{1,4})\s+(.+?)\s*#*$/.exec(line);
    if (heading) {
      flush();
      blocks.push({ type: "heading", level: heading[1].length <= 2 ? 2 : 3, text: heading[2] });
      continue;
    }

    const image = /^!\[([^\]]*)\]\(((?:https:\/\/|\/media\/)[^)\s]+)(?:\s+"([^"]*)")?\)$/.exec(line.trim());
    if (image) {
      flush();
      blocks.push({ type: "image", src: image[2], alt: image[1], caption: image[3] ?? "" });
      continue;
    }

    if (/^>\s?/.test(line)) {
      flush();
      const quote: string[] = [];
      for (; i < lines.length && /^>\s?/.test(lines[i]); i++) quote.push(lines[i].replace(/^>\s?/, ""));
      i--;
      // Accepts plain quotes, "**Warning:** ..." and GitHub alerts ("[!WARNING]").
      const tone = /^\s*(\*\*|\[!)?(warning|caution|important)/i.test(quote[0] ?? "") ? "warning" : "info";
      const text = quote
        .join("\n")
        .replace(/^\s*\[!\w+\]\s*/, "")
        .replace(/^\*\*(note|tip|info|warning|caution|important):?\*\*:?\s*/i, "")
        .trim();
      blocks.push({ type: "note", tone, text });
      continue;
    }

    paragraph.push(line);
  }
  flush();
  return blocks;
}

export function looksLikeMarkdown(text: string): boolean {
  return /^\s*(```|~~~)/m.test(text);
}
