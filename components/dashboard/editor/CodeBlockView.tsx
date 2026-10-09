"use client";

import { NodeViewContent, NodeViewWrapper, type ReactNodeViewProps } from "@tiptap/react";
import { CODE_LANGUAGES, normalizeLanguage } from "@/lib/codeLanguages";

// The language picked last; new code blocks from the toolbar start with it.
export const codeLanguage = { last: "python" };

// Code block inside the editor: dark like the published version, with a language picker.
export default function CodeBlockView({ node, updateAttributes }: ReactNodeViewProps) {
  const language = normalizeLanguage(String(node.attrs.language ?? "")) || "text";
  const known = CODE_LANGUAGES.some((l) => l.value === language);

  return (
    <NodeViewWrapper className="rt-code">
      <div className="rt-code-head" contentEditable={false}>
        <select
          value={language}
          onChange={(e) => {
            codeLanguage.last = e.target.value;
            updateAttributes({ language: e.target.value });
          }}
          aria-label="Code language"
        >
          {!known && <option value={language}>{language}</option>}
          {CODE_LANGUAGES.map((l) => (
            <option key={l.value} value={l.value}>
              {l.label}
            </option>
          ))}
        </select>
        <span>Tab indents · Enter 3× or ↓ to leave</span>
      </div>
      <pre spellCheck={false}>
        <NodeViewContent<"code"> as="code" />
      </pre>
    </NodeViewWrapper>
  );
}
