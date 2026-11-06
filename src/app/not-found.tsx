import Link from "next/link";

// Shown for unknown URLs and whenever a page calls notFound(). Pages also call
// notFound() for records that belong to someone else, hence the wording.
export default function NotFound() {
  return (
    <main className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center gap-4 px-4 py-16">
      <h1 className="text-2xl font-semibold">Not found</h1>
      <p className="text-zinc-500">
        This page doesn&apos;t exist, or it isn&apos;t yours to see.
      </p>
      <Link href="/" className="underline">
        ← Home
      </Link>
    </main>
  );
}
