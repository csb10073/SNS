"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Icon } from "@/components/ui";

const navItems = (username: string) => [
  { href: "/", label: "홈", icon: "home" },
  { href: "/new", label: "작성", icon: "plus" },
  { href: `/${username}`, label: "프로필", icon: "user" },
];

export function SideNav({ username }: { username: string }) {
  const path = usePathname();
  const items = navItems(username);
  return (
    <aside className="fixed inset-y-0 left-0 hidden w-[220px] flex-col border-r border-line bg-bg px-4 py-8 md:flex">
      <Link href="/" className="mb-8 px-3 text-[26px] font-bold tracking-tight">Gram</Link>
      <nav aria-label="주 메뉴" className="flex flex-col gap-1">
        {items.map((it) => {
          const active = path === it.href;
          return (
            <Link
              key={it.href} href={it.href} aria-current={active ? "page" : undefined}
              className={`flex items-center gap-4 rounded-xl px-3 py-3 text-[16px] transition-colors hover:bg-subtle ${active ? "font-semibold" : ""}`}
            >
              <Icon name={it.icon} filled={active && it.icon === "home"} />
              {it.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}

export function TabBar({ username }: { username: string }) {
  const path = usePathname();
  const items = navItems(username);
  return (
    <nav aria-label="하단 탭" className="glass fixed inset-x-0 bottom-0 z-40 border-t border-line pb-[env(safe-area-inset-bottom)] md:hidden">
      <ul className="mx-auto flex max-w-[470px] justify-around">
        {items.map((it) => {
          const active = path === it.href;
          return (
            <li key={it.href}>
              <Link
                href={it.href} aria-label={it.label} aria-current={active ? "page" : undefined}
                className={`flex h-14 w-20 items-center justify-center transition-colors ${active ? "text-fg" : "text-muted"}`}
              >
                <Icon name={it.icon} filled={active && it.icon === "home"} />
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

export function TopBar({ title, back, right }: { title?: string; back?: boolean; right?: React.ReactNode }) {
  return (
    <header className="glass sticky top-0 z-30 flex h-12 items-center justify-between border-b border-line px-4">
      <div className="flex w-16 items-center">
        {back && <Link href="/" aria-label="뒤로" className="-ml-2 p-2"><Icon name="back" /></Link>}
      </div>
      <h1 className="text-[17px] font-semibold">{title ?? "Gram"}</h1>
      <div className="flex w-16 items-center justify-end">{right}</div>
    </header>
  );
}
