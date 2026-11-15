"use client";

import Link from "next/link";
import { useState } from "react";
import { inputCls, primaryBtn } from "@/components/ui";
import { createClient } from "@/utils/supabase/client";

export default function ForgotPasswordPage() {
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const email = String(new FormData(e.currentTarget).get("email")).trim();
    setBusy(true);
    setError("");
    const { error: err } = await createClient().auth.resetPasswordForEmail(email, {
      redirectTo: `${location.origin}/auth/callback?next=/reset-password`,
    });
    setBusy(false);
    // 계정 존재 여부를 노출하지 않기 위해 rate limit 외에는 성공처럼 안내한다
    if (err && /rate limit|too many/i.test(err.message)) return setError("요청이 너무 많아요. 잠시 후 다시 시도해주세요.");
    setSent(true);
  };

  return (
    <>
      <p className="mb-6 text-center text-[14px] text-muted">가입한 이메일로 재설정 링크를 보내드려요</p>
      {sent ? (
        <p role="status" className="rounded-xl bg-subtle p-4 text-center text-[14px]">메일을 보냈어요. 받은편지함을 확인해주세요.</p>
      ) : (
        <form onSubmit={onSubmit} className="flex flex-col gap-3">
          <label className="sr-only" htmlFor="email">이메일</label>
          <input id="email" name="email" type="email" required placeholder="이메일" className={inputCls} />
          {error && <p role="alert" className="text-[13px] text-like">{error}</p>}
          <button type="submit" disabled={busy} className={primaryBtn}>{busy ? "보내는 중..." : "재설정 링크 보내기"}</button>
        </form>
      )}
      <div className="mt-6 text-center text-[14px]"><Link href="/login" className="font-semibold text-accent">로그인으로 돌아가기</Link></div>
    </>
  );
}
