"use client";

import { motion, useReducedMotion } from "motion/react";
import { RatingControls, type VoteTotal } from "./rating-controls";

export type Caption = {
  id: number;
  text: string;
  prompt: string | null;
  author_id: string | null;
  generation_model: string | null;
  created_at: string;
};

type CaptionListProps = {
  captions: Caption[];
  userId: string | null;
  initialVotes: Record<number, -1 | 1>;
  initialTotals: Record<number, VoteTotal>;
};

const listTransition = {
  duration: 0.28,
  ease: [0.16, 1, 0.3, 1] as const,
};

export function CaptionList({
  captions,
  userId,
  initialVotes,
  initialTotals,
}: CaptionListProps) {
  const shouldReduceMotion = useReducedMotion();

  if (captions.length === 0) {
    return (
      <p className="rounded-2xl border border-border bg-background px-5 py-8 text-secondary">
        There are no captions here yet.
      </p>
    );
  }

  return (
    <ol className="grid gap-3" aria-label="Caption list">
      {captions.map((caption, index) => (
        <motion.li
          key={caption.id}
          initial={shouldReduceMotion ? false : { opacity: 0, y: 12 }}
          animate={shouldReduceMotion ? undefined : { opacity: 1, y: 0 }}
          transition={
            shouldReduceMotion
              ? undefined
              : { ...listTransition, delay: Math.min(index * 0.028, 0.35) }
          }
          className="caption-card group relative grid min-h-32 grid-cols-[auto_1fr] gap-4 overflow-hidden rounded-2xl border border-border bg-background p-5 shadow-sm sm:p-6"
        >
          <span
            aria-hidden
            className="flex size-8 items-center justify-center rounded-full bg-primary font-mono text-xs font-medium text-background"
          >
            {String(index + 1).padStart(2, "0")}
          </span>
          <p className="max-w-2xl self-center text-lg leading-relaxed font-medium text-foreground sm:text-xl">
            {caption.text}
          </p>
          <div className="col-span-full ml-0 sm:col-start-2">
            {caption.prompt ? (
              <details className="group/prompt mt-1 text-sm text-secondary">
                <summary className="w-fit cursor-pointer list-none rounded-md font-mono text-xs uppercase tracking-[0.13em] text-secondary transition-colors duration-200 hover:text-accent focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent">
                  <span className="group-open/prompt:hidden">Show prompt</span>
                  <span className="hidden group-open/prompt:inline">Hide prompt</span>
                </summary>
                <p className="mt-2 max-w-2xl rounded-xl bg-muted/60 px-3 py-2 leading-relaxed">
                  {caption.prompt}
                </p>
              </details>
            ) : (
              <p className="mt-1 font-mono text-xs uppercase tracking-[0.13em] text-secondary">
                Seed caption
              </p>
            )}
            <RatingControls
              captionId={caption.id}
              userId={userId}
              initialVote={initialVotes[caption.id] ?? null}
              initialTotals={initialTotals[caption.id] ?? { upvotes: 0, downvotes: 0, score: 0 }}
            />
          </div>
        </motion.li>
      ))}
    </ol>
  );
}
