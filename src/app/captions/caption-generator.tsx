"use client";

import { LoaderCircle, Sparkles, WandSparkles } from "lucide-react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { SCENE_MEDIA } from "@/lib/scene-media";

const MAX_PROMPT_LENGTH = 280;

export function CaptionGenerator() {
  const router = useRouter();
  const shouldReduceMotion = useReducedMotion();
  const [prompt, setPrompt] = useState("");
  const [mediaKey, setMediaKey] = useState(SCENE_MEDIA[0].key);
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
        body: JSON.stringify({ prompt: cleanPrompt, mediaKey }),
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
      className="relative overflow-hidden rounded-[2rem] border border-border bg-background/85 p-5 shadow-sm backdrop-blur sm:p-8"
      aria-labelledby="generate-caption-heading"
    >
      <div aria-hidden className="absolute -right-14 -top-16 size-44 rounded-full bg-accent/10 blur-3xl" />
      <div className="flex items-start gap-3">
        <div className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-accent text-background shadow-lg shadow-accent/20">
          <WandSparkles className="size-5" aria-hidden />
        </div>
        <div>
          <h2 id="generate-caption-heading" className="font-editorial text-3xl font-medium tracking-tight text-primary">
            Give the feed a new scene.
          </h2>
        </div>
      </div>

      <p className="mt-4 max-w-2xl text-base leading-relaxed text-secondary">
        Describe a small NYC moment. Caption Lab writes one dry line, then keeps the prompt with it so people can see where it came from.
      </p>

      <fieldset className="relative mt-6">
        <legend className="text-sm font-medium text-foreground">Pick the visual</legend>
        <p className="mt-1 text-sm text-secondary">It stays with the caption when it reaches the feed.</p>
        <div className="mt-3 grid grid-cols-2 gap-3 lg:grid-cols-4">
          {SCENE_MEDIA.map((scene) => {
            const isSelected = scene.key === mediaKey;
            return (
              <motion.button
                key={scene.key}
                type="button"
                aria-pressed={isSelected}
                onClick={() => {
                  setMediaKey(scene.key);
                  if (!prompt.trim()) setPrompt(scene.promptSeed);
                }}
                whileTap={shouldReduceMotion ? undefined : { scale: 0.98 }}
                className={`group relative aspect-[4/3] min-h-28 cursor-pointer overflow-hidden rounded-2xl border text-left focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent ${isSelected ? "border-accent ring-2 ring-accent/30" : "border-border hover:border-accent/60"}`}
              >
                <Image
                  src={scene.imageUrl}
                  alt={scene.alt}
                  fill
                  sizes="(min-width: 1024px) 11rem, 44vw"
                  className="object-cover transition-transform duration-700 ease-out group-hover:scale-105 motion-reduce:transition-none"
                />
                <div className={`absolute inset-0 bg-gradient-to-t from-primary/90 via-primary/10 to-transparent transition-opacity duration-300 ${isSelected ? "opacity-100" : "opacity-80 group-hover:opacity-100"}`} />
                <span className="absolute bottom-3 left-3 right-3 text-sm font-medium leading-tight text-background">{scene.title}</span>
              </motion.button>
            );
          })}
        </div>
      </fieldset>

      <form className="relative mt-5 grid gap-3" onSubmit={generateCaption}>
        <label className="grid gap-2 text-sm font-medium text-foreground" htmlFor="caption-prompt">
          The scene
          <textarea
            id="caption-prompt"
            value={prompt}
            onChange={(event) => setPrompt(event.target.value)}
            maxLength={MAX_PROMPT_LENGTH}
            required
            rows={3}
            aria-describedby="prompt-helper"
            placeholder="The 1 train pauses at 125th, and everyone suddenly becomes a train engineer."
            className="min-h-28 resize-y rounded-xl border border-border bg-background px-3 py-3 text-base font-normal leading-relaxed text-foreground outline-none transition-colors duration-200 placeholder:text-secondary/70 focus:border-accent focus:ring-2 focus:ring-accent/20"
          />
        </label>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p id="prompt-helper" className="text-xs text-secondary">{prompt.length}/{MAX_PROMPT_LENGTH} characters</p>
          <motion.button
            type="submit"
            disabled={isPending}
            whileTap={shouldReduceMotion ? undefined : { scale: 0.97 }}
            className="inline-flex min-h-11 cursor-pointer items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-medium text-background transition-transform duration-200 hover:-translate-y-0.5 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isPending ? <LoaderCircle className="size-4 animate-spin motion-reduce:animate-none" aria-hidden /> : <Sparkles className="size-4" aria-hidden />}
            {isPending ? "Writing and saving" : "Generate caption"}
          </motion.button>
        </div>
        <AnimatePresence initial={false} mode="wait">
          {message ? (
            <motion.p
              key={message}
              initial={shouldReduceMotion ? false : { opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={shouldReduceMotion ? undefined : { opacity: 0, y: -6 }}
              transition={{ duration: 0.2 }}
              className="min-h-5 text-sm text-secondary"
              aria-live="polite"
            >
              {message}
            </motion.p>
          ) : <p className="min-h-5 text-sm text-secondary" aria-live="polite" />}
        </AnimatePresence>
      </form>
    </section>
  );
}
