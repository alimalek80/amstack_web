// Languages offered in the dashboard code block picker. `value` is a Shiki language id.
export const CODE_LANGUAGES = [
  { value: "text", label: "Plain text" },
  { value: "bash", label: "Bash / Shell" },
  { value: "powershell", label: "PowerShell" },
  { value: "python", label: "Python" },
  { value: "javascript", label: "JavaScript" },
  { value: "typescript", label: "TypeScript" },
  { value: "jsx", label: "JSX" },
  { value: "tsx", label: "TSX" },
  { value: "json", label: "JSON" },
  { value: "html", label: "HTML" },
  { value: "css", label: "CSS" },
  { value: "scss", label: "SCSS" },
  { value: "sql", label: "SQL" },
  { value: "yaml", label: "YAML" },
  { value: "toml", label: "TOML" },
  { value: "ini", label: "INI / .env" },
  { value: "dockerfile", label: "Dockerfile" },
  { value: "nginx", label: "Nginx" },
  { value: "jinja", label: "Django / Jinja template" },
  { value: "markdown", label: "Markdown" },
  { value: "diff", label: "Diff" },
  { value: "go", label: "Go" },
  { value: "rust", label: "Rust" },
  { value: "php", label: "PHP" },
  { value: "java", label: "Java" },
  { value: "kotlin", label: "Kotlin" },
  { value: "swift", label: "Swift" },
  { value: "c", label: "C" },
  { value: "cpp", label: "C++" },
  { value: "csharp", label: "C#" },
  { value: "ruby", label: "Ruby" },
  { value: "graphql", label: "GraphQL" },
  { value: "xml", label: "XML" },
] as const;

const LABELS: Record<string, string> = Object.fromEntries(CODE_LANGUAGES.map((l) => [l.value, l.label]));

// Common aliases people type after ``` in Markdown.
const ALIASES: Record<string, string> = {
  sh: "bash",
  shell: "bash",
  zsh: "bash",
  console: "bash",
  ps: "powershell",
  ps1: "powershell",
  py: "python",
  js: "javascript",
  ts: "typescript",
  yml: "yaml",
  env: "ini",
  docker: "dockerfile",
  django: "jinja",
  md: "markdown",
  golang: "go",
  rs: "rust",
  "c++": "cpp",
  "c#": "csharp",
  cs: "csharp",
  rb: "ruby",
  plaintext: "text",
  txt: "text",
  "": "text",
};

export function normalizeLanguage(lang: string): string {
  const key = lang.trim().toLowerCase();
  return ALIASES[key] ?? key;
}

export function languageLabel(lang: string): string {
  return LABELS[lang] ?? lang;
}
