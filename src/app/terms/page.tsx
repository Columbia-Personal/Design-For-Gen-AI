import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export const metadata = {
  title: "Terms | Caption lab",
  description: "Terms for using the Caption Lab course project.",
};

export default function TermsPage() {
  return (
    <div className="flex min-h-dvh flex-col">
      <header className="border-b border-border bg-background/80 px-6 py-5 backdrop-blur sm:px-12">
        <div className="mx-auto flex w-full max-w-3xl items-center justify-between gap-4">
          <Link
            href="/"
            className="inline-flex min-h-11 items-center gap-2 rounded-lg px-1 text-sm font-medium text-secondary transition-colors duration-200 hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent"
          >
            <ArrowLeft className="size-4" aria-hidden />
            Home
          </Link>
          <span className="font-mono text-xs uppercase tracking-[0.16em] text-secondary">
            Terms
          </span>
        </div>
      </header>

      <main className="mx-auto w-full max-w-3xl flex-1 px-6 py-14 sm:px-12 sm:py-20">
        <article className="border-y border-border py-10 sm:py-14">
          <p className="font-mono text-xs uppercase tracking-[0.16em] text-accent">
            Caption Lab
          </p>
          <h1 className="mt-5 font-display text-5xl font-medium tracking-tight text-primary sm:text-7xl">
            Terms of use.
          </h1>
          <p className="mt-5 max-w-2xl text-lg leading-relaxed text-secondary">
            Caption Lab is a small educational project for Design for Generative AI.
          </p>

          <div className="mt-12 space-y-10 text-base leading-7 text-secondary">
            <section>
              <h2 className="font-display text-2xl font-medium tracking-tight text-primary">Using the project</h2>
              <p className="mt-3">
                You may browse the public caption collection without an account. If you sign in, provide accurate profile information and use only a photo you have permission to upload.
              </p>
            </section>

            <section>
              <h2 className="font-display text-2xl font-medium tracking-tight text-primary">Your account</h2>
              <p className="mt-3">
                Google handles authentication. Keep control of your Google account and sign out on shared devices. Caption Lab may change or be removed as the course project evolves.
              </p>
            </section>

            <section>
              <h2 className="font-display text-2xl font-medium tracking-tight text-primary">Availability</h2>
              <p className="mt-3">
                The project is provided for educational use without guarantees of uninterrupted service, feature permanence, or suitability for commercial use.
              </p>
            </section>
          </div>
        </article>
      </main>
    </div>
  );
}
