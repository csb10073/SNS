"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Avatar, Icon, inputCls, primaryBtn } from "@/components/ui";
import { ALLOWED_TYPES, MAX_IMAGE_SIZE, compressImage } from "@/lib/image";
import { storagePath } from "@/lib/queries";
import type { Profile } from "@/lib/types";
import { createClient } from "@/utils/supabase/client";

const MAX_BIO = 150;

export function ProfileForm({ me }: { me: Profile }) {
  const router = useRouter();
  const [name, setName] = useState(me.displayName);
  const [bio, setBio] = useState(me.bio);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const onFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    if (!ALLOWED_TYPES.includes(f.type)) return setError("jpg, png, webp 형식만 업로드할 수 있어요.");
    if (f.size > MAX_IMAGE_SIZE) return setError("이미지는 5MB 이하만 가능해요.");
    setError("");
    setFile(f);
    setPreview(URL.createObjectURL(f));
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return setError("이름을 입력해주세요.");
    setBusy(true);
    setError("");
    const sb = createClient();

    let avatarUrl = me.avatarUrl;
    let newPath: string | null = null;
    try {
      if (file) {
        const { blob, ext } = await compressImage(file, 512);
        newPath = `${me.id}/${crypto.randomUUID()}.${ext}`;
        const { error: upErr } = await sb.storage.from("avatars").upload(newPath, blob, { contentType: blob.type });
        if (upErr) throw upErr;
        avatarUrl = sb.storage.from("avatars").getPublicUrl(newPath).data.publicUrl;
      }
      const { error: updErr } = await sb
        .from("profiles")
        .update({ display_name: name.trim(), bio: bio.trim() || null, avatar_url: avatarUrl })
        .eq("id", me.id);
      if (updErr) throw updErr;
    } catch {
      if (newPath) await sb.storage.from("avatars").remove([newPath]);
      setError("저장하지 못했어요. 다시 시도해주세요.");
      setBusy(false);
      return;
    }
    // 이전 아바타 정리 (best-effort)
    const old = newPath ? storagePath(me.avatarUrl, "avatars") : null;
    if (old) await sb.storage.from("avatars").remove([old]);
    router.push(`/${me.username}`);
    router.refresh();
  };

  return (
    <>
      <header className="glass sticky top-0 z-30 flex h-12 items-center justify-between border-b border-line px-4">
        <Link href={`/${me.username}`} aria-label="뒤로" className="-ml-2 p-2"><Icon name="back" /></Link>
        <h1 className="text-[17px] font-semibold">프로필 편집</h1>
        <span className="w-8" />
      </header>

      <form onSubmit={onSubmit} className="flex flex-col gap-5 p-5">
        <div className="flex flex-col items-center gap-2">
          {preview ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={preview} alt="새 아바타 미리보기" className="size-24 rounded-full object-cover" />
          ) : (
            <Avatar user={{ ...me, displayName: name || me.displayName }} size={96} />
          )}
          <label className="cursor-pointer text-[14px] font-semibold text-accent focus-within:underline">
            사진 변경
            <input type="file" accept="image/jpeg,image/png,image/webp" className="sr-only" onChange={onFile} />
          </label>
        </div>

        <div>
          <label htmlFor="username" className="mb-1 block text-[13px] text-muted">사용자명</label>
          <input id="username" value={me.username} disabled className={`${inputCls} opacity-60`} />
        </div>
        <div>
          <label htmlFor="name" className="mb-1 block text-[13px] text-muted">이름</label>
          <input id="name" value={name} maxLength={50} onChange={(e) => setName(e.target.value)} className={inputCls} />
        </div>
        <div>
          <label htmlFor="bio" className="mb-1 block text-[13px] text-muted">소개</label>
          <textarea id="bio" value={bio} maxLength={MAX_BIO} rows={3} onChange={(e) => setBio(e.target.value)} className={`${inputCls} resize-none`} />
          <p className="mt-1 text-right text-[12px] text-muted">{bio.length} / {MAX_BIO}</p>
        </div>

        {error && <p role="alert" className="text-[13px] text-like">{error}</p>}
        <button type="submit" disabled={busy} className={primaryBtn}>{busy ? "저장 중..." : "저장"}</button>
      </form>
    </>
  );
}
