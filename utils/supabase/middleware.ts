import { createServerClient } from "@supabase/ssr";
import { type NextRequest, NextResponse } from "next/server";
import type { Database } from "@/lib/database.types";

// 로그인 없이 접근 가능한 경로
const PUBLIC = ["/login", "/signup", "/forgot-password", "/auth"];
// 로그인 상태에서는 의미 없는 경로 → 홈으로
const GUEST_ONLY = ["/login", "/signup", "/forgot-password"];

const match = (path: string, list: string[]) => list.some((p) => path === p || path.startsWith(p + "/"));

/** 세션 갱신 + 비로그인 리다이렉트(F-1.5) */
export const updateSession = async (request: NextRequest) => {
  let response = NextResponse.next({ request });

  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
        },
      },
    },
  );

  // getClaims: 토큰 서명을 검증하며 필요 시 세션을 갱신한다.
  const { data } = await supabase.auth.getClaims();
  const signedIn = !!data?.claims;
  const path = request.nextUrl.pathname;

  const redirect = (to: string) => {
    const url = request.nextUrl.clone();
    url.pathname = to;
    url.search = "";
    const res = NextResponse.redirect(url);
    response.cookies.getAll().forEach((c) => res.cookies.set(c));
    return res;
  };

  if (!signedIn && !match(path, PUBLIC)) return redirect("/login");
  if (signedIn && match(path, GUEST_ONLY)) return redirect("/");
  return response;
};
