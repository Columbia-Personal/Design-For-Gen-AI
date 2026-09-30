import Link from "next/link";
import { ArrowLeft, CircleAlert } from "lucide-react";

export const metadata = {
  title: "Sign-in issue | Caption lab",
};

export default function AuthCodeErrorPage() {
  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-2xl items-center px-6 py-16 sm:px-12">
      <section className="w-full rounded-3xl border border-border bg-background/80 p-7 shadow-sm backdrop-blur sm:p-10">
        <CircleAlert className="size-7 text-destructive" aria-hidden />
        <h1 className="mt-6 font-display text-4xl font-medium tracking-tight text-primary sm:text-5xl">
          That sign-in link did not work.
        </h1>
        <p className="mt-4 max-w-xl text-base leading-relaxed text-secondary">
          Go back to the home page and try Google sign-in again.
        </p>
        <Link
          href="/"
          className="mt-8 inline-flex min-h-11 items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-medium text-background transition-transform duration-200 hover:-translate-y-0.5 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent"
        >
          <ArrowLeft className="size-4" aria-hidden />
          Back to home
        </Link>
      </section>
    </main>
  );
}
