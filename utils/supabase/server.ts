import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { connection } from "next/server";
import type { Database } from "@/lib/database.types";

/** 서버 컴포넌트/라우트 핸들러용. cookies()를 쓰므로 반드시 <Suspense> 안에서 호출할 것. */
export const createClient = async () => {
  // supabase-js가 토큰 만료 검사에 Date.now()를 쓰므로, 요청 시점 렌더를 보장한다 (cacheComponents)
  await connection();
  const cookieStore = await cookies();
  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
          } catch {
            // 서버 컴포넌트에서 호출된 경우 무시 (proxy가 세션을 갱신한다)
          }
        },
      },
    },
  );
};
