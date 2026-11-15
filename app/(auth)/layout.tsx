export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <main className="flex min-h-dvh items-center justify-center px-4 py-10">
      <div className="fade-up w-full max-w-[380px] rounded-[20px] border border-line bg-bg p-8 shadow-card">
        <h1 className="mb-1 text-center text-[32px] font-bold tracking-tight">Gram</h1>
        {children}
      </div>
    </main>
  );
}
