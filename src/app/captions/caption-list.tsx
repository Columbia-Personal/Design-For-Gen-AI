"use client";

import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import {
  ArrowLeft,
  ArrowRight,
  ChevronDown,
  CircleGauge,
  ListFilter,
  Sparkles,
} from "lucide-react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useMemo, useRef, useState } from "react";
import { RatingControls, type VoteTotal } from "./rating-controls";

gsap.registerPlugin(ScrollTrigger);

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

type SortMode = "fresh" | "loved" | "side-quest";
type FilterMode = "all" | "made-here" | "starting-set" | "mine";

const sortOptions: Array<{ id: SortMode; label: string; description: string }> = [
  { id: "fresh", label: "Fresh first", description: "What just landed" },
  { id: "loved", label: "Most loved", description: "The room is keeping these" },
  { id: "side-quest", label: "Side quest", description: "A detour through the feed" },
];

const filterOptions: Array<{ id: FilterMode; label: string }> = [
  { id: "all", label: "Everything" },
  { id: "made-here", label: "Made here" },
  { id: "starting-set", label: "Starting set" },
  { id: "mine", label: "My captions" },
];

function captionScore(caption: Caption, totals: Record<number, VoteTotal>) {
  return totals[caption.id]?.score ?? 0;
}

function sideQuestRank(caption: Caption) {
  return (caption.id * 37 + caption.text.length * 11) % 101;
}

function CaptionPrompt({ prompt }: { prompt: string }) {
  const shouldReduceMotion = useReducedMotion();
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="mt-4">
      <button
        type="button"
        aria-expanded={isOpen}
        onClick={() => setIsOpen((value) => !value)}
        className="inline-flex min-h-11 cursor-pointer items-center gap-2 rounded-lg px-2 text-sm font-medium text-secondary transition-colors duration-200 hover:bg-muted/70 hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent"
      >
        {isOpen ? "Hide prompt" : "Show prompt"}
        <motion.span animate={{ rotate: isOpen ? 180 : 0 }} transition={{ duration: 0.2 }}>
          <ChevronDown className="size-4" aria-hidden />
        </motion.span>
      </button>
      <AnimatePresence initial={false}>
        {isOpen ? (
          <motion.div
            initial={shouldReduceMotion ? false : { opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={shouldReduceMotion ? undefined : { opacity: 0, y: -6 }}
            transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
            className="overflow-hidden"
          >
            <p className="mt-2 max-w-2xl rounded-2xl border border-border bg-muted/50 px-4 py-3 text-sm leading-relaxed text-secondary">
              {prompt}
            </p>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}

export function CaptionList({
  captions,
  userId,
  initialVotes,
  initialTotals,
}: CaptionListProps) {
  const shouldReduceMotion = useReducedMotion();
  const scope = useRef<HTMLDivElement>(null);
  const [sort, setSort] = useState<SortMode>("fresh");
  const [filter, setFilter] = useState<FilterMode>("all");
  const [visibleCount, setVisibleCount] = useState(6);
  const [spotlightIndex, setSpotlightIndex] = useState(0);
  const [voteTotals, setVoteTotals] = useState(initialTotals);

  const generatedCount = captions.filter((caption) => caption.prompt).length;
  const totalVotes = Object.values(voteTotals).reduce(
    (sum, total) => sum + total.upvotes + total.downvotes,
    0,
  );

  const spotlightCaptions = useMemo(
    () =>
      [...captions]
        .sort((a, b) => captionScore(b, voteTotals) - captionScore(a, voteTotals))
        .slice(0, Math.min(captions.length, 4)),
    [captions, voteTotals],
  );
  const spotlight = spotlightCaptions[spotlightIndex % Math.max(spotlightCaptions.length, 1)];

  const filteredCaptions = useMemo(() => {
    const matching = captions.filter((caption) => {
      if (filter === "made-here") return Boolean(caption.prompt);
      if (filter === "starting-set") return !caption.prompt;
      if (filter === "mine") return Boolean(userId && caption.author_id === userId);
      return true;
    });

    return matching.sort((a, b) => {
      if (sort === "loved") {
        return captionScore(b, voteTotals) - captionScore(a, voteTotals)
          || b.created_at.localeCompare(a.created_at);
      }
      if (sort === "side-quest") {
        return sideQuestRank(a) - sideQuestRank(b);
      }
      return b.created_at.localeCompare(a.created_at);
    });
  }, [captions, filter, sort, userId, voteTotals]);

  const visibleCaptions = filteredCaptions.slice(0, visibleCount);
  const activeSort = sortOptions.find((option) => option.id === sort) ?? sortOptions[0];

  function chooseSort(nextSort: SortMode) {
    setSort(nextSort);
    setVisibleCount(6);
  }

  function chooseFilter(nextFilter: FilterMode) {
    setFilter(nextFilter);
    setVisibleCount(6);
  }

  function handleVoteSaved(captionId: number, totals: VoteTotal) {
    setVoteTotals((current) => ({ ...current, [captionId]: totals }));
  }

  useGSAP(
    () => {
      if (shouldReduceMotion) return;

      const root = scope.current;
      const feed = root?.querySelector<HTMLElement>("[data-feed-area]");
      const cards = root ? gsap.utils.toArray<HTMLElement>("[data-caption-card]", root) : [];
      const intro = root?.querySelector<HTMLElement>("[data-feed-intro]");
      if (!root || !feed || cards.length === 0) return;

      cards.forEach((card) => {
        gsap.fromTo(
          card,
          { opacity: 0, y: 16, scale: 0.985 },
          {
            opacity: 1,
            y: 0,
            scale: 1,
            duration: 0.42,
            ease: "power2.out",
            scrollTrigger: {
              trigger: card,
              start: "top 88%",
              toggleActions: "play none none reverse",
            },
          },
        );
      });

      if (intro) {
        gsap.to(intro, {
          opacity: 0.52,
          ease: "none",
          scrollTrigger: {
            trigger: feed,
            start: "top bottom",
            end: "top 28%",
            scrub: true,
          },
        });
      }

    },
    {
      scope,
      dependencies: [filter, shouldReduceMotion, sort, visibleCaptions.length],
    },
  );

  if (captions.length === 0) {
    return (
      <p className="rounded-2xl border border-border bg-background px-5 py-8 text-secondary">
        There are no captions here yet. Sign in and make the first one.
      </p>
    );
  }

  return (
    <div ref={scope} className="overflow-x-clip">
      <section className="border-y border-border py-8 sm:py-10" aria-label="Feed pulse">
        <div className="grid grid-flow-dense gap-3 lg:grid-cols-12">
          <div className="relative min-h-44 overflow-hidden rounded-[1.75rem] border border-border bg-primary p-5 text-background lg:col-span-4">
            <div className="absolute -right-12 -top-12 size-36 rounded-full border border-background/20" aria-hidden />
            <p className="max-w-xs text-sm leading-relaxed text-background/70">In rotation</p>
            <AnimatePresence initial={false} mode="wait">
              <motion.p
                key={spotlight?.id}
                initial={shouldReduceMotion ? false : { opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={shouldReduceMotion ? undefined : { opacity: 0, y: -10 }}
                transition={{ duration: 0.24, ease: [0.16, 1, 0.3, 1] }}
                className="mt-3 max-w-sm font-editorial text-xl leading-snug tracking-tight"
              >
                {spotlight?.text}
              </motion.p>
            </AnimatePresence>
            {spotlightCaptions.length > 1 ? (
              <div className="absolute bottom-4 right-4 flex gap-1">
                <button
                  type="button"
                  aria-label="Show previous featured caption"
                  onClick={() => setSpotlightIndex((index) => (index - 1 + spotlightCaptions.length) % spotlightCaptions.length)}
                  className="inline-flex min-h-11 min-w-11 cursor-pointer items-center justify-center rounded-full border border-background/25 text-background transition-colors duration-200 hover:bg-background/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-background"
                >
                  <ArrowLeft className="size-4" aria-hidden />
                </button>
                <button
                  type="button"
                  aria-label="Show next featured caption"
                  onClick={() => setSpotlightIndex((index) => (index + 1) % spotlightCaptions.length)}
                  className="inline-flex min-h-11 min-w-11 cursor-pointer items-center justify-center rounded-full border border-background/25 text-background transition-colors duration-200 hover:bg-background/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-background"
                >
                  <ArrowRight className="size-4" aria-hidden />
                </button>
              </div>
            ) : null}
          </div>

          <div className="flex min-h-44 flex-col justify-between rounded-[1.75rem] border border-border bg-background p-5 lg:col-span-4">
            <Sparkles className="size-5 text-accent" aria-hidden />
            <div>
              <p className="font-editorial text-4xl font-medium tracking-tight text-primary">{generatedCount}</p>
              <p className="mt-1 max-w-xs text-sm leading-relaxed text-secondary">
                captions started from a real prompt and kept it attached.
              </p>
            </div>
          </div>

          <div className="flex min-h-44 flex-col justify-between rounded-[1.75rem] border border-border bg-muted/50 p-5 lg:col-span-4">
            <CircleGauge className="size-5 text-accent" aria-hidden />
            <div>
              <p className="font-editorial text-4xl font-medium tracking-tight text-primary">{totalVotes}</p>
              <p className="mt-1 max-w-xs text-sm leading-relaxed text-secondary">
                votes have shaped what rises in the feed.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section data-feed-area className="mt-14 grid gap-8 lg:grid-cols-[15rem_minmax(0,1fr)] lg:gap-12" aria-labelledby="caption-list-heading">
        <aside data-feed-rail className="self-start rounded-[1.75rem] border border-border bg-background/80 p-5 shadow-sm backdrop-blur lg:sticky lg:top-28">
          <div data-feed-intro>
            <ListFilter className="size-5 text-accent" aria-hidden />
            <h2 id="caption-list-heading" className="mt-4 font-editorial text-3xl font-medium tracking-tight text-primary">
              Find the line worth keeping.
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-secondary">
              {activeSort.description}. Use the filters to take a different route through the same feed.
            </p>
          </div>

          <div className="mt-7 grid gap-2" aria-label="Caption sorting">
            {sortOptions.map((option) => {
              const isActive = option.id === sort;
              return (
                <motion.button
                  key={option.id}
                  type="button"
                  aria-pressed={isActive}
                  onClick={() => chooseSort(option.id)}
                  animate={{ flexGrow: isActive ? 1.15 : 1 }}
                  transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
                  className={`min-h-11 cursor-pointer overflow-hidden rounded-xl border px-3 py-2 text-left text-sm transition-colors duration-200 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent ${isActive ? "border-accent bg-accent text-background" : "border-border text-secondary hover:border-accent/50 hover:text-foreground"}`}
                >
                  <span className="block font-medium">{option.label}</span>
                  <AnimatePresence initial={false}>
                    {isActive ? (
                      <motion.span
                        initial={shouldReduceMotion ? false : { opacity: 0, x: -6 }}
                        animate={{ opacity: 0.8, x: 0 }}
                        exit={shouldReduceMotion ? undefined : { opacity: 0, x: -6 }}
                        transition={{ duration: 0.18 }}
                        className="mt-0.5 block text-xs"
                      >
                        {option.description}
                      </motion.span>
                    ) : null}
                  </AnimatePresence>
                </motion.button>
              );
            })}
          </div>

          <div className="mt-6 flex flex-wrap gap-2" aria-label="Caption filters">
            {filterOptions.map((option) => {
              const isActive = option.id === filter;
              const unavailable = option.id === "mine" && !userId;
              return (
                <button
                  key={option.id}
                  type="button"
                  aria-pressed={isActive}
                  disabled={unavailable}
                  onClick={() => chooseFilter(option.id)}
                  className={`min-h-11 cursor-pointer rounded-full border px-3 py-2 text-xs font-medium transition-colors duration-200 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent disabled:cursor-not-allowed disabled:opacity-45 ${isActive ? "border-primary bg-primary text-background" : "border-border text-secondary hover:border-accent/50 hover:text-foreground"}`}
                >
                  {option.label}
                </button>
              );
            })}
          </div>
        </aside>

        <div data-feed-stream>
          {visibleCaptions.length ? (
            <ol className="grid gap-3" aria-label="Caption list">
              <AnimatePresence initial={false} mode="popLayout">
                {visibleCaptions.map((caption, index) => {
                  const position = filteredCaptions.findIndex((item) => item.id === caption.id) + 1;
                  return (
                    <motion.li
                      layout="position"
                      key={caption.id}
                      data-caption-card
                      initial={shouldReduceMotion ? false : { opacity: 0, y: 14 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={shouldReduceMotion ? undefined : { opacity: 0, y: -10 }}
                      transition={{ duration: 0.24, ease: [0.16, 1, 0.3, 1] }}
                      style={{ zIndex: visibleCaptions.length - index }}
                      className={`caption-card relative grid min-h-40 grid-cols-[auto_1fr] gap-4 overflow-hidden rounded-[1.75rem] border border-border bg-background p-5 shadow-sm sm:p-7 ${index > 0 ? "lg:-mt-2" : ""}`}
                    >
                      <span
                        aria-hidden
                        className="flex size-9 items-center justify-center rounded-full bg-primary font-mono text-xs font-medium text-background"
                      >
                        {String(position).padStart(2, "0")}
                      </span>
                      <div>
                        <p className="max-w-2xl font-editorial text-2xl leading-snug tracking-tight text-foreground sm:text-3xl">
                          {caption.text}
                        </p>
                        {caption.prompt ? (
                          <CaptionPrompt prompt={caption.prompt} />
                        ) : (
                          <p className="mt-4 text-sm text-secondary">From the starting set</p>
                        )}
                        <RatingControls
                          captionId={caption.id}
                          userId={userId}
                          initialVote={initialVotes[caption.id] ?? null}
                          initialTotals={voteTotals[caption.id] ?? { upvotes: 0, downvotes: 0, score: 0 }}
                          onVoteSaved={handleVoteSaved}
                        />
                      </div>
                    </motion.li>
                  );
                })}
              </AnimatePresence>
            </ol>
          ) : (
            <div className="rounded-[1.75rem] border border-border bg-background p-6">
              <p className="font-editorial text-2xl font-medium tracking-tight text-primary">Nothing landed there.</p>
              <p className="mt-2 text-sm leading-relaxed text-secondary">Try a different filter to get back to the full feed.</p>
              <button
                type="button"
                onClick={() => chooseFilter("all")}
                className="mt-4 inline-flex min-h-11 cursor-pointer items-center rounded-xl bg-primary px-4 text-sm font-medium text-background transition-transform duration-200 hover:-translate-y-0.5 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent"
              >
                Show everything
              </button>
            </div>
          )}

          {visibleCount < filteredCaptions.length ? (
            <motion.button
              type="button"
              onClick={() => setVisibleCount((count) => Math.min(count + 6, filteredCaptions.length))}
              whileTap={shouldReduceMotion ? undefined : { scale: 0.98 }}
              className="mt-6 inline-flex min-h-11 cursor-pointer items-center justify-center rounded-xl border border-border bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors duration-200 hover:border-accent hover:text-accent focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent"
            >
              Show six more captions
            </motion.button>
          ) : (
            <p className="mt-6 text-sm text-secondary">That is the whole route for now.</p>
          )}
        </div>
      </section>
    </div>
  );
}
