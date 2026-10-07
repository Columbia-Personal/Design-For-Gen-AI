"use client";

import { LoaderCircle, ThumbsDown, ThumbsUp } from "lucide-react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useEffect, useState, useTransition } from "react";
import { createClient } from "@/lib/supabase/client";

export type VoteTotal = {
  upvotes: number;
  downvotes: number;
  score: number;
};

type RatingControlsProps = {
  captionId: number;
  userId: string | null;
  initialVote: -1 | 1 | null;
  initialTotals: VoteTotal;
  onVoteSaved?: (captionId: number, totals: VoteTotal) => void;
};

type VoteTotalRow = VoteTotal & { caption_id: number };

export function RatingControls({
  captionId,
  userId,
  initialVote,
  initialTotals,
  onVoteSaved,
}: RatingControlsProps) {
  const shouldReduceMotion = useReducedMotion();
  const [vote, setVote] = useState<-1 | 1 | null>(initialVote);
  const [totals, setTotals] = useState(initialTotals);
  const [message, setMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    if (!message) return;

    const timeout = window.setTimeout(() => setMessage(null), 3600);
    return () => window.clearTimeout(timeout);
  }, [message]);

  function submitVote(nextVote: -1 | 1) {
    if (!userId) {
      setMessage("Sign in from the top bar to rate this caption.");
      return;
    }

    startTransition(async () => {
      setMessage(null);
      const supabase = createClient();
      const { error } = await supabase.from("caption_votes").upsert(
        {
          caption_id: captionId,
          user_id: userId,
          value: nextVote,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "caption_id,user_id" },
      );

      if (error) {
        setMessage("Your vote did not save. Try again.");
        return;
      }

      setVote(nextVote);
      const { data } = await supabase.rpc("caption_vote_totals");
      const refreshed = (data as VoteTotalRow[] | null)?.find(
        (total) => total.caption_id === captionId,
      );

      if (refreshed) {
        const refreshedTotals = {
          upvotes: Number(refreshed.upvotes),
          downvotes: Number(refreshed.downvotes),
          score: Number(refreshed.score),
        };
        setTotals(refreshedTotals);
        onVoteSaved?.(captionId, refreshedTotals);
      }

      setMessage(nextVote === 1 ? "Upvote saved." : "Downvote saved.");
    });
  }

  return (
    <div className="mt-5 flex flex-wrap items-center gap-2 border-t border-border pt-4">
      <div className="flex items-center gap-2" aria-label={`Community score ${totals.score}`}>
        <motion.button
          type="button"
          aria-pressed={vote === 1}
          aria-label="Upvote this caption"
          disabled={isPending}
          onClick={() => submitVote(1)}
          whileTap={shouldReduceMotion ? undefined : { scale: 0.95 }}
          className={`inline-flex min-h-11 cursor-pointer items-center justify-center gap-2 rounded-xl border px-3 text-sm font-medium transition-colors duration-200 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent disabled:cursor-not-allowed disabled:opacity-60 ${vote === 1 ? "border-accent bg-accent/10 text-accent" : "border-border text-secondary hover:border-accent/50 hover:text-accent"}`}
        >
          <ThumbsUp className="size-4" aria-hidden />
          <span>{totals.upvotes}</span>
        </motion.button>
        <motion.button
          type="button"
          aria-pressed={vote === -1}
          aria-label="Downvote this caption"
          disabled={isPending}
          onClick={() => submitVote(-1)}
          whileTap={shouldReduceMotion ? undefined : { scale: 0.95 }}
          className={`inline-flex min-h-11 cursor-pointer items-center justify-center gap-2 rounded-xl border px-3 text-sm font-medium transition-colors duration-200 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent disabled:cursor-not-allowed disabled:opacity-60 ${vote === -1 ? "border-destructive/60 bg-destructive/10 text-destructive" : "border-border text-secondary hover:border-destructive/40 hover:text-destructive"}`}
        >
          <ThumbsDown className="size-4" aria-hidden />
          <span>{totals.downvotes}</span>
        </motion.button>
      </div>

      <div className="min-w-20 rounded-full bg-muted/65 px-3 py-2 text-center font-mono text-xs text-secondary" aria-live="polite">
        <AnimatePresence mode="popLayout" initial={false}>
          <motion.span
            key={totals.score}
            initial={shouldReduceMotion ? false : { opacity: 0, y: 6, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={shouldReduceMotion ? undefined : { opacity: 0, y: -6, scale: 0.96 }}
            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="inline-block"
          >
            {totals.score > 0 ? `+${totals.score}` : totals.score} score
          </motion.span>
        </AnimatePresence>
      </div>
      {isPending ? <LoaderCircle className="size-4 animate-spin text-secondary motion-reduce:animate-none" aria-label="Saving vote" /> : null}
      <p className="basis-full min-h-5 text-xs text-secondary" aria-live="polite">{message}</p>
    </div>
  );
}
