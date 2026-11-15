"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { inputCls, primaryBtn } from "@/components/ui";
import { createClient } from "@/utils/supabase/client";

function authMessage(msg: string) {
  if (/invalid login credentials/i.test(msg)) return "이메일 또는 비밀번호가 올바르지 않습니다.";
  if (/email not confirmed/i.test(msg)) return "이메일 인증이 필요해요. 받은편지함을 확인해주세요.";
  if (/rate limit|too many/i.test(msg)) return "시도가 너무 많아요. 잠시 후 다시 해주세요.";
  return "로그인하지 못했어요. 다시 시도해주세요.";
}

export default function LoginPage() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const email = String(f.get("email")).trim();
    const pw = String(f.get("password"));
    if (!/^\S+@\S+\.\S+$/.test(email)) return setError("올바른 이메일 형식이 아닙니다.");
    if (pw.length < 8) return setError("비밀번호는 8자 이상이어야 합니다.");
    setError("");
    setBusy(true);
    const { error: err } = await createClient().auth.signInWithPassword({ email, password: pw });
    if (err) {
      setError(authMessage(err.message));
      setBusy(false);
      return;
    }
    router.replace("/");
    router.refresh();
  };

  return (
    <>
      <p className="mb-6 text-center text-[14px] text-muted">친구들의 일상을 만나보세요</p>
      <form onSubmit={onSubmit} className="flex flex-col gap-3" noValidate>
        <label className="sr-only" htmlFor="email">이메일</label>
        <input id="email" name="email" type="email" autoComplete="email" placeholder="이메일" className={inputCls} required />
        <label className="sr-only" htmlFor="password">비밀번호</label>
        <input id="password" name="password" type="password" autoComplete="current-password" placeholder="비밀번호" className={inputCls} required />
        {error && <p role="alert" className="text-[13px] text-like">{error}</p>}
        <button type="submit" disabled={busy} className={`${primaryBtn} mt-2`}>{busy ? "로그인 중..." : "로그인"}</button>
        <Link href="/forgot-password" className="text-center text-[13px] text-accent hover:underline">비밀번호를 잊으셨나요?</Link>
      </form>
      <div className="mt-6 border-t border-line pt-5 text-center text-[14px] text-muted">
        계정이 없으신가요? <Link href="/signup" className="font-semibold text-accent">가입하기</Link>
      </div>
    </>
  );
}
