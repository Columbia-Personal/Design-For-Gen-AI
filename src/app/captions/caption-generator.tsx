"use client";

import { LoaderCircle, Sparkles } from "lucide-react";
import { motion, useReducedMotion } from "motion/react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

const MAX_PROMPT_LENGTH = 280;

export function CaptionGenerator() {
  const router = useRouter();
  const shouldReduceMotion = useReducedMotion();
  const [prompt, setPrompt] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function generateCaption(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const cleanPrompt = prompt.trim();

    if (!cleanPrompt) {
      setMessage("Describe a moment first.");
      return;
    }

    startTransition(async () => {
      setMessage(null);

      const response = await fetch("/api/generate-caption", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: cleanPrompt }),
      });
      const result = (await response.json().catch(() => null)) as { error?: string } | null;

      if (!response.ok) {
        setMessage(result?.error ?? "Caption generation did not finish. Try again.");
        return;
      }

      setPrompt("");
      setMessage("Caption posted. See what the room thinks.");
      router.refresh();
    });
  }

  return (
    <section
      className="rounded-3xl border border-border bg-background/85 p-5 shadow-sm backdrop-blur sm:p-7"
      aria-labelledby="generate-caption-heading"
    >
      <div className="flex items-start gap-3">
        <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-accent/10 text-accent">
          <Sparkles className="size-5" aria-hidden />
        </div>
        <div>
          <p className="font-mono text-xs uppercase tracking-[0.16em] text-accent">Make one</p>
          <h2 id="generate-caption-heading" className="mt-1 font-display text-2xl font-medium tracking-tight text-primary">
            Give the feed a new scene.
          </h2>
        </div>
      </div>

      <p className="mt-4 max-w-2xl text-sm leading-relaxed text-secondary">
        Describe something you saw, heard, or could not believe happened. Caption Lab writes one line and saves both the line and your prompt.
      </p>

      <form className="mt-5 grid gap-3" onSubmit={generateCaption}>
        <label className="grid gap-2 text-sm font-medium text-foreground" htmlFor="caption-prompt">
          The scene
          <textarea
            id="caption-prompt"
            value={prompt}
            onChange={(event) => setPrompt(event.target.value)}
            maxLength={MAX_PROMPT_LENGTH}
            required
            rows={3}
            placeholder="The 1 train pauses at 125th, and everyone suddenly becomes a train engineer."
            className="min-h-28 resize-y rounded-xl border border-border bg-background px-3 py-3 text-base font-normal leading-relaxed text-foreground outline-none transition-colors duration-200 placeholder:text-secondary/70 focus:border-accent focus:ring-2 focus:ring-accent/20"
          />
        </label>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-xs text-secondary">{prompt.length}/{MAX_PROMPT_LENGTH}</p>
          <motion.button
            type="submit"
            disabled={isPending}
            whileTap={shouldReduceMotion ? undefined : { scale: 0.97 }}
            className="inline-flex min-h-11 cursor-pointer items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-medium text-background transition-transform duration-200 hover:-translate-y-0.5 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isPending ? <LoaderCircle className="size-4 animate-spin motion-reduce:animate-none" aria-hidden /> : <Sparkles className="size-4" aria-hidden />}
            {isPending ? "Writing" : "Generate caption"}
          </motion.button>
        </div>
        <p className="min-h-5 text-sm text-secondary" aria-live="polite">{message}</p>
      </form>
    </section>
  );
}
