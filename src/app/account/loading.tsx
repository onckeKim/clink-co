/** Route-level Suspense fallback for /account and every /account/** page — mirrors AccountLayout's shell so there's no layout shift once it resolves. */
export default function AccountLoading() {
  return (
    <div className="mx-auto max-w-6xl px-6 py-10 sm:px-8 sm:py-14" aria-busy="true">
      <div className="grid gap-8 lg:grid-cols-[240px_1fr]">
        <div className="rounded-3xl border border-sand bg-warm-white p-3">
          <div className="flex flex-col gap-1.5">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-10 animate-pulse rounded-2xl bg-sand/50" />
            ))}
          </div>
        </div>
        <div className="min-w-0">
          <div className="mb-6 h-8 w-48 animate-pulse rounded-full bg-sand/50" />
          <div className="flex flex-col gap-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-28 animate-pulse rounded-2xl bg-sand/40" />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
