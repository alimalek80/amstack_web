export type Technology = { name: string; slug: string };

export type SiteSettings = {
  hero_headline: string;
  hero_subheadline: string;
  about_text: string;
  about_photo: string | null;
  email: string;
  linkedin_url: string;
  github_url: string;
  booking_url: string;
};

export type ServiceSummary = { slug: string; title: string; summary: string; icon: string | null };
export type ServiceImage = { image: string; alt: string; caption: string };
export type ServiceDetail = ServiceSummary & { description: string; images: ServiceImage[] };

export type ProjectSummary = {
  slug: string;
  title: string;
  client_name: string;
  summary: string;
  cover_image: string | null;
  live_url: string;
  repo_url: string;
  is_featured: boolean;
  tech_stack: Technology[];
};

export type ProjectImage = { image: string; alt: string; caption: string };

export type ProjectDetail = ProjectSummary & {
  problem: string;
  solution: string;
  result: string;
  images: ProjectImage[];
};

// ----- Blog -----

export type BlogCategory = { name: string; slug: string; description: string; post_count: number };
export type CategoryRef = { name: string; slug: string };

// Post body: rich text document from the dashboard editor (Tiptap / ProseMirror JSON).
export type RichMark = { type: string; attrs?: Record<string, unknown> };
export type RichNode = {
  type: string;
  attrs?: Record<string, unknown>;
  content?: RichNode[];
  text?: string;
  marks?: RichMark[];
};
export type RichDoc = RichNode & { type: "doc" };

export type PostSummary = {
  title: string;
  slug: string;
  excerpt: string;
  category: CategoryRef | null;
  cover_image: string | null;
  published_at: string | null;
  reading_minutes: number;
};

export type PostDetail = PostSummary & {
  body: RichDoc;
  repo_url: string;
  updated_at: string;
};
