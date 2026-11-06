"use client"; // Error boundaries must be Client Components

import Link from "next/link";
import { useEffect } from "react";

// Next 16 passes `retry` (older versions called it `reset`).
export default function Error({
  error,
  retry,
}: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center gap-4 px-4 py-16">
      <h1 className="text-2xl font-semibold">Something went wrong</h1>
      <div className="flex items-center gap-4">
        <button
          onClick={() => retry()}
          className="rounded-md border border-zinc-300 px-4 py-2 font-medium dark:border-zinc-700"
        >
          Try again
        </button>
        <Link href="/" className="underline">
          Home
        </Link>
      </div>
    </main>
  );
}
