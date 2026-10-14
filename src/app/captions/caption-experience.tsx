"use client";

import { useState } from "react";
import { AuthButton } from "@/components/auth-button";
import { CaptionGenerator, type SavedDraft } from "./caption-generator";
import { CaptionList, type Caption, type CaptionDraft } from "./caption-list";
import type { VoteTotal } from "./rating-controls";

type CaptionExperienceProps = {
  captions: Caption[];
  userId: string | null;
  initialVotes: Record<number, -1 | 1>;
  initialTotals: Record<number, VoteTotal>;
  drafts: CaptionDraft[];
};

function asCaptionDraft(draft: SavedDraft): CaptionDraft {
  return draft;
}

export function CaptionExperience({ captions, userId, initialVotes, initialTotals, drafts }: CaptionExperienceProps) {
  const [draftItems, setDraftItems] = useState(drafts);

  function upsertDraft(draft: SavedDraft) {
    const nextDraft = asCaptionDraft(draft);
    setDraftItems((current) => [nextDraft, ...current.filter((item) => item.id !== nextDraft.id)]);
  }

  function removeDraft(draftId: string) {
    setDraftItems((current) => current.filter((draft) => draft.id !== draftId));
  }

  return (
    <>
      <section className="py-14 sm:py-20" aria-labelledby="caption-list-heading">
        <CaptionList
          captions={captions}
          userId={userId}
          initialVotes={initialVotes}
          initialTotals={initialTotals}
          drafts={draftItems}
          onDraftDeleted={removeDraft}
        />
      </section>

      <section id="make-a-caption" className="scroll-mt-28 border-t border-border py-14 sm:py-20" aria-labelledby="generation-heading">
        {userId ? (
          <CaptionGenerator onDraftSaved={upsertDraft} onDraftUpdated={upsertDraft} onDraftDeleted={removeDraft} />
        ) : (
          <div className="relative overflow-hidden rounded-[2rem] border border-border bg-muted/40 p-6 sm:flex sm:items-center sm:justify-between sm:gap-8 sm:p-8">
            <div aria-hidden className="absolute -bottom-20 -right-12 size-56 rounded-full bg-accent/10 blur-3xl" />
            <div className="relative">
              <h2 id="generation-heading" className="font-editorial text-3xl font-medium tracking-tight text-primary">
                Make a caption, then leave your mark on the feed.
              </h2>
              <p className="mt-3 max-w-xl text-base leading-relaxed text-secondary">
                Anyone can browse. Sign in to upload a photo, make an AI caption, and rate the posts that make the cut.
              </p>
            </div>
            <div className="relative mt-5 sm:mt-0">
              <AuthButton signInLabel="Sign in to contribute" />
            </div>
          </div>
        )}
      </section>
    </>
  );
}
