"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { PostCard } from "@/components/post-card";
import { EmptyState, PostSkeleton, primaryBtn } from "@/components/ui";
import { PAGE_SIZE, fetchFeed } from "@/lib/queries";
import type { Post } from "@/lib/types";
import { createClient } from "@/utils/supabase/client";

/** 무한 스크롤 피드 — 첫 페이지는 서버에서, 이후는 IntersectionObserver로 커서 기반 로드 */
export function Feed({ initial, meId }: { initial: Post[]; meId: string }) {
  const [posts, setPosts] = useState(initial);
  const [hasMore, setHasMore] = useState(initial.length === PAGE_SIZE);
  const loading = useRef(false);
  const sentinel = useRef<HTMLDivElement>(null);
  const last = posts[posts.length - 1]?.createdAt;

  useEffect(() => {
    if (!hasMore || !sentinel.current) return;
    const io = new IntersectionObserver(async ([e]) => {
      if (!e.isIntersecting || loading.current) return;
      loading.current = true;
      const next = await fetchFeed(createClient(), meId, last);
      setPosts((p) => [...p, ...next.filter((n) => !p.some((x) => x.id === n.id))]);
      setHasMore(next.length === PAGE_SIZE);
      loading.current = false;
    }, { rootMargin: "200px" });
    io.observe(sentinel.current);
    return () => io.disconnect();
  }, [hasMore, last, meId]);

  if (posts.length === 0) {
    return (
      <EmptyState
        icon="image" title="아직 게시글이 없어요" description="첫 번째 게시글을 공유해보세요."
        action={<Link href="/new" className={primaryBtn}>게시글 작성</Link>}
      />
    );
  }

  return (
    <div className="flex flex-col gap-4 px-3 py-4">
      {posts.map((p) => <PostCard key={p.id} post={p} meId={meId} />)}
      {hasMore ? (
        <div ref={sentinel} className="flex flex-col gap-4"><PostSkeleton /></div>
      ) : (
        <p className="py-6 text-center text-[13px] text-muted">모든 게시글을 확인했어요 ✨</p>
      )}
    </div>
  );
}
