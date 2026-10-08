import { mediaPath } from "@/lib/api";
import { formatDate } from "@/lib/format";
import type { PostDetail } from "@/lib/types";
import RepoLink from "../RepoLink";
import PostBody from "./PostBody";

// The article itself; shared by the public post page and the dashboard preview.
export default function PostArticle({ post }: { post: PostDetail }) {
  const cover = mediaPath(post.cover_image);
  return (
    <article className="container post-wrap">
      <header className="post-header">
        <p className="blog-meta">
          {post.category && <span className="blog-cat">{post.category.name}</span>}
          {post.published_at && <span>{formatDate(post.published_at)}</span>}
          <span>{post.reading_minutes} min read</span>
        </p>
        <h1>{post.title}</h1>
        {post.excerpt && <p className="lead">{post.excerpt}</p>}
        {post.repo_url && (
          <div className="post-repo">
            <RepoLink url={post.repo_url} label="Code for this tutorial" />
          </div>
        )}
      </header>
      {cover && (
        // eslint-disable-next-line @next/next/no-img-element
        <img className="post-cover" src={cover} alt="" />
      )}
      <PostBody blocks={post.body} />
    </article>
  );
}
