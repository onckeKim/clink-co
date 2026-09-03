/** Route-level Suspense fallback for /checkout — mirrors CheckoutView's two-column shell so there's no layout shift once it resolves. */
export default function CheckoutLoading() {
  return (
    <div className="mx-auto max-w-6xl px-6 py-10 sm:px-8" aria-busy="true">
      <div className="mb-2 h-9 w-40 animate-pulse rounded-full bg-sand/50" />
      <div className="mb-8 h-6 w-full max-w-md animate-pulse rounded-full bg-sand/40" />
      <div className="grid gap-10 lg:grid-cols-[1fr_340px]">
        <div className="rounded-3xl border border-sand p-6 sm:p-8">
          <div className="flex flex-col gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-14 animate-pulse rounded-2xl bg-sand/40" />
            ))}
          </div>
        </div>
        <div className="h-80 animate-pulse rounded-3xl bg-sand/30" />
      </div>
    </div>
  );
}
