import Link from "next/link";
import { connection } from "next/server";
import { ArrowLeft, Database, Rows3, Sparkles } from "lucide-react";
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
      <header className="border-b border-border bg-background/90 px-6 py-5 backdrop-blur sm:px-12">
        <div className="mx-auto flex w-full max-w-5xl items-center justify-between gap-4">
          <Link
            href="/"
            className="inline-flex min-h-11 items-center gap-2 rounded-lg px-1 text-sm font-medium text-secondary transition-colors hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent"
          >
            <ArrowLeft className="size-4" aria-hidden />
            Home
          </Link>
          <div className="flex items-center gap-3">
            <span className="hidden font-mono text-xs uppercase tracking-[0.16em] text-secondary sm:inline">
              Assignments 02–04
            </span>
            <AuthButton />
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-5xl flex-1 px-6 py-14 sm:px-12 sm:py-20">
        <section className="grid gap-8 border-b border-border pb-10 sm:grid-cols-[1fr_auto] sm:items-end">
          <div>
            <p className="mb-4 flex items-center gap-2 font-mono text-xs uppercase tracking-[0.16em] text-accent">
              <Database className="size-4" aria-hidden />
              Supabase collection
            </p>
            <h1 className="max-w-2xl font-display text-5xl font-medium tracking-tight text-primary sm:text-7xl">
              Caption lab
            </h1>
            <p className="mt-5 max-w-xl text-lg leading-relaxed text-secondary">
              Put a moment on the feed, get an AI caption back, and vote on the ones worth keeping.
            </p>
          </div>
          <div className="inline-flex w-fit items-center gap-3 rounded-xl border border-border bg-muted/55 px-4 py-3 text-sm text-secondary">
            <Rows3 className="size-4 text-accent" aria-hidden />
            <span>
              <strong className="font-medium text-foreground">{captions.length}</strong>{" "}
              {captions.length === 1 ? "caption" : "captions"}
            </span>
          </div>
        </section>

        <section className="py-8 sm:py-10" aria-labelledby="generation-heading">
          {user ? (
            <CaptionGenerator />
          ) : (
            <div className="flex flex-col gap-4 rounded-3xl border border-border bg-muted/40 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-7">
              <div>
                <p className="flex items-center gap-2 font-mono text-xs uppercase tracking-[0.16em] text-accent">
                  <Sparkles className="size-4" aria-hidden />
                  Signed-in feature
                </p>
                <h2 id="generation-heading" className="mt-2 font-display text-2xl font-medium tracking-tight text-primary">
                  Make a caption, then rate the feed.
                </h2>
                <p className="mt-2 max-w-xl text-sm leading-relaxed text-secondary">
                  Browsing stays open. Sign in to generate a new caption or add your vote.
                </p>
              </div>
              <Link
                href="/"
                className="inline-flex min-h-11 w-fit items-center justify-center rounded-xl bg-primary px-4 py-2 text-sm font-medium text-background transition-transform duration-200 hover:-translate-y-0.5 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent"
              >
                Sign in to contribute
              </Link>
            </div>
          )}
        </section>

        <section className="py-8 sm:py-10" aria-labelledby="caption-list-heading">
          <div className="mb-5 flex items-center justify-between gap-4">
            <h2
              id="caption-list-heading"
              className="font-mono text-xs uppercase tracking-[0.16em] text-secondary"
            >
              The list
            </h2>
            <span className="h-px flex-1 bg-border" aria-hidden />
          </div>

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
      </main>

      <footer className="border-t border-border px-6 py-7 sm:px-12">
        <div className="mx-auto flex w-full max-w-5xl flex-col gap-1 text-xs text-secondary sm:flex-row sm:items-center sm:justify-between">
          <span>Ritvik Sharma · Design for Generative AI</span>
          <span>Week 4: generation, ratings, and RLS</span>
        </div>
      </footer>
    </div>
  );
}
