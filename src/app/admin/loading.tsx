/** Route-level Suspense fallback for /admin and every /admin/** page — shown while requireAdmin() resolves and AdminShell hasn't mounted yet. */
export default function AdminLoading() {
  return (
    <div className="flex min-h-screen" aria-busy="true">
      <div className="hidden w-64 shrink-0 border-r border-sand bg-warm-white p-4 lg:block">
        <div className="mb-6 h-8 w-32 animate-pulse rounded-full bg-sand/50" />
        <div className="flex flex-col gap-2">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="h-9 animate-pulse rounded-xl bg-sand/40" />
          ))}
        </div>
      </div>
      <div className="flex-1 p-6 sm:p-8">
        <div className="mb-6 h-8 w-56 animate-pulse rounded-full bg-sand/50" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-24 animate-pulse rounded-2xl bg-sand/40" />
          ))}
        </div>
        <div className="mt-6 h-64 animate-pulse rounded-2xl bg-sand/40" />
      </div>
    </div>
  );
}
