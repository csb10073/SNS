"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { Avatar, ConfirmModal, Icon, TimeAgo } from "@/components/ui";
import { deletePost } from "@/lib/mutations";
import type { Post } from "@/lib/types";
import { createClient } from "@/utils/supabase/client";

/** 좋아요 토글 — 낙관적 업데이트, 서버 실패 시 롤백 (F-5.3) */
export function useLike(postId: string, meId: string, initialLiked: boolean, initialCount: number) {
  const [liked, setLiked] = useState(initialLiked);
  const [count, setCount] = useState(initialCount);
  const [pop, setPop] = useState(false);
  const busy = useRef(false);

  const set = async (next: boolean) => {
    if (next === liked || busy.current) return;
    busy.current = true;
    const apply = (v: boolean) => { setLiked(v); setCount((c) => c + (v ? 1 : -1)); };
    apply(next);
    if (next) { setPop(true); setTimeout(() => setPop(false), 340); }

    const sb = createClient();
    const { error } = next
      ? await sb.from("likes").insert({ post_id: postId, user_id: meId })
      : await sb.from("likes").delete().eq("post_id", postId).eq("user_id", meId);
    // 이미 좋아요된 상태(23505)는 성공으로 취급
    if (error && error.code !== "23505") apply(!next);
    busy.current = false;
  };
  return { liked, count, pop, toggle: () => set(!liked), like: () => set(true) };
}

export function PostImage({ src, alt, onDoubleLike }: { src: string; alt: string; onDoubleLike?: () => void }) {
  const [burst, setBurst] = useState(false);
  const last = useRef(0);

  const handle = () => {
    const now = Date.now();
    if (now - last.current < 300) {
      onDoubleLike?.();
      setBurst(true);
      setTimeout(() => setBurst(false), 700);
    }
    last.current = now;
  };

  return (
    <div onClick={handle} className="relative aspect-square w-full select-none overflow-hidden bg-subtle">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={src} alt={alt} loading="lazy" draggable={false} className="size-full object-cover" />
      {burst && (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center text-white heart-burst">
          <Icon name="heart" filled className="size-24 drop-shadow-lg" />
        </div>
      )}
    </div>
  );
}

export function LikeButton({ liked, pop, onClick }: { liked: boolean; pop: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick} aria-pressed={liked} aria-label={liked ? "좋아요 취소" : "좋아요"}
      className={`p-1 transition-colors ${liked ? "text-like" : "text-fg hover:text-muted"} ${pop ? "heart-pop" : ""}`}
    >
      <Icon name="heart" filled={liked} className="size-7" />
    </button>
  );
}

export function PostMenu({ onEdit, onDelete }: { onEdit?: () => void; onDelete: () => void }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="relative">
      <button onClick={() => setOpen((o) => !o)} aria-label="게시글 메뉴" aria-expanded={open} className="rounded-full p-2 transition-colors hover:bg-subtle">
        <Icon name="more" className="size-5" />
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div role="menu" className="glass fade-up absolute right-0 z-20 mt-1 w-32 overflow-hidden rounded-xl border border-line text-[15px] shadow-lg">
            {onEdit && (
              <button role="menuitem" onClick={() => { setOpen(false); onEdit(); }} className="block w-full px-4 py-3 text-left hover:bg-subtle">수정</button>
            )}
            <button role="menuitem" onClick={() => { setOpen(false); onDelete(); }} className="block w-full px-4 py-3 text-left text-like hover:bg-subtle">삭제</button>
          </div>
        </>
      )}
    </div>
  );
}

export function PostCard({ post, meId }: { post: Post; meId: string }) {
  const { liked, count, pop, toggle, like } = useLike(post.id, meId, post.liked, post.likes);
  const [deleted, setDeleted] = useState(false);
  const [confirm, setConfirm] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();
  const mine = post.user.id === meId;

  if (deleted) return null;

  const remove = async () => {
    setConfirm(false);
    if (await deletePost(post.id, post.imageUrl)) setDeleted(true);
    else setError("삭제하지 못했어요. 다시 시도해주세요.");
  };

  return (
    <article className="fade-up overflow-hidden rounded-[20px] border border-line bg-bg shadow-card">
      <div className="flex items-center justify-between px-4 py-3">
        <Link href={`/${post.user.username}`} className="flex items-center gap-3">
          <Avatar user={post.user} />
          <div className="leading-tight">
            <p className="text-[14px] font-semibold">{post.user.username}</p>
            <p className="text-[12px] text-muted"><TimeAgo iso={post.createdAt} />{post.edited && " · 수정됨"}</p>
          </div>
        </Link>
        {mine && <PostMenu onEdit={() => router.push(`/p/${post.id}`)} onDelete={() => setConfirm(true)} />}
      </div>

      {post.imageUrl && <PostImage src={post.imageUrl} alt={`${post.user.displayName}의 게시글 이미지`} onDoubleLike={like} />}

      <div className="px-4 pb-4 pt-3">
        <div className="flex items-center gap-3">
          <LikeButton liked={liked} pop={pop} onClick={toggle} />
          <Link href={`/p/${post.id}`} aria-label="댓글 보기" className="p-1 hover:text-muted"><Icon name="comment" className="size-7" /></Link>
        </div>
        <p className="mt-1 text-[14px] font-semibold">좋아요 {count.toLocaleString()}개</p>
        {post.content && (
          <p className="mt-1 whitespace-pre-wrap break-words text-[14px] leading-relaxed">
            <Link href={`/${post.user.username}`} className="mr-1.5 font-semibold">{post.user.username}</Link>
            {post.content}
          </p>
        )}
        <Link href={`/p/${post.id}`} className="mt-2 block text-[13px] text-muted hover:underline">
          {post.commentCount > 0 ? `댓글 ${post.commentCount}개 모두 보기` : "첫 댓글을 남겨보세요"}
        </Link>
        {error && <p role="alert" className="mt-2 text-[13px] text-like">{error}</p>}
      </div>

      <ConfirmModal
        open={confirm} title="게시글을 삭제할까요?" description="댓글과 좋아요도 함께 삭제됩니다."
        onCancel={() => setConfirm(false)} onConfirm={remove}
      />
    </article>
  );
}
