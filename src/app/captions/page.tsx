import Link from "next/link";
import { connection } from "next/server";
import { ArrowLeft, Database, Rows3 } from "lucide-react";
import { CaptionList, type Caption } from "./caption-list";
import { getSupabase } from "@/lib/supabase";

export const metadata = {
  title: "Caption lab | Ritvik Sharma",
  description: "A public list of captions stored in Supabase.",
};

export default async function CaptionsPage() {
  await connection();

  const supabase = getSupabase();
  const { data, error } = await supabase
    .from("captions")
    .select("id, text")
    .order("id", { ascending: true });

  const captions = (data ?? []) as Caption[];

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
          <span className="font-mono text-xs uppercase tracking-[0.16em] text-secondary">
            Assignment 02
          </span>
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
              A working set of short captions, loaded from the database.
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

          {error ? (
            <p className="rounded-2xl border border-destructive/30 bg-destructive/5 px-5 py-4 text-sm leading-relaxed text-secondary">
              The captions could not be loaded. Please refresh and try again.
            </p>
          ) : (
            <CaptionList captions={captions} />
          )}
        </section>
      </main>

      <footer className="border-t border-border px-6 py-7 sm:px-12">
        <div className="mx-auto flex w-full max-w-5xl flex-col gap-1 text-xs text-secondary sm:flex-row sm:items-center sm:justify-between">
          <span>Ritvik Sharma · Design for Generative AI</span>
          <span>Week 2: Supabase data fetching</span>
        </div>
      </footer>
    </div>
  );
}
