import { Suspense } from "react";
import { TopBar } from "@/components/nav";
import { Feed } from "@/components/feed";
import { PostSkeleton } from "@/components/ui";
import { fetchFeed } from "@/lib/queries";
import { requireMe } from "@/lib/session";

async function FeedContent() {
  const { sb, me } = await requireMe();
  const initial = await fetchFeed(sb, me.id);
  return <Feed initial={initial} meId={me.id} />;
}

export default function HomePage() {
  return (
    <>
      <div className="md:hidden"><TopBar /></div>
      <Suspense fallback={<div className="flex flex-col gap-4 px-3 py-4"><PostSkeleton /><PostSkeleton /></div>}>
        <FeedContent />
      </Suspense>
    </>
  );
}
