import { headers } from "next/headers";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { signOut } from "./(auth)/actions";

export default async function Home() {
  const session = await auth.api.getSession({ headers: await headers() });

  return (
    <main className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center gap-6 px-4 py-16">
      <h1 className="text-3xl font-semibold">Training Log</h1>
      {session ? (
        <>
          <p>
            Signed in as {session.user.name} ({session.user.role}).
          </p>
          <form action={signOut}>
            <button className="rounded-md border border-zinc-300 px-4 py-2 font-medium dark:border-zinc-700">
              Sign out
            </button>
          </form>
        </>
      ) : (
        <div className="flex gap-3">
          <Link
            href="/sign-in"
            className="rounded-md bg-foreground px-4 py-2 font-medium text-background"
          >
            Sign in
          </Link>
          <Link
            href="/sign-up"
            className="rounded-md border border-zinc-300 px-4 py-2 font-medium dark:border-zinc-700"
          >
            Create account
          </Link>
        </div>
      )}
    </main>
  );
}
