import type { Metadata } from "next";
import { SignUpForm } from "./form";

export const metadata: Metadata = { title: "Create account · Training Log" };

export default function SignUpPage() {
  return (
    <main className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center gap-6 px-4 py-16">
      <h1 className="text-2xl font-semibold">Create an account</h1>
      <SignUpForm />
    </main>
  );
}
