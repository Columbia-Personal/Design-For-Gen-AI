"use client";

import { LoaderCircle, Upload, UserRound } from "lucide-react";
import Image from "next/image";
import { motion, useReducedMotion } from "motion/react";
import { useRef, useState, useTransition } from "react";
import { createClient } from "@/lib/supabase/client";

type ProfileFormProps = {
  userId: string;
  initialFirstName: string | null;
  initialLastName: string | null;
  initialAvatarUrl: string | null;
};

const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_IMAGE_SIZE = 5 * 1024 * 1024;

export function ProfileForm({
  userId,
  initialFirstName,
  initialLastName,
  initialAvatarUrl,
}: ProfileFormProps) {
  const [firstName, setFirstName] = useState(initialFirstName ?? "");
  const [lastName, setLastName] = useState(initialLastName ?? "");
  const [avatarUrl, setAvatarUrl] = useState(initialAvatarUrl);
  const [message, setMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const shouldReduceMotion = useReducedMotion();
  const needsNames = !firstName.trim() || !lastName.trim();

  function saveNames(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const cleanFirstName = firstName.trim();
    const cleanLastName = lastName.trim();

    if (!cleanFirstName || !cleanLastName) {
      setMessage("Add both your first and last name before saving.");
      return;
    }

    startTransition(async () => {
      setMessage(null);
      const supabase = createClient();
      const { error } = await supabase
        .from("profiles")
        .update({
          first_name: cleanFirstName,
          last_name: cleanLastName,
          updated_at: new Date().toISOString(),
        })
        .eq("id", userId);

      setMessage(error ? "Your details could not be saved. Please try again." : "Profile saved.");
    });
  }

  function uploadPhoto(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!ALLOWED_IMAGE_TYPES.includes(file.type) || file.size > MAX_IMAGE_SIZE) {
      setMessage("Choose a JPG, PNG, or WebP image that is 5 MB or smaller.");
      event.target.value = "";
      return;
    }

    startTransition(async () => {
      setMessage(null);
      const supabase = createClient();
      const extension = file.name.split(".").pop()?.toLowerCase() || "jpg";
      const filePath = `${userId}/${crypto.randomUUID()}.${extension}`;
      const { error: uploadError } = await supabase.storage
        .from("profile-photos")
        .upload(filePath, file, {
          cacheControl: "3600",
          contentType: file.type,
          upsert: false,
        });

      if (uploadError) {
        setMessage("Your photo could not be uploaded. Please try again.");
        return;
      }

      const { data } = supabase.storage.from("profile-photos").getPublicUrl(filePath);
      const { error: profileError } = await supabase
        .from("profiles")
        .update({
          avatar_url: data.publicUrl,
          updated_at: new Date().toISOString(),
        })
        .eq("id", userId);

      if (profileError) {
        setMessage("Your photo uploaded, but the profile link could not be saved.");
        return;
      }

      setAvatarUrl(data.publicUrl);
      setMessage("Profile photo saved.");
    });
  }

  return (
    <section className="rounded-3xl border border-border bg-background/80 p-6 shadow-sm backdrop-blur sm:p-7" aria-labelledby="profile-heading">
      <div className="flex items-start gap-4">
        <div className="relative flex size-14 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-accent/10 text-accent">
          {avatarUrl ? (
            <Image
              src={avatarUrl}
              alt="Your profile photo"
              fill
              sizes="56px"
              className="object-cover"
            />
          ) : (
            <UserRound className="size-7" aria-hidden />
          )}
        </div>
        <div>
          <p className="font-mono text-xs uppercase tracking-[0.16em] text-accent">Profile</p>
          <h2 id="profile-heading" className="mt-1 font-display text-3xl font-medium tracking-tight text-primary">
            {needsNames ? "Finish your profile" : "Your details"}
          </h2>
        </div>
      </div>

      <p className="mt-5 max-w-xl text-sm leading-relaxed text-secondary">
        {needsNames
          ? "Add your name so your profile is complete. You can change it later."
          : "Update your name or photo whenever you need to."}
      </p>

      <form className="mt-7 grid gap-5 sm:grid-cols-2" onSubmit={saveNames}>
        <label className="grid gap-2 text-sm font-medium text-foreground">
          First name
          <input
            value={firstName}
            onChange={(event) => setFirstName(event.target.value)}
            autoComplete="given-name"
            required
            className="min-h-11 rounded-xl border border-border bg-background px-3 text-base font-normal text-foreground outline-none transition-colors duration-200 placeholder:text-secondary/70 focus:border-accent focus:ring-2 focus:ring-accent/20"
          />
        </label>
        <label className="grid gap-2 text-sm font-medium text-foreground">
          Last name
          <input
            value={lastName}
            onChange={(event) => setLastName(event.target.value)}
            autoComplete="family-name"
            required
            className="min-h-11 rounded-xl border border-border bg-background px-3 text-base font-normal text-foreground outline-none transition-colors duration-200 placeholder:text-secondary/70 focus:border-accent focus:ring-2 focus:ring-accent/20"
          />
        </label>

        <div className="sm:col-span-2">
          <input
            ref={fileInputRef}
            id="profile-photo"
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="sr-only"
            onChange={uploadPhoto}
          />
          <p className="mb-2 text-sm font-medium text-foreground">Profile photo</p>
          <div className="flex flex-wrap items-center gap-3">
            <motion.button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={isPending}
              whileTap={shouldReduceMotion ? undefined : { scale: 0.97 }}
              className="inline-flex min-h-11 cursor-pointer items-center gap-2 rounded-xl border border-border px-3.5 text-sm font-medium text-foreground transition-colors duration-200 hover:border-accent/50 hover:text-accent focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isPending ? <LoaderCircle className="size-4 animate-spin motion-reduce:animate-none" aria-hidden /> : <Upload className="size-4" aria-hidden />}
              {avatarUrl ? "Replace photo" : "Upload photo"}
            </motion.button>
            <span className="text-xs text-secondary">JPG, PNG, or WebP. Up to 5 MB.</span>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3 sm:col-span-2">
          <motion.button
            type="submit"
            disabled={isPending}
            whileTap={shouldReduceMotion ? undefined : { scale: 0.97 }}
            className="inline-flex min-h-11 cursor-pointer items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-medium text-background transition-transform duration-200 hover:-translate-y-0.5 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isPending ? <LoaderCircle className="size-4 animate-spin motion-reduce:animate-none" aria-hidden /> : null}
            {isPending ? "Saving" : "Save profile"}
          </motion.button>
          <p className="min-h-5 text-sm text-secondary" aria-live="polite">
            {message}
          </p>
        </div>
      </form>
    </section>
  );
}
