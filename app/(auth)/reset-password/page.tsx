"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { inputCls, primaryBtn } from "@/components/ui";
import { createClient } from "@/utils/supabase/client";

export default function ResetPasswordPage() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const pw = String(new FormData(e.currentTarget).get("password"));
    if (pw.length < 8) return setError("비밀번호는 8자 이상이어야 합니다.");
    setBusy(true);
    setError("");
    const { error: err } = await createClient().auth.updateUser({ password: pw });
    if (err) {
      setError("비밀번호를 변경하지 못했어요. 링크가 만료되었다면 다시 요청해주세요.");
      setBusy(false);
      return;
    }
    router.replace("/");
    router.refresh();
  };

  return (
    <>
      <p className="mb-6 text-center text-[14px] text-muted">새 비밀번호를 입력해주세요</p>
      <form onSubmit={onSubmit} className="flex flex-col gap-3">
        <label className="sr-only" htmlFor="password">새 비밀번호</label>
        <input id="password" name="password" type="password" autoComplete="new-password" placeholder="새 비밀번호 (8자 이상)" className={inputCls} required />
        {error && <p role="alert" className="text-[13px] text-like">{error}</p>}
        <button type="submit" disabled={busy} className={primaryBtn}>{busy ? "변경 중..." : "비밀번호 변경"}</button>
      </form>
    </>
  );
}
