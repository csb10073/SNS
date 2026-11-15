"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { LikeButton, PostImage, PostMenu, useLike } from "@/components/post-card";
import { Avatar, ConfirmModal, Icon, TimeAgo, inputCls } from "@/components/ui";
import { deletePost } from "@/lib/mutations";
import { fetchComments } from "@/lib/queries";
import type { Comment, Post, Profile } from "@/lib/types";
import { createClient } from "@/utils/supabase/client";

const MAX_COMMENT = 500;

export function PostDetail({ post, initialComments, me }: { post: Post; initialComments: Comment[]; me: Profile }) {
  const router = useRouter();
  const sb = createClient();
  const { liked, count, pop, toggle, like } = useLike(post.id, me.id, post.liked, post.likes);
  const [content, setContent] = useState(post.content);
  const [editingPost, setEditingPost] = useState(false);
  const [draft, setDraft] = useState(post.content);
  const [edited, setEdited] = useState(post.edited);
  const [confirmPost, setConfirmPost] = useState(false);
  const [error, setError] = useState("");

  const [comments, setComments] = useState<Comment[]>(initialComments);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [editText, setEditText] = useState("");
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const mine = post.user.id === me.id;

  // 댓글 수 실시간 반영 (F-4.6): 다른 사용자의 변경이 생기면 목록을 다시 가져온다
  useEffect(() => {
    const client = createClient();
    const ch = client
      .channel(`comments:${post.id}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "comments", filter: `post_id=eq.${post.id}` }, async () => {
        setComments(await fetchComments(client, post.id));
      })
      .subscribe();
    return () => { client.removeChannel(ch); };
  }, [post.id]);

  const savePost = async () => {
    const next = draft.trim();
    if (!next && !post.imageUrl) return setError("이미지가 없는 게시글은 본문이 필요해요.");
    const { error: e } = await sb.from("posts").update({ content: next }).eq("id", post.id);
    if (e) return setError("수정하지 못했어요. 다시 시도해주세요.");
    setError("");
    setContent(next);
    setEdited(true);
    setEditingPost(false);
  };

  const removePost = async () => {
    setConfirmPost(false);
    if (await deletePost(post.id, post.imageUrl)) { router.replace("/"); router.refresh(); }
    else setError("삭제하지 못했어요. 다시 시도해주세요.");
  };

  const addComment = async (e: React.FormEvent) => {
    e.preventDefault();
    const t = text.trim();
    if (!t || sending) return;
    setSending(true);
    const { data, error: err } = await sb.from("comments").insert({ post_id: post.id, user_id: me.id, content: t }).select("id, created_at").single();
    setSending(false);
    if (err || !data) return setError("댓글을 등록하지 못했어요.");
    setError("");
    setComments((c) => (c.some((x) => x.id === data.id) ? c : [...c, { id: data.id, user: me, content: t, createdAt: data.created_at, edited: false }]));
    setText("");
  };

  const saveComment = async (id: string) => {
    const t = editText.trim();
    if (!t) return;
    const { error: err } = await sb.from("comments").update({ content: t }).eq("id", id);
    if (err) return setError("댓글을 수정하지 못했어요.");
    setError("");
    setComments((l) => l.map((x) => (x.id === id ? { ...x, content: t, edited: true } : x)));
    setEditId(null);
  };

  const removeComment = async () => {
    const id = deleteId;
    setDeleteId(null);
    if (!id) return;
    const { error: err } = await sb.from("comments").delete().eq("id", id);
    if (err) return setError("댓글을 삭제하지 못했어요.");
    setError("");
    setComments((l) => l.filter((x) => x.id !== id));
  };

  return (
    <article>
      <div className="flex items-center justify-between px-4 py-3">
        <Link href={`/${post.user.username}`} className="flex items-center gap-3">
          <Avatar user={post.user} />
          <div className="leading-tight">
            <p className="text-[14px] font-semibold">{post.user.username}</p>
            <p className="text-[12px] text-muted"><TimeAgo iso={post.createdAt} />{edited && " · 수정됨"}</p>
          </div>
        </Link>
        {mine && <PostMenu onEdit={() => { setDraft(content); setEditingPost(true); }} onDelete={() => setConfirmPost(true)} />}
      </div>

      {post.imageUrl && <PostImage src={post.imageUrl} alt={`${post.user.displayName}의 게시글 이미지`} onDoubleLike={like} />}

      <div className="px-4 py-3">
        <div className="flex items-center gap-3">
          <LikeButton liked={liked} pop={pop} onClick={toggle} />
          <span className="p-1"><Icon name="comment" className="size-7" /></span>
        </div>
        <p className="mt-1 text-[14px] font-semibold">좋아요 {count.toLocaleString()}개</p>

        {editingPost ? (
          <div className="mt-2 flex flex-col gap-2">
            <label htmlFor="edit-post" className="sr-only">본문 수정</label>
            <textarea id="edit-post" value={draft} maxLength={2200} rows={4} onChange={(e) => setDraft(e.target.value)} className={`${inputCls} resize-none`} />
            <div className="flex justify-end gap-2 text-[14px]">
              <button onClick={() => setEditingPost(false)} className="rounded-lg px-3 py-1.5 text-muted hover:bg-subtle">취소</button>
              <button onClick={savePost} className="rounded-lg px-3 py-1.5 font-semibold text-accent hover:bg-subtle">저장</button>
            </div>
          </div>
        ) : (
          content && (
            <p className="mt-1 whitespace-pre-wrap break-words text-[14px] leading-relaxed">
              <span className="mr-1.5 font-semibold">{post.user.username}</span>{content}
            </p>
          )
        )}
        {error && <p role="alert" className="mt-2 text-[13px] text-like">{error}</p>}
      </div>

      <section aria-label="댓글" className="border-t border-line px-4 py-3">
        <h2 className="mb-3 text-[13px] font-semibold text-muted">댓글 {comments.length}개</h2>
        {comments.length === 0 && <p className="py-6 text-center text-[14px] text-muted">아직 댓글이 없어요. 첫 댓글을 남겨보세요.</p>}
        <ul className="flex flex-col gap-4">
          {comments.map((c) => {
            const mineC = c.user.id === me.id;
            const canDelete = mineC || mine; // 본인 또는 게시글 작성자
            return (
              <li key={c.id} className="fade-up flex gap-3">
                <Avatar user={c.user} size={32} />
                <div className="min-w-0 flex-1">
                  {editId === c.id ? (
                    <div className="flex flex-col gap-2">
                      <input value={editText} maxLength={MAX_COMMENT} onChange={(e) => setEditText(e.target.value)} aria-label="댓글 수정" className={inputCls} />
                      <div className="flex justify-end gap-2 text-[13px]">
                        <button onClick={() => setEditId(null)} className="px-2 py-1 text-muted">취소</button>
                        <button onClick={() => saveComment(c.id)} className="px-2 py-1 font-semibold text-accent">저장</button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <p className="break-words text-[14px] leading-relaxed">
                        <Link href={`/${c.user.username}`} className="mr-1.5 font-semibold">{c.user.username}</Link>{c.content}
                      </p>
                      <div className="mt-0.5 flex gap-3 text-[12px] text-muted">
                        <span><TimeAgo iso={c.createdAt} />{c.edited && " · 수정됨"}</span>
                        {mineC && <button onClick={() => { setEditId(c.id); setEditText(c.content); }} className="hover:text-fg">수정</button>}
                        {canDelete && <button onClick={() => setDeleteId(c.id)} className="hover:text-like">삭제</button>}
                      </div>
                    </>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      </section>

      <form onSubmit={addComment} className="glass sticky bottom-14 z-20 flex items-center gap-2 border-t border-line px-4 py-3 md:bottom-0">
        <Avatar user={me} size={32} />
        <label htmlFor="comment" className="sr-only">댓글 입력</label>
        <input
          id="comment" value={text} maxLength={MAX_COMMENT} onChange={(e) => setText(e.target.value)}
          placeholder="댓글 달기..." className="min-w-0 flex-1 bg-transparent text-[14px] outline-none placeholder:text-muted"
        />
        <button type="submit" disabled={!text.trim() || sending} className="text-[14px] font-semibold text-accent disabled:text-muted">게시</button>
      </form>

      <ConfirmModal open={confirmPost} title="게시글을 삭제할까요?" description="댓글과 좋아요도 함께 삭제됩니다." onCancel={() => setConfirmPost(false)} onConfirm={removePost} />
      <ConfirmModal open={deleteId !== null} title="댓글을 삭제할까요?" onCancel={() => setDeleteId(null)} onConfirm={removeComment} />
    </article>
  );
}
