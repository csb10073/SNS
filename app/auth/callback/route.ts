import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/utils/supabase/server";

/** 이메일 인증/비밀번호 재설정 링크의 ?code= 를 세션으로 교환 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl;
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/";
  // 오픈 리다이렉트 방지: 사이트 내부 경로만 허용
  const safeNext = next.startsWith("/") && !next.startsWith("//") ? next : "/";

  if (code) {
    const sb = await createClient();
    const { error } = await sb.auth.exchangeCodeForSession(code);
    if (!error) return NextResponse.redirect(`${origin}${safeNext}`);
  }
  return NextResponse.redirect(`${origin}/login`);
}
