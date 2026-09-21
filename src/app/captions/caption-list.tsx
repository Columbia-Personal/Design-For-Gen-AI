"use client";

import { motion, useReducedMotion } from "motion/react";

export type Caption = {
  id: number;
  text: string;
};

type CaptionListProps = {
  captions: Caption[];
};

const listTransition = {
  duration: 0.28,
  ease: [0.16, 1, 0.3, 1] as const,
};

export function CaptionList({ captions }: CaptionListProps) {
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
        </motion.li>
      ))}
    </ol>
  );
}
