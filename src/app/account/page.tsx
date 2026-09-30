import Link from "next/link";
import { ArrowLeft, LockKeyhole, Mail, ShieldCheck } from "lucide-react";
import { redirect } from "next/navigation";
import { AuthButton } from "@/components/auth-button";
import { ProfileForm } from "@/components/profile-form";
import { createClient } from "@/lib/supabase/server";

export const metadata = {
  title: "Account | Caption lab",
  description: "Your signed-in Caption Lab account.",
};

function getDisplayName(fullName: unknown, email: string) {
  if (typeof fullName === "string" && fullName.trim()) {
    return fullName.trim();
  }

  return email.split("@")[0] || "Caption lab member";
}

export default async function AccountPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user?.email) {
    redirect("/");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("first_name, last_name, avatar_url")
    .eq("id", user.id)
    .maybeSingle();
  const fullName = [profile?.first_name, profile?.last_name]
    .filter((name): name is string => Boolean(name?.trim()))
    .join(" ");
  const displayName = getDisplayName(fullName, user.email);

  return (
    <div className="flex min-h-dvh flex-col">
      <header className="border-b border-border bg-background/80 px-6 py-5 backdrop-blur sm:px-12">
        <div className="mx-auto flex w-full max-w-5xl items-center justify-between gap-4">
          <Link
            href="/"
            className="inline-flex min-h-11 items-center gap-2 rounded-lg px-1 text-sm font-medium text-secondary transition-colors duration-200 hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent"
          >
            <ArrowLeft className="size-4" aria-hidden />
            Home
          </Link>
          <AuthButton />
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-5xl flex-1 items-center px-6 py-14 sm:px-12 sm:py-20">
        <section className="grid w-full gap-8 border-y border-border py-10 sm:py-14">
          <div>
            <p className="font-mono text-xs uppercase tracking-[0.16em] text-accent">
              Assignment 03 · authenticated session
            </p>
            <h1 className="mt-5 font-display text-5xl font-medium tracking-tight text-primary sm:text-7xl">
              You are signed in.
            </h1>
            <p className="mt-5 max-w-xl text-lg leading-relaxed text-secondary">
              This page is only available after sign-in. Your session is checked on the server and refreshed through Supabase.
            </p>
            <Link
              href="/captions"
              className="mt-8 inline-flex min-h-11 items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-medium text-background transition-transform duration-200 hover:-translate-y-0.5 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent"
            >
              Browse captions
            </Link>
          </div>

          <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
            <ProfileForm
              userId={user.id}
              initialFirstName={profile?.first_name ?? null}
              initialLastName={profile?.last_name ?? null}
              initialAvatarUrl={profile?.avatar_url ?? null}
            />
            <aside className="rounded-3xl border border-border bg-muted/45 p-6 sm:p-7" aria-label="Account details">
              <LockKeyhole className="size-6 text-accent" aria-hidden />
              <p className="mt-7 font-mono text-xs uppercase tracking-[0.16em] text-secondary">
                Signed in as
              </p>
              <h2 className="mt-2 break-words font-display text-3xl font-medium tracking-tight text-primary">
                {displayName}
              </h2>
              <div className="mt-7 space-y-4 border-t border-border pt-5 text-sm text-secondary">
                <p className="flex items-start gap-3">
                  <Mail className="mt-0.5 size-4 shrink-0 text-accent" aria-hidden />
                  <span className="break-all">{user.email}</span>
                </p>
                <p className="flex items-start gap-3">
                  <ShieldCheck className="mt-0.5 size-4 shrink-0 text-accent" aria-hidden />
                  <span>Google account verified by Supabase</span>
                </p>
              </div>
            </aside>
          </div>
        </section>
      </main>

      <footer className="border-t border-border px-6 py-7 sm:px-12">
        <div className="mx-auto flex w-full max-w-5xl text-xs text-secondary">
          Week 3: Google authentication with Supabase
        </div>
      </footer>
    </div>
  );
}
