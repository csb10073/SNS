"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Icon, primaryBtn } from "@/components/ui";
import { ALLOWED_TYPES, MAX_IMAGE_SIZE, compressImage } from "@/lib/image";
import { createClient } from "@/utils/supabase/client";

const MAX_CONTENT = 2200;

export default function NewPostPage() {
  const router = useRouter();
  const [content, setContent] = useState("");
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

  const clearImage = () => {
    if (preview) URL.revokeObjectURL(preview);
    setFile(null);
    setPreview(null);
  };

  const canSubmit = (content.trim().length > 0 || !!file) && !busy;

  /** 이미지 업로드 → 게시글 INSERT. 업로드가 실패하면 게시글을 만들지 않고, INSERT가 실패하면 업로드한 파일을 지운다. */
  const submit = async () => {
    if (!canSubmit) return;
    setBusy(true);
    setError("");
    const sb = createClient();
    const { data: { user } } = await sb.auth.getUser();
    if (!user) { router.push("/login"); return; }

    let imageUrl: string | null = null;
    let path: string | null = null;
    try {
      if (file) {
        const { blob, ext } = await compressImage(file);
        path = `${user.id}/${crypto.randomUUID()}.${ext}`;
        const { error: upErr } = await sb.storage.from("posts").upload(path, blob, { contentType: blob.type });
        if (upErr) throw upErr;
        imageUrl = sb.storage.from("posts").getPublicUrl(path).data.publicUrl;
      }
      const { error: insErr } = await sb.from("posts").insert({ user_id: user.id, content: content.trim() || null, image_url: imageUrl });
      if (insErr) throw insErr;
    } catch {
      if (path) await sb.storage.from("posts").remove([path]);
      setError("게시글을 공유하지 못했어요. 다시 시도해주세요.");
      setBusy(false);
      return;
    }
    router.push("/");
    router.refresh();
  };

  return (
    <>
      <header className="glass sticky top-0 z-30 flex h-12 items-center justify-between border-b border-line px-4">
        <Link href="/" aria-label="닫기" className="-ml-2 p-2"><Icon name="close" /></Link>
        <h1 className="text-[17px] font-semibold">새 게시글</h1>
        <button
          disabled={!canSubmit} onClick={submit}
          className="text-[16px] font-semibold text-accent disabled:text-muted"
        >{busy ? "공유 중..." : "공유"}</button>
      </header>

      <div className="flex flex-col gap-4 p-4">
        {preview ? (
          <div className="relative aspect-square overflow-hidden rounded-2xl border border-line">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={preview} alt="업로드할 이미지 미리보기" className="size-full object-cover" />
            <button onClick={clearImage} aria-label="이미지 제거" className="absolute right-2 top-2 rounded-full bg-black/50 p-1.5 text-white"><Icon name="close" className="size-4" /></button>
          </div>
        ) : (
          <label className="flex aspect-square cursor-pointer flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-line bg-bg text-muted transition-colors hover:bg-subtle focus-within:border-accent">
            <Icon name="image" className="size-10" />
            <span className="text-[15px] font-medium text-fg">사진 선택</span>
            <span className="text-[12px]">JPG, PNG, WEBP · 최대 5MB</span>
            <input type="file" accept="image/jpeg,image/png,image/webp" onChange={onFile} className="sr-only" />
          </label>
        )}
        {error && <p role="alert" className="text-[13px] text-like">{error}</p>}

        <div>
          <label htmlFor="content" className="sr-only">본문</label>
          <textarea
            id="content" value={content} maxLength={MAX_CONTENT} rows={5}
            onChange={(e) => setContent(e.target.value)} placeholder="문구를 입력하세요..."
            className="w-full resize-none rounded-xl border border-line bg-bg p-4 text-[15px] outline-none placeholder:text-muted focus:border-accent"
          />
          <p className="mt-1 text-right text-[12px] text-muted">{content.length.toLocaleString()} / {MAX_CONTENT.toLocaleString()}</p>
        </div>

        <button disabled={!canSubmit} onClick={submit} className={`${primaryBtn} md:hidden`}>공유하기</button>
      </div>
    </>
  );
}
