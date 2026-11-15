"use client";

import { useEffect, useState, type ReactNode } from "react";
import type { Profile } from "@/lib/types";

export const gradient = (hue: number) =>
  `linear-gradient(135deg, hsl(${hue} 80% 72%), hsl(${(hue + 40) % 360} 75% 55%))`;

const hueOf = (s: string) => [...s].reduce((h, c) => (h * 31 + c.charCodeAt(0)) % 360, 7);

/** 아바타 이미지가 없으면 username 기반 그라데이션 + 이니셜 */
export function Avatar({ user, size = 36 }: { user: Pick<Profile, "username" | "displayName" | "avatarUrl">; size?: number }) {
  const style = { width: size, height: size };
  if (user.avatarUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img src={user.avatarUrl} alt={`${user.displayName} 아바타`} loading="lazy" style={style} className="inline-block shrink-0 rounded-full bg-subtle object-cover" />
    );
  }
  return (
    <span
      aria-label={`${user.displayName} 아바타`}
      role="img"
      className="inline-flex shrink-0 items-center justify-center rounded-full font-semibold text-white"
      style={{ ...style, background: gradient(hueOf(user.username)), fontSize: size * 0.4 }}
    >
      {user.displayName.slice(0, 1).toUpperCase()}
    </span>
  );
}

const fmtDate = (d: Date) => d.toLocaleDateString("ko-KR", { year: "numeric", month: "long", day: "numeric", timeZone: "Asia/Seoul" });

function relative(iso: string) {
  const diff = (Date.now() - new Date(iso).getTime()) / 1000;
  if (diff < 60) return "방금 전";
  if (diff < 3600) return `${Math.floor(diff / 60)}분 전`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}시간 전`;
  if (diff < 86400 * 7) return `${Math.floor(diff / 86400)}일 전`;
  return fmtDate(new Date(iso));
}

/** 상대 시간. 서버 렌더는 고정 날짜 문자열 → 마운트 후 상대 시간으로 교체 (하이드레이션 불일치 방지) */
export function TimeAgo({ iso }: { iso: string }) {
  const [label, setLabel] = useState(() => fmtDate(new Date(iso)));
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLabel(relative(iso));
  }, [iso]);
  return <time dateTime={iso} suppressHydrationWarning>{label}</time>;
}

export function Icon({ name, filled = false, className = "size-6" }: { name: string; filled?: boolean; className?: string }) {
  const common = {
    className,
    viewBox: "0 0 24 24",
    fill: filled ? "currentColor" : "none",
    stroke: "currentColor",
    strokeWidth: 1.8,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    "aria-hidden": true,
  };
  switch (name) {
    case "home":
      return <svg {...common}><path d="M3 11l9-8 9 8v9a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z" /></svg>;
    case "plus":
      return <svg {...common}><rect x="3" y="3" width="18" height="18" rx="5" /><path d="M12 8v8M8 12h8" /></svg>;
    case "user":
      return <svg {...common}><circle cx="12" cy="8" r="4" /><path d="M4 21c1-4 4-6 8-6s7 2 8 6" /></svg>;
    case "heart":
      return <svg {...common}><path d="M12 21s-8-5.2-8-11a4.5 4.5 0 0 1 8-2.8A4.5 4.5 0 0 1 20 10c0 5.8-8 11-8 11z" /></svg>;
    case "comment":
      return <svg {...common}><path d="M21 12a8 8 0 0 1-11.6 7.1L4 20l1-4.6A8 8 0 1 1 21 12z" /></svg>;
    case "more":
      return <svg {...common} fill="currentColor" stroke="none"><circle cx="5" cy="12" r="1.6" /><circle cx="12" cy="12" r="1.6" /><circle cx="19" cy="12" r="1.6" /></svg>;
    case "close":
      return <svg {...common}><path d="M6 6l12 12M18 6L6 18" /></svg>;
    case "image":
      return <svg {...common}><rect x="3" y="4" width="18" height="16" rx="3" /><circle cx="9" cy="10" r="1.6" /><path d="M21 16l-5-5-8 8" /></svg>;
    case "back":
      return <svg {...common}><path d="M15 5l-7 7 7 7" /></svg>;
    case "logout":
      return <svg {...common}><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9" /></svg>;
    default:
      return null;
  }
}

/** 확인 모달 (삭제 등 파괴적 동작) */
export function ConfirmModal({
  open, title, description, confirmLabel = "삭제", onConfirm, onCancel,
}: {
  open: boolean; title: string; description?: string; confirmLabel?: string;
  onConfirm: () => void; onCancel: () => void;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onCancel();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onCancel]);

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 p-6 fade-up" onClick={onCancel}>
      <div
        role="alertdialog" aria-modal="true" aria-labelledby="confirm-title"
        className="glass w-full max-w-[280px] overflow-hidden rounded-2xl text-center shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-5 pb-4 pt-5">
          <h2 id="confirm-title" className="text-[17px] font-semibold">{title}</h2>
          {description && <p className="mt-1 text-[13px] text-muted">{description}</p>}
        </div>
        <div className="grid grid-cols-2 border-t border-line text-[17px]">
          <button onClick={onCancel} className="border-r border-line py-3 text-accent transition-colors hover:bg-subtle">취소</button>
          <button onClick={onConfirm} className="py-3 font-semibold text-like transition-colors hover:bg-subtle">{confirmLabel}</button>
        </div>
      </div>
    </div>
  );
}

export function EmptyState({ icon, title, description, action }: { icon: string; title: string; description: string; action?: ReactNode }) {
  return (
    <div className="flex flex-col items-center gap-2 px-6 py-16 text-center">
      <div className="mb-2 flex size-16 items-center justify-center rounded-full bg-subtle text-muted"><Icon name={icon} className="size-8" /></div>
      <h3 className="text-[17px] font-semibold">{title}</h3>
      <p className="text-[14px] text-muted">{description}</p>
      {action && <div className="mt-3">{action}</div>}
    </div>
  );
}

export function PostSkeleton() {
  return (
    <div className="rounded-[20px] border border-line bg-bg p-4 shadow-card">
      <div className="flex items-center gap-3">
        <div className="skeleton size-9 rounded-full" />
        <div className="skeleton h-3 w-28 rounded" />
      </div>
      <div className="skeleton mt-4 aspect-square w-full rounded-2xl" />
      <div className="skeleton mt-4 h-3 w-3/4 rounded" />
    </div>
  );
}

export const inputCls =
  "w-full rounded-xl border border-line bg-bg px-4 py-3 text-[15px] outline-none transition-colors placeholder:text-muted focus:border-accent";
export const primaryBtn =
  "inline-flex items-center justify-center rounded-xl bg-accent px-5 py-3 text-[15px] font-semibold text-white transition-opacity hover:opacity-90 active:opacity-80 disabled:opacity-40";
