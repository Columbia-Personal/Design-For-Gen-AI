"use client";

import type { User } from "@supabase/supabase-js";
import { LoaderCircle, LogIn, LogOut, UserRound } from "lucide-react";
import { motion, useReducedMotion } from "motion/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import { createClient } from "@/lib/supabase/client";

export function AuthButton() {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [message, setMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const shouldReduceMotion = useReducedMotion();
  const router = useRouter();

  useEffect(() => {
    const supabase = createClient();

    void supabase.auth.getUser().then(({ data, error }) => {
      if (error && error.message !== "Auth session missing!") {
        setMessage("We could not check your session. Please try again.");
      }
      setUser(data.user);
      setIsLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      setIsLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  function signIn() {
    startTransition(async () => {
      setMessage(null);
      const supabase = createClient();
      const redirectTo = `${window.location.origin}/auth/callback`;
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: { redirectTo },
      });

      if (error) {
        setMessage("Google sign-in did not start. Please try again.");
      }
    });
  }

  function signOut() {
    startTransition(async () => {
      setMessage(null);
      const supabase = createClient();
      const { error } = await supabase.auth.signOut();

      if (error) {
        setMessage("You are still signed in. Please try again.");
        return;
      }

      router.replace("/");
    });
  }

  if (isLoading) {
    return (
      <span className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-border bg-background/70 px-3 text-xs text-secondary">
        <LoaderCircle className="size-3.5 animate-spin motion-reduce:animate-none" aria-hidden />
        <span className="hidden sm:inline">Checking session</span>
      </span>
    );
  }

  return (
    <div className="flex items-center gap-2">
      {user ? (
        <>
          <Link
            href="/account"
            className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-border bg-background/70 px-3 text-sm font-medium text-foreground transition-colors duration-200 hover:border-accent/50 hover:text-accent focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent"
          >
            <UserRound className="size-4" aria-hidden />
            <span className="hidden sm:inline">Account</span>
          </Link>
          <motion.button
            type="button"
            onClick={signOut}
            disabled={isPending}
            whileTap={shouldReduceMotion ? undefined : { scale: 0.97 }}
            className="inline-flex min-h-11 cursor-pointer items-center gap-2 rounded-xl px-3 text-sm font-medium text-secondary transition-colors duration-200 hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isPending ? (
              <LoaderCircle className="size-4 animate-spin motion-reduce:animate-none" aria-hidden />
            ) : (
              <LogOut className="size-4" aria-hidden />
            )}
            <span className="hidden sm:inline">Sign out</span>
          </motion.button>
        </>
      ) : (
        <motion.button
          type="button"
          onClick={signIn}
          disabled={isPending}
          whileTap={shouldReduceMotion ? undefined : { scale: 0.97 }}
          className="inline-flex min-h-11 cursor-pointer items-center gap-2 rounded-xl bg-primary px-3.5 text-sm font-medium text-background transition-transform duration-200 hover:-translate-y-0.5 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isPending ? (
            <LoaderCircle className="size-4 animate-spin motion-reduce:animate-none" aria-hidden />
          ) : (
            <LogIn className="size-4" aria-hidden />
          )}
          <span>{isPending ? "Opening Google" : "Sign in"}</span>
        </motion.button>
      )}
      {message ? <span className="sr-only" role="alert">{message}</span> : null}
    </div>
  );
}
