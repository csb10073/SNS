import { redirect } from "next/navigation";
import { fetchProfileById } from "@/lib/queries";
import { createClient } from "@/utils/supabase/server";

/** 현재 로그인한 사용자의 클라이언트+프로필. 비로그인/프로필 없음이면 /login으로 보낸다. <Suspense> 안에서 호출. */
export async function requireMe() {
  const sb = await createClient();
  const { data } = await sb.auth.getClaims();
  const id = data?.claims?.sub;
  if (!id) redirect("/login");
  const me = await fetchProfileById(sb, id);
  if (!me) redirect("/login");
  return { sb, me };
}
