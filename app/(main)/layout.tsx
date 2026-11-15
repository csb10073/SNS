import { Suspense } from "react";
import { SideNav, TabBar } from "@/components/nav";
import { requireMe } from "@/lib/session";

async function Shell({ children }: { children: React.ReactNode }) {
  const { me } = await requireMe();
  return (
    <>
      <Suspense><SideNav username={me.username} /></Suspense>
      <div className="mx-auto min-h-dvh w-full max-w-[470px] pb-20 md:ml-[220px] md:max-w-none md:pb-8">
        <div className="mx-auto w-full md:max-w-[470px]">{children}</div>
      </div>
      <Suspense><TabBar username={me.username} /></Suspense>
    </>
  );
}

export default function MainLayout({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={<div className="min-h-dvh" />}>
      <Shell>{children}</Shell>
    </Suspense>
  );
}
