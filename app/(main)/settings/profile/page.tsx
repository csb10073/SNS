import { Suspense } from "react";
import { ProfileForm } from "@/components/profile-form";
import { requireMe } from "@/lib/session";

async function Content() {
  const { me } = await requireMe();
  return <ProfileForm me={me} />;
}

export default function ProfileSettingsPage() {
  return (
    <Suspense fallback={<div className="skeleton m-5 h-64 rounded-2xl" />}>
      <Content />
    </Suspense>
  );
}
