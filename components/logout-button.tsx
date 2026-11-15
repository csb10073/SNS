"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { createClient } from "@/utils/supabase/client";

export function LogoutButton() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  return (
    <button
      disabled={busy}
      onClick={async () => {
        setBusy(true);
        await createClient().auth.signOut();
        router.replace("/login");
        router.refresh();
      }}
      className="rounded-xl bg-subtle px-4 py-2 text-[14px] font-semibold text-like transition-colors hover:bg-line disabled:opacity-50"
    >
      로그아웃
    </button>
  );
}
