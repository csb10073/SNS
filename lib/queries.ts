import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/database.types";
import type { Comment, Post, Profile } from "@/lib/types";

// 서버·브라우저 클라이언트 양쪽에서 쓰는 조회 함수 (RLS가 접근을 제어한다)
type Client = SupabaseClient<Database>;

export const PAGE_SIZE = 10;

const PROFILE_COLS = "id, username, display_name, bio, avatar_url";
const POST_SELECT = `id, content, image_url, created_at, updated_at, author:profiles!posts_user_id_fkey(${PROFILE_COLS}), likes(count), comments(count)`;

type ProfileRow = { id: string; username: string; display_name: string | null; bio: string | null; avatar_url: string | null };
type PostRow = {
  id: string; content: string | null; image_url: string | null; created_at: string; updated_at: string;
  author: ProfileRow | null; likes: { count: number }[]; comments: { count: number }[];
};

export const toProfile = (r: ProfileRow): Profile => ({
  id: r.id,
  username: r.username,
  displayName: r.display_name || r.username,
  bio: r.bio ?? "",
  avatarUrl: r.avatar_url,
});

const isEdited = (c: string, u: string) => new Date(u).getTime() - new Date(c).getTime() > 1000;

const toPost = (r: PostRow, liked: Set<string>): Post | null => {
  if (!r.author) return null;
  return {
    id: r.id,
    user: toProfile(r.author),
    content: r.content ?? "",
    imageUrl: r.image_url,
    createdAt: r.created_at,
    edited: isEdited(r.created_at, r.updated_at),
    likes: r.likes[0]?.count ?? 0,
    liked: liked.has(r.id),
    commentCount: r.comments[0]?.count ?? 0,
  };
};

async function likedSet(sb: Client, meId: string, ids: string[]) {
  if (ids.length === 0) return new Set<string>();
  const { data } = await sb.from("likes").select("post_id").eq("user_id", meId).in("post_id", ids);
  return new Set((data ?? []).map((l) => l.post_id));
}

/** 피드: 최신순, created_at 기준 커서 페이지네이션 */
export async function fetchFeed(sb: Client, meId: string, cursor?: string, userId?: string): Promise<Post[]> {
  let q = sb.from("posts").select(POST_SELECT).order("created_at", { ascending: false }).limit(PAGE_SIZE);
  if (cursor) q = q.lt("created_at", cursor);
  if (userId) q = q.eq("user_id", userId);
  const { data, error } = await q.overrideTypes<PostRow[], { merge: false }>();
  if (error || !data) return [];
  const liked = await likedSet(sb, meId, data.map((p) => p.id));
  return data.map((r) => toPost(r, liked)).filter((p): p is Post => p !== null);
}

export async function fetchPost(sb: Client, meId: string, id: string): Promise<Post | null> {
  const { data } = await sb.from("posts").select(POST_SELECT).eq("id", id).maybeSingle<PostRow>();
  if (!data) return null;
  return toPost(data, await likedSet(sb, meId, [id]));
}

export async function fetchComments(sb: Client, postId: string): Promise<Comment[]> {
  const { data } = await sb
    .from("comments")
    .select(`id, content, created_at, updated_at, author:profiles!comments_user_id_fkey(${PROFILE_COLS})`)
    .eq("post_id", postId)
    .order("created_at", { ascending: true })
    .overrideTypes<{ id: string; content: string; created_at: string; updated_at: string; author: ProfileRow | null }[], { merge: false }>();
  return (data ?? []).flatMap((r) =>
    r.author
      ? [{ id: r.id, user: toProfile(r.author), content: r.content, createdAt: r.created_at, edited: isEdited(r.created_at, r.updated_at) }]
      : [],
  );
}

export async function fetchProfileById(sb: Client, id: string): Promise<Profile | null> {
  const { data } = await sb.from("profiles").select(PROFILE_COLS).eq("id", id).maybeSingle();
  return data ? toProfile(data) : null;
}

export async function fetchProfileByUsername(sb: Client, username: string): Promise<Profile | null> {
  const { data } = await sb.from("profiles").select(PROFILE_COLS).eq("username", username.toLowerCase()).maybeSingle();
  return data ? toProfile(data) : null;
}

export async function fetchProfilePosts(sb: Client, userId: string) {
  const [{ data }, { count }] = await Promise.all([
    sb.from("posts").select("id, content, image_url").eq("user_id", userId).order("created_at", { ascending: false }).limit(60),
    sb.from("posts").select("id", { count: "exact", head: true }).eq("user_id", userId),
  ]);
  return { items: data ?? [], total: count ?? 0 };
}

/** 공개 URL → 스토리지 객체 경로 (삭제용) */
export const storagePath = (url: string | null, bucket: string) => {
  if (!url) return null;
  const marker = `/${bucket}/`;
  const i = url.indexOf(marker);
  return i === -1 ? null : decodeURIComponent(url.slice(i + marker.length).split("?")[0]);
};
