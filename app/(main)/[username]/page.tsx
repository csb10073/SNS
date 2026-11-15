import Link from "next/link";
import { Suspense } from "react";
import { notFound } from "next/navigation";
import { LogoutButton } from "@/components/logout-button";
import { TopBar } from "@/components/nav";
import { Avatar, EmptyState, primaryBtn } from "@/components/ui";
import { fetchProfileByUsername, fetchProfilePosts } from "@/lib/queries";
import { requireMe } from "@/lib/session";

async function Content({ params }: { params: Promise<{ username: string }> }) {
  const { username } = await params;
  const { sb, me } = await requireMe();
  const user = await fetchProfileByUsername(sb, decodeURIComponent(username));
  if (!user) notFound();
  const { items, total } = await fetchProfilePosts(sb, user.id);
  const isMe = user.id === me.id;

  return (
    <>
      <section className="flex flex-col gap-4 px-5 py-6">
        <div className="flex items-center gap-6">
          <Avatar user={user} size={80} />
          <div className="flex-1">
            <h2 className="text-[20px] font-semibold">{user.username}</h2>
            <p className="mt-1 text-[14px]"><strong>{total}</strong> <span className="text-muted">게시글</span></p>
          </div>
        </div>
        <div>
          <p className="text-[15px] font-semibold">{user.displayName}</p>
          {user.bio && <p className="mt-0.5 whitespace-pre-wrap break-words text-[14px] text-muted">{user.bio}</p>}
        </div>
        {isMe && (
          <div className="flex gap-2">
            <Link href="/settings/profile" className="flex-1 rounded-xl bg-subtle py-2 text-center text-[14px] font-semibold transition-colors hover:bg-line">프로필 편집</Link>
            <LogoutButton />
          </div>
        )}
      </section>

      <div className="border-t border-line bg-bg">
        {items.length === 0 ? (
          <EmptyState
            icon="image" title="아직 게시글이 없어요" description={isMe ? "첫 사진을 공유해보세요." : "아직 공유한 게시글이 없어요."}
            action={isMe ? <Link href="/new" className={primaryBtn}>게시글 작성</Link> : undefined}
          />
        ) : (
          <ul className="grid grid-cols-3 gap-px bg-line">
            {items.map((p) => (
              <li key={p.id} className="aspect-square">
                <Link
                  href={`/p/${p.id}`} aria-label={p.content || "게시글 보기"}
                  className="relative flex size-full items-center justify-center overflow-hidden bg-bg p-2 text-center text-[11px] leading-snug text-muted transition-opacity hover:opacity-80"
                >
                  {p.image_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={p.image_url} alt={p.content || "게시글 이미지"} loading="lazy" className="absolute inset-0 size-full object-cover" />
                  ) : (
                    <span className="line-clamp-4">{p.content}</span>
                  )}
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </>
  );
}

export default function ProfilePage({ params }: PageProps<"/[username]">) {
  return (
    <>
      <TopBar title="프로필" />
      <Suspense fallback={<div className="skeleton m-5 h-32 rounded-2xl" />}>
        <Content params={params} />
      </Suspense>
    </>
  );
}
