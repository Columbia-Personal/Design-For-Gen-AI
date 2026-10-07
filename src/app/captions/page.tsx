import Link from "next/link";
import { connection } from "next/server";
import { ArrowLeft, ArrowDownRight, Sparkles } from "lucide-react";
import { CaptionList, type Caption } from "./caption-list";
import { CaptionGenerator } from "./caption-generator";
import type { VoteTotal } from "./rating-controls";
import { AuthButton } from "@/components/auth-button";
import { getSupabase } from "@/lib/supabase";
import { createClient } from "@/lib/supabase/server";

export const metadata = {
  title: "Caption lab | Ritvik Sharma",
  description: "Generate and rate short captions with Supabase and Gemini.",
};

type VoteRow = {
  caption_id: number;
  value: -1 | 1;
};

type VoteTotalRow = VoteTotal & {
  caption_id: number;
};

export default async function CaptionsPage() {
  await connection();

  const publicSupabase = getSupabase();
  const sessionSupabase = await createClient();
  const {
    data: { user },
  } = await sessionSupabase.auth.getUser();

  const [captionsResult, totalsResult, votesResult] = await Promise.all([
    publicSupabase
      .from("captions")
      .select("id, text, prompt, author_id, generation_model, created_at")
      .order("created_at", { ascending: false }),
    publicSupabase.rpc("caption_vote_totals"),
    user
      ? sessionSupabase.from("caption_votes").select("caption_id, value")
      : Promise.resolve({ data: [] as VoteRow[], error: null }),
  ]);

  const captions = (captionsResult.data ?? []) as Caption[];
  const totals = (totalsResult.data ?? []) as VoteTotalRow[];
  const votes = (votesResult.data ?? []) as VoteRow[];
  const initialTotals = Object.fromEntries(
    totals.map((total) => [
      total.caption_id,
      {
        upvotes: Number(total.upvotes),
        downvotes: Number(total.downvotes),
        score: Number(total.score),
      },
    ]),
  ) as Record<number, VoteTotal>;
  const initialVotes = Object.fromEntries(
    votes.map((vote) => [vote.caption_id, vote.value]),
  ) as Record<number, -1 | 1>;

  return (
    <div className="caption-page flex min-h-screen flex-col">
      <header className="sticky top-0 z-30 px-4 py-4 sm:px-8">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-4 rounded-full border border-border bg-background/80 px-4 py-2 shadow-sm backdrop-blur sm:px-5">
          <Link
            href="/"
            className="inline-flex min-h-11 items-center gap-2 rounded-full px-2 text-sm font-medium text-secondary transition-colors hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent"
          >
            <ArrowLeft className="size-4" aria-hidden />
            Home
          </Link>
          <Link href="/captions" className="hidden font-editorial text-lg font-medium tracking-tight text-primary sm:inline">
            Caption Lab
          </Link>
          <div className="flex items-center gap-3">
            <AuthButton />
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-6xl flex-1 overflow-x-clip px-6 pb-20 pt-12 sm:px-12 sm:pt-20">
        <section className="grid gap-10 border-b border-border pb-14 lg:grid-cols-[minmax(0,1fr)_minmax(17rem,0.44fr)] lg:items-end">
          <div>
            <h1 className="max-w-6xl font-editorial text-[clamp(3rem,7vw,6rem)] font-medium leading-[0.94] tracking-[-0.065em] text-primary">
              The city gives you a scene. <span className="mx-1 inline-flex h-[0.7em] w-[1.45em] -rotate-6 rounded-full border border-accent/30 bg-[radial-gradient(circle_at_30%_30%,var(--color-accent)_0_12%,transparent_13%),linear-gradient(135deg,var(--color-muted),var(--color-background))] align-middle shadow-[0_0_0_5px_var(--color-background)]" aria-hidden /> The feed gives it a line.
            </h1>
            <p className="mt-7 max-w-2xl text-lg leading-relaxed text-secondary sm:text-xl">
              Drop in a dorm-room observation, a subway delay, or the weird thing that happened on a Saturday walk. Generate one caption, then let the room decide what stays.
            </p>
          </div>
          <div className="relative overflow-hidden rounded-[2rem] border border-border bg-primary p-6 text-background shadow-xl shadow-primary/10">
            <div aria-hidden className="absolute -right-16 -top-14 size-48 rounded-full border border-background/15" />
            <Sparkles className="relative size-6 text-accent" aria-hidden />
            <p className="relative mt-12 font-editorial text-3xl leading-tight tracking-tight">
              One scene. One line. A real vote.
            </p>
            <a
              href="#make-a-caption"
              className="relative mt-7 inline-flex min-h-11 items-center gap-2 rounded-xl bg-background px-4 py-2 text-sm font-medium text-primary transition-transform duration-200 hover:-translate-y-0.5 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-background"
            >
              Make a caption
              <ArrowDownRight className="size-4" aria-hidden />
            </a>
          </div>
        </section>

        <section className="py-14 sm:py-20" aria-labelledby="caption-list-heading">
          {captionsResult.error ? (
            <p className="rounded-2xl border border-destructive/30 bg-destructive/5 px-5 py-4 text-sm leading-relaxed text-secondary">
              The captions could not be loaded. Please refresh and try again.
            </p>
          ) : (
            <CaptionList
              captions={captions}
              userId={user?.id ?? null}
              initialVotes={initialVotes}
              initialTotals={initialTotals}
            />
          )}
        </section>

        <section id="make-a-caption" className="scroll-mt-28 border-t border-border py-14 sm:py-20" aria-labelledby="generation-heading">
          {user ? (
            <CaptionGenerator />
          ) : (
            <div className="relative overflow-hidden rounded-[2rem] border border-border bg-muted/40 p-6 sm:flex sm:items-center sm:justify-between sm:gap-8 sm:p-8">
              <div aria-hidden className="absolute -bottom-20 -right-12 size-56 rounded-full bg-accent/10 blur-3xl" />
              <div className="relative">
                <h2 id="generation-heading" className="font-editorial text-3xl font-medium tracking-tight text-primary">
                  Make a caption, then leave your mark on the feed.
                </h2>
                <p className="mt-3 max-w-xl text-base leading-relaxed text-secondary">
                  Anyone can browse. Signing in lets you write a new prompt and rate the captions that make the cut.
                </p>
              </div>
              <Link
                href="/"
                className="relative mt-5 inline-flex min-h-11 w-fit items-center justify-center rounded-xl bg-primary px-4 py-2 text-sm font-medium text-background transition-transform duration-200 hover:-translate-y-0.5 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent sm:mt-0"
              >
                Sign in to contribute
              </Link>
            </div>
          )}
        </section>
      </main>

      <footer className="border-t border-border px-6 py-7 sm:px-12">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-1 text-xs text-secondary sm:flex-row sm:items-center sm:justify-between">
          <span>Ritvik Sharma · Design for Generative AI</span>
          <span>Week 4: generation, ratings, and RLS</span>
        </div>
      </footer>
    </div>
  );
}
