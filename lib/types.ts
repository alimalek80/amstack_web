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

export type ServiceSummary = { slug: string; title: string; summary: string };
export type ServiceDetail = ServiceSummary & { description: string };

export type ProjectSummary = {
  slug: string;
  title: string;
  client_name: string;
  summary: string;
  cover_image: string | null;
  live_url: string;
  is_featured: boolean;
  tech_stack: Technology[];
};

export type ProjectDetail = ProjectSummary & {
  problem: string;
  solution: string;
  result: string;
};
