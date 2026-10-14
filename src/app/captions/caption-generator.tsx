"use client";

import { Check, ImagePlus, LoaderCircle, RefreshCw, Sparkles, UploadCloud, WandSparkles, X } from "lucide-react";
import { AnimatePresence, LayoutGroup, motion, useReducedMotion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { getStarterGif, STARTER_GIFS } from "@/lib/starter-gifs";

const MAX_PROMPT_LENGTH = 280;
const MAX_IMAGE_BYTES = 4 * 1024 * 1024;

type JobState = "idle" | "generating" | "saving" | "ready" | "publishing" | "deleted";
type DraftResolution = { id: string; status: "deleted" | "published" } | null;

export type SavedDraft = {
  id: string;
  text: string;
  prompt: string | null;
  media_source: "upload" | "starter-gif";
  media_url: string | null;
  media_alt: string;
  created_at: string;
};

type Draft = {
  id: string;
  caption: string;
  generationModel: string;
};

type CaptionGeneratorProps = {
  onDraftSaved: (draft: SavedDraft) => void;
  onDraftUpdated: (draft: SavedDraft) => void;
  onDraftDeleted: (draftId: string) => void;
  externallyResolvedDraft: DraftResolution;
};

function isAcceptedImage(file: File) {
  return ["image/jpeg", "image/png", "image/webp"].includes(file.type) && file.size <= MAX_IMAGE_BYTES;
}

export function CaptionGenerator({ onDraftSaved, onDraftUpdated, onDraftDeleted, externallyResolvedDraft }: CaptionGeneratorProps) {
  const router = useRouter();
  const shouldReduceMotion = useReducedMotion();
  const inputRef = useRef<HTMLInputElement>(null);
  const previewUrlRef = useRef<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [starterGifId, setStarterGifId] = useState<string | null>(null);
  const [prompt, setPrompt] = useState("");
  const [draft, setDraft] = useState<Draft | null>(null);
  const [editableCaption, setEditableCaption] = useState("");
  const [jobState, setJobState] = useState<JobState>("idle");
  const [isReviewOpen, setIsReviewOpen] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    return () => {
      if (previewUrlRef.current) URL.revokeObjectURL(previewUrlRef.current);
    };
  }, []);

  function chooseFile(nextFile: File | null) {
    if (!nextFile) return;
    if (!isAcceptedImage(nextFile)) {
      setMessage("Use a JPG, PNG, or WebP image that is 4 MB or smaller.");
      return;
    }
    if (previewUrlRef.current) URL.revokeObjectURL(previewUrlRef.current);
    const nextPreviewUrl = URL.createObjectURL(nextFile);
    previewUrlRef.current = nextPreviewUrl;
    setPreviewUrl(nextPreviewUrl);
    setFile(nextFile);
    setStarterGifId(null);
    setMessage(null);
  }

  function clearFile() {
    if (previewUrlRef.current) URL.revokeObjectURL(previewUrlRef.current);
    previewUrlRef.current = null;
    setFile(null);
    setPreviewUrl(null);
    setStarterGifId(null);
    if (inputRef.current) inputRef.current.value = "";
  }

  function chooseStarterGif(id: string) {
    if (previewUrlRef.current) URL.revokeObjectURL(previewUrlRef.current);
    previewUrlRef.current = null;
    setPreviewUrl(null);
    setFile(null);
    if (inputRef.current) inputRef.current.value = "";
    setStarterGifId((current) => current === id ? null : id);
    setMessage(null);
  }

  function resetDraft() {
    setDraft(null);
    setEditableCaption("");
    setJobState("idle");
    setIsReviewOpen(false);
    clearFile();
    setPrompt("");
    setMessage(null);
  }

  async function discardDraft() {
    const draftId = draft?.id;
    if (!draftId) return resetDraft();
    const response = await fetch("/api/delete-draft", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ draftId }),
    });
    if (!response.ok) {
      setMessage("Your draft could not be discarded. Try again.");
      return;
    }
    onDraftDeleted(draftId);
    resetDraft();
  }

  function generateCaption(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const starterGif = getStarterGif(starterGifId);
    if (!file && !starterGif) {
      setMessage("Choose a starter GIF or add an image before asking for a caption.");
      return;
    }

    // This state update intentionally stays outside a transition. The status card is
    // feedback for the click itself, so it needs to render before the network request.
    setMessage(null);
    setJobState("generating");

    void (async () => {
      const formData = new FormData();
      if (file) formData.set("image", file);
      if (starterGif) formData.set("starterGifId", starterGif.id);
      formData.set("prompt", prompt.trim());

      const response = await fetch("/api/generate-caption", { method: "POST", body: formData });
      const result = (await response.json().catch(() => null)) as { caption?: string; generationModel?: string; error?: string } | null;
      if (!response.ok || !result?.caption) {
        setJobState("idle");
        setMessage(result?.error ?? "Caption generation did not finish. Try again.");
        return;
      }
      setJobState("saving");
      const saveFormData = new FormData();
      if (file) saveFormData.set("image", file);
      if (starterGif) saveFormData.set("starterGifId", starterGif.id);
      saveFormData.set("caption", result.caption);
      saveFormData.set("prompt", prompt.trim());

      const saveResponse = await fetch("/api/save-draft", { method: "POST", body: saveFormData });
      const saved = (await saveResponse.json().catch(() => null)) as { draft?: SavedDraft; error?: string } | null;
      if (!saveResponse.ok || !saved?.draft?.id) {
        setJobState("idle");
        setMessage(saved?.error ?? "Your caption was generated, but the draft could not be saved. Try again.");
        return;
      }
      setDraft({ id: saved.draft.id, caption: result.caption, generationModel: result.generationModel ?? "Gemini" });
      setEditableCaption(result.caption);
      onDraftSaved(saved.draft);
      setJobState("ready");
    })();
  }

  function publishCaption() {
    if (!draft) return;
    setMessage(null);
    setJobState("publishing");

    void (async () => {
      const response = await fetch("/api/publish-draft", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ draftId: draft.id }),
      });
      const result = (await response.json().catch(() => null)) as { error?: string } | null;
      if (!response.ok) {
        setJobState("ready");
        setMessage(result?.error ?? "Your post could not be published. Try again.");
        return;
      }
      onDraftDeleted(draft.id);
      resetDraft();
      setMessage("Published. Your post is now in the feed.");
      router.refresh();
    })();
  }

  const selectedStarterGif = getStarterGif(starterGifId);
  const selectedMediaUrl = previewUrl ?? selectedStarterGif?.url ?? null;
  const isWorking = jobState === "generating" || jobState === "saving" || jobState === "publishing";
  const isDraftResolvedExternally = Boolean(draft && externallyResolvedDraft?.id === draft.id);
  const displayJobState: JobState = isDraftResolvedExternally ? "deleted" : jobState;
  const deletedDraftMessage = externallyResolvedDraft?.status === "published"
    ? "This draft was published from My captions."
    : "This draft was deleted from My captions and can no longer be reviewed or published.";

  async function saveDraftEdits() {
    if (!draft || !editableCaption.trim() || editableCaption.trim() === draft.caption) return;
    setJobState("saving");
    const response = await fetch("/api/update-draft", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ draftId: draft.id, caption: editableCaption }),
    });
    const result = (await response.json().catch(() => null)) as { draft?: SavedDraft; error?: string } | null;
    if (!response.ok || !result?.draft) {
      setJobState("ready");
      setMessage(result?.error ?? "Your draft could not be updated. Try again.");
      return;
    }
    setDraft((current) => current ? { ...current, caption: result.draft!.text } : current);
    onDraftUpdated(result.draft);
    setJobState("ready");
    setMessage("Saved to your private draft.");
  }

  async function retryCaption() {
    if (!draft) return;
    setMessage("Writing another take with the same image and context…");
    setJobState("generating");
    const response = await fetch("/api/retry-draft", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ draftId: draft.id }),
    });
    const result = (await response.json().catch(() => null)) as { draft?: SavedDraft; generationModel?: string; error?: string } | null;
    if (!response.ok || !result?.draft) {
      setJobState("ready");
      setMessage(result?.error ?? "A new caption could not be made. Try again.");
      return;
    }
    setDraft({ id: result.draft.id, caption: result.draft.text, generationModel: result.generationModel ?? "Gemini" });
    setEditableCaption(result.draft.text);
    onDraftUpdated(result.draft);
    setJobState("ready");
    setMessage("A new caption is ready to review.");
  }

  return (
    <LayoutGroup>
      <AnimatePresence mode="wait" initial={false}>
        {jobState === "idle" ? (
          <motion.section
            key="composer"
            initial={shouldReduceMotion ? false : { opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={shouldReduceMotion ? undefined : { opacity: 0, y: -10, scale: 0.98 }}
            transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
            className="relative overflow-hidden rounded-[2rem] border border-border bg-background/85 p-5 shadow-sm backdrop-blur sm:p-8"
            aria-labelledby="generate-caption-heading"
          >
            <div aria-hidden className="absolute -right-14 -top-16 size-44 rounded-full bg-accent/10 blur-3xl" />
            <div className="relative flex items-start gap-3">
              <div className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-accent text-background shadow-lg shadow-accent/20">
                <WandSparkles className="size-5" aria-hidden />
              </div>
              <div>
                <h2 id="generate-caption-heading" className="font-editorial text-3xl font-medium tracking-tight text-primary">Make the image the post.</h2>
                <p className="mt-2 max-w-2xl text-base leading-relaxed text-secondary">Pick a photo. Give Gemini any context it cannot see. You review the line before it enters the feed.</p>
              </div>
            </div>

            <form className="relative mt-7 grid gap-5" onSubmit={generateCaption}>
              <div>
                <p className="text-sm font-medium text-foreground">Start with a reaction</p>
                <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4" aria-label="Popular reaction GIFs">
                  {STARTER_GIFS.map((gif) => {
                    const isSelected = starterGifId === gif.id;
                    return (
                      <motion.button
                        key={gif.id}
                        type="button"
                        aria-pressed={isSelected}
                        onClick={() => chooseStarterGif(gif.id)}
                        whileTap={shouldReduceMotion ? undefined : { scale: 0.97 }}
                        className={`group relative aspect-square cursor-pointer overflow-hidden rounded-2xl border text-left transition-colors duration-200 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent ${isSelected ? "border-accent ring-2 ring-accent/30" : "border-border hover:border-accent/60"}`}
                      >
                        {/* GIPHY-hosted reaction GIF chosen by the creator. */}
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={gif.url} alt={gif.alt} className="size-full object-cover transition-transform duration-500 group-hover:scale-105 motion-reduce:transition-none" />
                        <span className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-primary/85 to-transparent px-2 pb-2 pt-7 text-xs font-medium text-background">{gif.title}</span>
                        {isSelected ? <span className="absolute right-2 top-2 inline-flex size-6 items-center justify-center rounded-full bg-accent text-background"><Check className="size-3.5" aria-hidden /></span> : null}
                      </motion.button>
                    );
                  })}
                </div>
                <p className="mt-3 text-xs leading-relaxed text-secondary">Selected reaction GIFs are provided by GIPHY. Or upload your own image below.</p>
              </div>

              <div>
                <label htmlFor="caption-image" className="text-sm font-medium text-foreground">Your image</label>
                <input
                  ref={inputRef}
                  id="caption-image"
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={(event) => chooseFile(event.target.files?.[0] ?? null)}
                  className="sr-only"
                />
                {selectedMediaUrl ? (
                  <motion.div layoutId="caption-upload-preview" className="mt-3 overflow-hidden rounded-2xl border border-border bg-muted sm:max-w-md">
                    {/* A browser object URL cannot be optimized by next/image. */}
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={selectedMediaUrl} alt={selectedStarterGif?.alt ?? "Selected upload preview"} className="aspect-[4/3] w-full object-cover" />
                    <div className="flex items-center justify-between gap-3 p-3">
                      <p className="truncate text-sm text-secondary">{selectedStarterGif?.title ?? file?.name}</p>
                      <button type="button" onClick={clearFile} className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-xl text-secondary transition-colors hover:bg-background hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent" aria-label="Remove selected image"><X className="size-4" aria-hidden /></button>
                    </div>
                  </motion.div>
                ) : (
                  <label htmlFor="caption-image" className="mt-3 flex min-h-40 cursor-pointer flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-muted/40 px-5 text-center transition-colors hover:border-accent hover:bg-accent/5 focus-within:outline-2 focus-within:outline-offset-4 focus-within:outline-accent">
                    <ImagePlus className="size-6 text-accent" aria-hidden />
                    <span className="mt-3 text-sm font-medium text-foreground">Choose a photo</span>
                    <span className="mt-1 text-xs text-secondary">JPG, PNG, or WebP · up to 4 MB</span>
                  </label>
                )}
              </div>

              <label className="grid gap-2 text-sm font-medium text-foreground" htmlFor="caption-prompt">
                Context Gemini must use
                <textarea
                  id="caption-prompt"
                  value={prompt}
                  onChange={(event) => setPrompt(event.target.value)}
                  maxLength={MAX_PROMPT_LENGTH}
                  rows={3}
                  placeholder="Add the one detail the caption has to use, like where it happened or why the group chat is involved."
                  className="min-h-28 resize-y rounded-xl border border-border bg-background px-3 py-3 text-base font-normal leading-relaxed text-foreground outline-none transition-colors duration-200 placeholder:text-secondary/70 focus:border-accent focus:ring-2 focus:ring-accent/20"
                />
                <span className="text-xs font-normal text-secondary">{prompt.length}/{MAX_PROMPT_LENGTH} characters. Gemini will work this into the caption.</span>
              </label>

              <div className="flex flex-wrap items-center justify-between gap-3">
                <p className="min-h-5 text-sm text-secondary" aria-live="polite">{message}</p>
                <motion.button type="submit" disabled={!selectedMediaUrl || isWorking} whileTap={shouldReduceMotion ? undefined : { scale: 0.97 }} className="inline-flex min-h-11 cursor-pointer items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-medium text-background transition-transform duration-200 hover:-translate-y-0.5 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent disabled:cursor-not-allowed disabled:opacity-60">
                  <Sparkles className="size-4" aria-hidden /> Generate a draft
                </motion.button>
              </div>
            </form>
          </motion.section>
        ) : null}
      </AnimatePresence>

      <AnimatePresence initial={false}>
        {jobState !== "idle" && selectedMediaUrl ? (
          <motion.aside
            key="caption-job"
            initial={shouldReduceMotion ? false : { opacity: 0, y: 52, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={shouldReduceMotion ? undefined : { opacity: 0, y: 36, scale: 0.92 }}
            transition={{ type: "spring", stiffness: 360, damping: 30, mass: 0.72 }}
            className={`fixed bottom-5 right-5 z-50 w-[min(25rem,calc(100vw-2.5rem))] overflow-hidden rounded-[1.6rem] border border-border bg-background shadow-2xl shadow-primary/20 transition-opacity duration-200 ${displayJobState === "deleted" ? "opacity-65" : "opacity-100"}`}
            aria-live="polite"
          >
            <div className="flex gap-3 p-3">
              <motion.div layoutId="caption-upload-preview" className="size-20 shrink-0 overflow-hidden rounded-xl bg-muted">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={selectedMediaUrl} alt={selectedStarterGif?.alt ?? "Selected upload"} className="size-full object-cover" />
              </motion.div>
              <div className="min-w-0 flex-1 py-1">
                {displayJobState === "generating" || displayJobState === "saving" || displayJobState === "publishing" ? <LoaderCircle className="size-5 animate-spin text-accent motion-reduce:animate-none" aria-hidden /> : displayJobState === "deleted" ? <X className="size-5 text-secondary" aria-hidden /> : <Check className="size-5 text-emerald-600" aria-hidden />}
                <p className="mt-2 text-sm font-medium text-foreground">{displayJobState === "generating" ? "Your caption is being generated" : displayJobState === "saving" ? "Saving your private draft" : displayJobState === "publishing" ? "Publishing your post" : displayJobState === "deleted" ? "Draft deleted" : "Caption ready to review"}</p>
                <p className="mt-1 text-xs leading-relaxed text-secondary">{displayJobState === "ready" ? "Saved under My captions. Nothing is public until you publish it." : displayJobState === "deleted" ? `${deletedDraftMessage} You can dismiss this notice.` : "You can keep browsing while this finishes."}</p>
              </div>
              {displayJobState === "ready" ? <button type="button" onClick={() => void discardDraft()} className="inline-flex size-9 shrink-0 items-center justify-center rounded-lg text-secondary hover:bg-muted hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent" aria-label="Discard draft"><X className="size-4" aria-hidden /></button> : null}
              {displayJobState === "deleted" ? <button type="button" onClick={resetDraft} className="inline-flex size-9 shrink-0 items-center justify-center rounded-lg text-secondary hover:bg-muted hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent" aria-label="Dismiss deleted draft notice"><X className="size-4" aria-hidden /></button> : null}
            </div>
            {displayJobState === "ready" ? <div className="border-t border-border p-3"><button type="button" onClick={() => setIsReviewOpen(true)} className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 text-sm font-medium text-background transition-transform hover:-translate-y-0.5 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent"><UploadCloud className="size-4" aria-hidden />Review caption</button></div> : null}
          </motion.aside>
        ) : null}
      </AnimatePresence>

      <AnimatePresence>
        {isReviewOpen && draft && selectedMediaUrl && !isDraftResolvedExternally ? (
          <motion.div initial={shouldReduceMotion ? false : { opacity: 0 }} animate={{ opacity: 1 }} exit={shouldReduceMotion ? undefined : { opacity: 0 }} className="fixed inset-0 z-[60] grid place-items-end bg-primary/30 p-4 backdrop-blur-sm sm:place-items-center" role="dialog" aria-modal="true" aria-labelledby="review-caption-heading">
            <motion.div initial={shouldReduceMotion ? false : { opacity: 0, y: 18, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={shouldReduceMotion ? undefined : { opacity: 0, y: 12, scale: 0.98 }} transition={{ type: "spring", stiffness: 380, damping: 32 }} className="w-full max-w-xl overflow-hidden rounded-[1.75rem] border border-border bg-background shadow-2xl">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={selectedMediaUrl} alt={selectedStarterGif?.alt ?? "Upload being reviewed"} className="aspect-[4/3] w-full object-cover" />
              <div className="p-5 sm:p-7"><div className="flex items-start justify-between gap-4"><div><p className="text-sm font-medium text-accent">AI draft</p><h3 id="review-caption-heading" className="mt-1 font-editorial text-3xl font-medium tracking-tight text-primary">Review before it goes live.</h3></div><button type="button" onClick={() => setIsReviewOpen(false)} className="inline-flex size-11 items-center justify-center rounded-xl text-secondary hover:bg-muted hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent" aria-label="Close review"><X className="size-5" aria-hidden /></button></div><label className="mt-6 grid gap-2 text-sm font-medium text-foreground" htmlFor="draft-caption-edit">Tweak the line<textarea id="draft-caption-edit" value={editableCaption} onChange={(event) => setEditableCaption(event.target.value)} maxLength={220} rows={3} className="min-h-28 resize-y rounded-xl border border-border bg-background px-3 py-3 font-editorial text-xl font-medium leading-snug tracking-tight text-foreground outline-none transition-colors duration-200 focus:border-accent focus:ring-2 focus:ring-accent/20" /></label><p className="mt-3 text-sm text-secondary">Generated with {draft.generationModel}. This private draft is saved under My captions until you publish.</p>{message ? <p className="mt-3 text-sm font-medium text-secondary" role="status">{message}</p> : null}<div className="mt-7 flex flex-wrap justify-end gap-3"><button type="button" onClick={() => void retryCaption()} disabled={isWorking} className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-border px-4 text-sm font-medium text-foreground transition-colors hover:border-accent focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent disabled:cursor-not-allowed disabled:opacity-60">{jobState === "generating" ? <LoaderCircle className="size-4 animate-spin motion-reduce:animate-none" aria-hidden /> : <RefreshCw className="size-4" aria-hidden />}Retry caption</button><button type="button" onClick={() => void saveDraftEdits()} disabled={isWorking || editableCaption.trim() === draft.caption || !editableCaption.trim()} className="inline-flex min-h-11 items-center rounded-xl border border-border px-4 text-sm font-medium text-foreground transition-colors hover:border-accent focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent disabled:cursor-not-allowed disabled:opacity-60">Save to draft</button><button type="button" onClick={publishCaption} disabled={isWorking || editableCaption.trim() !== draft.caption} className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-primary px-4 text-sm font-medium text-background transition-transform hover:-translate-y-0.5 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent disabled:opacity-60">{isWorking ? <LoaderCircle className="size-4 animate-spin motion-reduce:animate-none" aria-hidden /> : <UploadCloud className="size-4" aria-hidden />}Publish to the feed</button></div></div>
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </LayoutGroup>
  );
}
