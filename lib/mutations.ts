"use client";

import { createClient } from "@/utils/supabase/client";
import { storagePath } from "@/lib/queries";

/** 게시글 삭제 (댓글·좋아요는 FK cascade). 이미지는 best-effort로 정리. 성공 시 true */
export async function deletePost(postId: string, imageUrl: string | null) {
  const sb = createClient();
  const { error } = await sb.from("posts").delete().eq("id", postId);
  if (error) return false;
  const path = storagePath(imageUrl, "posts");
  if (path) await sb.storage.from("posts").remove([path]);
  return true;
}
