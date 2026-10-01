import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export const metadata = {
  title: "Privacy | Caption lab",
  description: "How Caption Lab handles account and profile information.",
};

export default function PrivacyPage() {
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
            Privacy
          </span>
        </div>
      </header>

      <main className="mx-auto w-full max-w-3xl flex-1 px-6 py-14 sm:px-12 sm:py-20">
        <article className="border-y border-border py-10 sm:py-14">
          <p className="font-mono text-xs uppercase tracking-[0.16em] text-accent">
            Caption Lab
          </p>
          <h1 className="mt-5 font-display text-5xl font-medium tracking-tight text-primary sm:text-7xl">
            Privacy, plainly stated.
          </h1>
          <p className="mt-5 max-w-2xl text-lg leading-relaxed text-secondary">
            Caption Lab is a course project. This page explains the small amount of information used to provide its sign-in and profile features.
          </p>

          <div className="mt-12 space-y-10 text-base leading-7 text-secondary">
            <section>
              <h2 className="font-display text-2xl font-medium tracking-tight text-primary">What we collect</h2>
              <p className="mt-3">
                When you sign in with Google, Caption Lab receives the basic identity information Google provides for authentication, including your email address. If you complete your profile, we also store the first name, last name, and profile-photo link you choose to provide.
              </p>
            </section>

            <section>
              <h2 className="font-display text-2xl font-medium tracking-tight text-primary">How it is used</h2>
              <p className="mt-3">
                This information is used only to maintain your signed-in session and show your profile within Caption Lab. The public caption list does not require an account.
              </p>
            </section>

            <section>
              <h2 className="font-display text-2xl font-medium tracking-tight text-primary">Where it is stored</h2>
              <p className="mt-3">
                Account and profile details are stored in Supabase. Profile images are stored in Supabase Storage; the relational database keeps only the image URL, not the image file itself.
              </p>
            </section>

            <section>
              <h2 className="font-display text-2xl font-medium tracking-tight text-primary">Choices</h2>
              <p className="mt-3">
                You can update your name or replace your profile photo from the Profile section after signing in. This project does not sell personal information or use it for advertising.
              </p>
            </section>
          </div>
        </article>
      </main>
    </div>
  );
}
