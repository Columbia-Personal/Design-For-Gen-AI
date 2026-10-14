"use client";

import { Check, ImagePlus, LoaderCircle, Sparkles, UploadCloud, WandSparkles, X } from "lucide-react";
import { AnimatePresence, LayoutGroup, motion, useReducedMotion } from "motion/react";
import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";

const MAX_PROMPT_LENGTH = 280;
const MAX_IMAGE_BYTES = 4 * 1024 * 1024;

export type DailyDetour = { id: number; title: string; prompt: string };

type JobState = "idle" | "generating" | "ready" | "publishing";

type Draft = {
  caption: string;
  generationModel: string;
};

type CaptionGeneratorProps = { dailyDetour: DailyDetour | null };

function isAcceptedImage(file: File) {
  return ["image/jpeg", "image/png", "image/webp"].includes(file.type) && file.size <= MAX_IMAGE_BYTES;
}

export function CaptionGenerator({ dailyDetour }: CaptionGeneratorProps) {
  const router = useRouter();
  const shouldReduceMotion = useReducedMotion();
  const inputRef = useRef<HTMLInputElement>(null);
  const previewUrlRef = useRef<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [prompt, setPrompt] = useState("");
  const [useDetour, setUseDetour] = useState(false);
  const [draft, setDraft] = useState<Draft | null>(null);
  const [jobState, setJobState] = useState<JobState>("idle");
  const [isReviewOpen, setIsReviewOpen] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

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
    setMessage(null);
  }

  function clearFile() {
    if (previewUrlRef.current) URL.revokeObjectURL(previewUrlRef.current);
    previewUrlRef.current = null;
    setFile(null);
    setPreviewUrl(null);
    if (inputRef.current) inputRef.current.value = "";
  }

  function resetDraft() {
    setDraft(null);
    setJobState("idle");
    setIsReviewOpen(false);
    clearFile();
    setPrompt("");
    setUseDetour(false);
    setMessage(null);
  }

  function generateCaption(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!file) {
      setMessage("Add an image before asking for a caption.");
      return;
    }

    startTransition(async () => {
      setMessage(null);
      setJobState("generating");
      const formData = new FormData();
      formData.set("image", file);
      formData.set("prompt", prompt.trim());
      if (useDetour && dailyDetour) formData.set("detour", dailyDetour.prompt);

      const response = await fetch("/api/generate-caption", { method: "POST", body: formData });
      const result = (await response.json().catch(() => null)) as { caption?: string; generationModel?: string; error?: string } | null;
      if (!response.ok || !result?.caption) {
        setJobState("idle");
        setMessage(result?.error ?? "Caption generation did not finish. Try again.");
        return;
      }
      setDraft({ caption: result.caption, generationModel: result.generationModel ?? "Gemini" });
      setJobState("ready");
    });
  }

  function publishCaption() {
    if (!file || !draft) return;
    startTransition(async () => {
      setMessage(null);
      setJobState("publishing");
      const formData = new FormData();
      formData.set("image", file);
      formData.set("caption", draft.caption);
      formData.set("prompt", prompt.trim());
      formData.set("mediaAlt", prompt.trim() || "Image uploaded for a Caption Lab post.");
      if (useDetour && dailyDetour) formData.set("challengeId", String(dailyDetour.id));

      const response = await fetch("/api/publish-caption", { method: "POST", body: formData });
      const result = (await response.json().catch(() => null)) as { error?: string } | null;
      if (!response.ok) {
        setJobState("ready");
        setMessage(result?.error ?? "Your post could not be published. Try again.");
        return;
      }
      resetDraft();
      setMessage("Published. Your post is now in the feed.");
      router.refresh();
    });
  }

  const isWorking = jobState === "generating" || jobState === "publishing" || isPending;

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
                <label htmlFor="caption-image" className="text-sm font-medium text-foreground">Your image</label>
                <input
                  ref={inputRef}
                  id="caption-image"
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={(event) => chooseFile(event.target.files?.[0] ?? null)}
                  className="sr-only"
                />
                {previewUrl ? (
                  <motion.div layoutId="caption-upload-preview" className="mt-3 overflow-hidden rounded-2xl border border-border bg-muted sm:max-w-md">
                    {/* A browser object URL cannot be optimized by next/image. */}
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={previewUrl} alt="Selected upload preview" className="aspect-[4/3] w-full object-cover" />
                    <div className="flex items-center justify-between gap-3 p-3">
                      <p className="truncate text-sm text-secondary">{file?.name}</p>
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
                Optional context
                <textarea
                  id="caption-prompt"
                  value={prompt}
                  onChange={(event) => setPrompt(event.target.value)}
                  maxLength={MAX_PROMPT_LENGTH}
                  rows={3}
                  placeholder="Anything the photo does not explain, like where it happened or why the group chat is involved."
                  className="min-h-28 resize-y rounded-xl border border-border bg-background px-3 py-3 text-base font-normal leading-relaxed text-foreground outline-none transition-colors duration-200 placeholder:text-secondary/70 focus:border-accent focus:ring-2 focus:ring-accent/20"
                />
                <span className="text-xs font-normal text-secondary">{prompt.length}/{MAX_PROMPT_LENGTH} characters</span>
              </label>

              {dailyDetour ? (
                <button
                  type="button"
                  aria-pressed={useDetour}
                  onClick={() => setUseDetour((value) => !value)}
                  className={`flex min-h-11 items-start gap-3 rounded-2xl border p-4 text-left transition-colors focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent ${useDetour ? "border-accent bg-accent/10" : "border-border hover:border-accent/50"}`}
                >
                  <span className={`mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full border ${useDetour ? "border-accent bg-accent text-background" : "border-secondary/40"}`}><Check className={`size-3 ${useDetour ? "opacity-100" : "opacity-0"}`} aria-hidden /></span>
                  <span><span className="block text-sm font-medium text-foreground">Daily Detour · {dailyDetour.title}</span><span className="mt-1 block text-sm leading-relaxed text-secondary">{dailyDetour.prompt}</span></span>
                </button>
              ) : null}

              <div className="flex flex-wrap items-center justify-between gap-3">
                <p className="min-h-5 text-sm text-secondary" aria-live="polite">{message}</p>
                <motion.button type="submit" disabled={!file || isWorking} whileTap={shouldReduceMotion ? undefined : { scale: 0.97 }} className="inline-flex min-h-11 cursor-pointer items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-medium text-background transition-transform duration-200 hover:-translate-y-0.5 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent disabled:cursor-not-allowed disabled:opacity-60">
                  <Sparkles className="size-4" aria-hidden /> Generate a draft
                </motion.button>
              </div>
            </form>
          </motion.section>
        ) : null}
      </AnimatePresence>

      <AnimatePresence initial={false}>
        {jobState !== "idle" && previewUrl ? (
          <motion.aside
            key="caption-job"
            initial={shouldReduceMotion ? false : { opacity: 0, y: 52, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={shouldReduceMotion ? undefined : { opacity: 0, y: 36, scale: 0.92 }}
            transition={{ type: "spring", stiffness: 360, damping: 30, mass: 0.72 }}
            className="fixed bottom-5 right-5 z-50 w-[min(25rem,calc(100vw-2.5rem))] overflow-hidden rounded-[1.6rem] border border-border bg-background shadow-2xl shadow-primary/20"
            aria-live="polite"
          >
            <div className="flex gap-3 p-3">
              <motion.div layoutId="caption-upload-preview" className="size-20 shrink-0 overflow-hidden rounded-xl bg-muted">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={previewUrl} alt="Selected upload" className="size-full object-cover" />
              </motion.div>
              <div className="min-w-0 flex-1 py-1">
                {jobState === "generating" || jobState === "publishing" ? <LoaderCircle className="size-5 animate-spin text-accent motion-reduce:animate-none" aria-hidden /> : <Check className="size-5 text-emerald-600" aria-hidden />}
                <p className="mt-2 text-sm font-medium text-foreground">{jobState === "generating" ? "Your caption is being generated" : jobState === "publishing" ? "Publishing your post" : "Caption ready to review"}</p>
                <p className="mt-1 text-xs leading-relaxed text-secondary">{jobState === "ready" ? "Nothing is public until you publish it." : "You can keep browsing while this finishes."}</p>
              </div>
              {jobState === "ready" ? <button type="button" onClick={resetDraft} className="inline-flex size-9 shrink-0 items-center justify-center rounded-lg text-secondary hover:bg-muted hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent" aria-label="Discard draft"><X className="size-4" aria-hidden /></button> : null}
            </div>
            {jobState === "ready" ? <div className="border-t border-border p-3"><button type="button" onClick={() => setIsReviewOpen(true)} className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 text-sm font-medium text-background transition-transform hover:-translate-y-0.5 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent"><UploadCloud className="size-4" aria-hidden />Review caption</button></div> : null}
          </motion.aside>
        ) : null}
      </AnimatePresence>

      <AnimatePresence>
        {isReviewOpen && draft && previewUrl ? (
          <motion.div initial={shouldReduceMotion ? false : { opacity: 0 }} animate={{ opacity: 1 }} exit={shouldReduceMotion ? undefined : { opacity: 0 }} className="fixed inset-0 z-[60] grid place-items-end bg-primary/30 p-4 backdrop-blur-sm sm:place-items-center" role="dialog" aria-modal="true" aria-labelledby="review-caption-heading">
            <motion.div initial={shouldReduceMotion ? false : { opacity: 0, y: 18, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={shouldReduceMotion ? undefined : { opacity: 0, y: 12, scale: 0.98 }} transition={{ type: "spring", stiffness: 380, damping: 32 }} className="w-full max-w-xl overflow-hidden rounded-[1.75rem] border border-border bg-background shadow-2xl">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={previewUrl} alt="Upload being reviewed" className="aspect-[4/3] w-full object-cover" />
              <div className="p-5 sm:p-7"><div className="flex items-start justify-between gap-4"><div><p className="text-sm font-medium text-accent">AI draft</p><h3 id="review-caption-heading" className="mt-1 font-editorial text-3xl font-medium tracking-tight text-primary">Review before it goes live.</h3></div><button type="button" onClick={() => setIsReviewOpen(false)} className="inline-flex size-11 items-center justify-center rounded-xl text-secondary hover:bg-muted hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent" aria-label="Close review"><X className="size-5" aria-hidden /></button></div><p className="mt-6 font-editorial text-2xl leading-snug tracking-tight text-foreground">{draft.caption}</p><p className="mt-3 text-sm text-secondary">Generated with {draft.generationModel}. The photo is uploaded only after you publish.</p><div className="mt-7 flex flex-wrap justify-end gap-3"><button type="button" onClick={() => setIsReviewOpen(false)} disabled={isWorking} className="inline-flex min-h-11 items-center rounded-xl border border-border px-4 text-sm font-medium text-foreground transition-colors hover:border-accent focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent">Keep editing</button><button type="button" onClick={publishCaption} disabled={isWorking} className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-primary px-4 text-sm font-medium text-background transition-transform hover:-translate-y-0.5 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent disabled:opacity-60">{isWorking ? <LoaderCircle className="size-4 animate-spin motion-reduce:animate-none" aria-hidden /> : <UploadCloud className="size-4" aria-hidden />}Publish to the feed</button></div></div>
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </LayoutGroup>
  );
}
