import { notFound } from "next/navigation";
import PostEditor from "@/components/dashboard/PostEditor";

export default async function EditPostPage({ params }: { params: Promise<{ id: string }> }) {
  const id = Number((await params).id);
  if (!Number.isInteger(id) || id <= 0) notFound();
  return <PostEditor key={id} postId={id} />;
}
