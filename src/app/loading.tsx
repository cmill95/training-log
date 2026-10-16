// One skeleton for every page: back link, heading, then a list, which is the
// shape all the signed-in pages share. Pages with their own loading.tsx
// would override it; none need to yet.
export default function Loading() {
  return (
    <main
      aria-busy
      className="mx-auto flex w-full max-w-xl flex-1 animate-pulse flex-col gap-8 px-4 py-12"
    >
      <span className="sr-only" role="status">
        Loading…
      </span>
      <div className="h-4 w-24 rounded bg-zinc-200 dark:bg-zinc-800" />
      <div className="h-8 w-48 rounded bg-zinc-200 dark:bg-zinc-800" />
      <div className="flex flex-col divide-y divide-zinc-200 rounded-md border border-zinc-200 dark:divide-zinc-800 dark:border-zinc-800">
        {[0, 1, 2].map((row) => (
          <div key={row} className="flex flex-col gap-2 px-4 py-3">
            <div className="h-4 w-2/3 rounded bg-zinc-200 dark:bg-zinc-800" />
            <div className="h-3 w-1/3 rounded bg-zinc-100 dark:bg-zinc-900" />
          </div>
        ))}
      </div>
    </main>
  );
}
