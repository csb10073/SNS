import Link from "next/link";
import { primaryBtn } from "@/components/ui";

export default function NotFound() {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-3 px-6 text-center">
      <h1 className="text-[28px] font-bold">페이지를 찾을 수 없어요</h1>
      <p className="text-[14px] text-muted">주소가 잘못되었거나 삭제된 페이지예요.</p>
      <Link href="/" className={`${primaryBtn} mt-3`}>홈으로</Link>
    </main>
  );
}
