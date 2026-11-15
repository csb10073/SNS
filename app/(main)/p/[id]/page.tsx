import { Suspense } from "react";
import { notFound } from "next/navigation";
import { TopBar } from "@/components/nav";
import { PostDetail } from "@/components/post-detail";
import { PostSkeleton } from "@/components/ui";
import { fetchComments, fetchPost } from "@/lib/queries";
import { requireMe } from "@/lib/session";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

async function Content({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!UUID.test(id)) notFound();
  const { sb, me } = await requireMe();
  const [post, comments] = await Promise.all([fetchPost(sb, me.id, id), fetchComments(sb, id)]);
  if (!post) notFound();
  return <PostDetail post={post} initialComments={comments} me={me} />;
}

export default function PostPage({ params }: PageProps<"/p/[id]">) {
  return (
    <>
      <TopBar title="게시글" back />
      <Suspense fallback={<div className="p-3"><PostSkeleton /></div>}>
        <Content params={params} />
      </Suspense>
    </>
  );
}
