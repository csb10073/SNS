"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { inputCls, primaryBtn } from "@/components/ui";
import { createClient } from "@/utils/supabase/client";

const RESERVED = ["login", "signup", "new", "p", "settings", "forgot-password", "reset-password", "api", "auth", "logout"];

export default function SignupPage() {
  const router = useRouter();
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const [needsConfirm, setNeedsConfirm] = useState(false);

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const email = String(f.get("email")).trim();
    const password = String(f.get("password"));
    const username = String(f.get("username")).trim().toLowerCase();
    const name = String(f.get("name")).trim();

    const next: Record<string, string> = {};
    if (!/^\S+@\S+\.\S+$/.test(email)) next.email = "올바른 이메일 형식이 아닙니다.";
    if (password.length < 8) next.password = "비밀번호는 8자 이상이어야 합니다.";
    if (username.length < 3 || username.length > 20) next.username = "사용자명은 3~20자여야 합니다.";
    else if (!/^[a-z0-9_]+$/.test(username)) next.username = "영문 소문자, 숫자, _ 만 사용할 수 있어요.";
    else if (RESERVED.includes(username)) next.username = "사용할 수 없는 사용자명입니다.";
    if (!name) next.name = "이름을 입력해주세요.";
    setErrors(next);
    if (Object.keys(next).length) return;

    setBusy(true);
    const sb = createClient();
    const { data: free } = await sb.rpc("username_available", { p_username: username });
    if (free === false) {
      setErrors({ username: "이미 사용 중인 사용자명입니다." });
      setBusy(false);
      return;
    }

    const { data, error } = await sb.auth.signUp({
      email, password,
      options: {
        data: { username, display_name: name },
        emailRedirectTo: `${location.origin}/auth/callback`,
      },
    });
    if (error) {
      const m = error.message;
      if (/already registered|already been registered/i.test(m)) setErrors({ email: "이미 가입된 이메일입니다." });
      else if (/password/i.test(m)) setErrors({ password: "비밀번호가 너무 약해요. 더 길게 입력해주세요." });
      else if (/database error/i.test(m)) setErrors({ username: "이미 사용 중이거나 사용할 수 없는 사용자명입니다." });
      else setErrors({ email: "가입하지 못했어요. 잠시 후 다시 시도해주세요." });
      setBusy(false);
      return;
    }

    // 이메일 중복 시 Supabase는 identities가 빈 배열인 가짜 user를 돌려준다
    if (data.user && data.user.identities?.length === 0) {
      setErrors({ email: "이미 가입된 이메일입니다." });
      setBusy(false);
      return;
    }
    if (data.session) {
      router.replace("/");
      router.refresh();
    } else {
      setNeedsConfirm(true); // 이메일 인증이 켜져 있는 프로젝트
      setBusy(false);
    }
  };

  const field = (id: string, label: string, type = "text", auto?: string) => (
    <div>
      <label className="sr-only" htmlFor={id}>{label}</label>
      <input id={id} name={id} type={type} autoComplete={auto} placeholder={label} className={inputCls} aria-invalid={!!errors[id]} />
      {errors[id] && <p role="alert" className="mt-1 px-1 text-[12px] text-like">{errors[id]}</p>}
    </div>
  );

  if (needsConfirm) {
    return (
      <>
        <p role="status" className="rounded-xl bg-subtle p-4 text-center text-[14px]">인증 메일을 보냈어요. 받은편지함에서 링크를 누르면 가입이 완료돼요.</p>
        <div className="mt-6 text-center text-[14px]"><Link href="/login" className="font-semibold text-accent">로그인으로 돌아가기</Link></div>
      </>
    );
  }

  return (
    <>
      <p className="mb-6 text-center text-[14px] text-muted">3분이면 시작할 수 있어요</p>
      <form onSubmit={onSubmit} className="flex flex-col gap-3" noValidate>
        {field("email", "이메일", "email", "email")}
        {field("password", "비밀번호 (8자 이상)", "password", "new-password")}
        {field("username", "사용자명 (영문 소문자, 숫자, _)", "text", "username")}
        {field("name", "이름", "text", "name")}
        <button type="submit" disabled={busy} className={`${primaryBtn} mt-2`}>{busy ? "가입 중..." : "가입하기"}</button>
      </form>
      <div className="mt-6 border-t border-line pt-5 text-center text-[14px] text-muted">
        이미 계정이 있으신가요? <Link href="/login" className="font-semibold text-accent">로그인</Link>
      </div>
    </>
  );
}
