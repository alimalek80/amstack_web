export function formatDate(value: string | null): string {
  if (!value) return "";
  return new Date(value).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

export function formatViews(count: number): string {
  return `${count.toLocaleString("en-US")} ${count === 1 ? "view" : "views"}`;
}
