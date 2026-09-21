"use client";

import { motion, useReducedMotion, type Variants } from "motion/react";
import Link from "next/link";
import { ArrowUpRight, Boxes, Database, Palette, Triangle } from "lucide-react";

const GITHUB_URL = "https://github.com/Columbia-Personal/Design-For-Gen-AI";

const STACK = [
  {
    icon: Boxes,
    name: "Next.js 16",
    note: "App Router, typed routes",
  },
  {
    icon: Palette,
    name: "Tailwind CSS v4",
    note: "CSS-first theming",
  },
  {
    icon: Database,
    name: "Supabase",
    note: "captions stored in Postgres",
  },
  {
    icon: Triangle,
    name: "Vercel",
    note: "build, deploy, edge network",
  },
];

const heroContainer: Variants = {
  hidden: {},
  show: {
    transition: { staggerChildren: 0.12, delayChildren: 0.1 },
  },
};

const heroWord: Variants = {
  hidden: { opacity: 0, y: 24 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] },
  },
};

const reveal: Variants = {
  offscreen: { opacity: 0, y: 32 },
  onscreen: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] },
  },
};

const revealContainer: Variants = {
  offscreen: {},
  onscreen: { transition: { staggerChildren: 0.08 } },
};

export default function Home() {
  const shouldReduceMotion = useReducedMotion();

  return (
    <div className="relative flex flex-1 flex-col overflow-hidden">
      <header className="flex items-center justify-between px-6 py-6 sm:px-12">
        <span className="font-display text-sm tracking-tight text-secondary">
          hello.world
        </span>
        <span className="rounded-full border border-border px-3 py-1 font-mono text-xs text-secondary">
          01
        </span>
      </header>

      <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col px-6 sm:px-12">
        <section className="flex flex-col gap-6 py-20 sm:py-28">
          <p className="font-mono text-xs uppercase tracking-widest text-accent">
            Design for Generative AI · Assignments 01 + 02
          </p>

          <motion.h1
            variants={shouldReduceMotion ? undefined : heroContainer}
            initial={shouldReduceMotion ? undefined : "hidden"}
            animate={shouldReduceMotion ? undefined : "show"}
            className="font-display text-6xl leading-none font-medium tracking-tight text-primary sm:text-8xl"
          >
            <motion.span variants={heroWord} className="block">
              Caption
            </motion.span>
            <motion.span variants={heroWord} className="block text-accent">
              lab.
            </motion.span>
          </motion.h1>

          <p className="max-w-md text-lg leading-relaxed text-secondary">
            A small, public collection of captions backed by Supabase.
          </p>

          <p className="font-mono text-sm text-secondary/80">
            Ritvik Sharma · Next.js, Supabase, and Vercel
          </p>

          <Link
            href="/captions"
            className="inline-flex min-h-11 w-fit items-center gap-2 rounded-xl bg-primary px-5 py-3 text-sm font-medium text-background transition-transform duration-200 hover:-translate-y-0.5 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent"
          >
            Browse captions
            <ArrowUpRight className="size-4" aria-hidden />
          </Link>
        </section>

        <motion.section
          initial="offscreen"
          whileInView="onscreen"
          viewport={{ once: true, amount: 0.5 }}
          variants={revealContainer}
          className="flex flex-col gap-6 border-t border-border py-16"
        >
          <motion.p variants={reveal} className="text-lg leading-relaxed text-foreground">
            This project began as a deployed hello world page. It now reads a
            set of captions from Supabase and renders them as a public list.
          </motion.p>
          <motion.p variants={reveal} className="text-lg leading-relaxed text-foreground">
            The list is intentionally simple. The important part is that it
            comes from a real database, deploys with environment variables,
            and can be opened without an account.
          </motion.p>
        </motion.section>

        <motion.section
          initial="offscreen"
          whileInView="onscreen"
          viewport={{ once: true, amount: 0.3 }}
          variants={revealContainer}
          className="flex flex-col gap-6 border-t border-border py-16"
        >
          <h2 className="font-display text-sm uppercase tracking-widest text-secondary">
            Running on
          </h2>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {STACK.map(({ icon: Icon, name, note }) => (
              <motion.div
                key={name}
                variants={reveal}
                whileHover={shouldReduceMotion ? undefined : { y: -2 }}
                className="flex items-center gap-3 rounded-2xl border border-border bg-muted/40 px-4 py-3"
              >
                <Icon className="size-5 shrink-0 text-accent" aria-hidden />
                <div className="flex flex-col">
                  <span className="text-sm font-medium text-foreground">
                    {name}
                  </span>
                  <span className="text-xs text-secondary">{note}</span>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.section>
      </main>

      <footer className="flex flex-col gap-2 border-t border-border px-6 py-8 text-xs text-secondary sm:flex-row sm:items-center sm:justify-between sm:px-12">
        <span>Ritvik Sharma · Fall 2026 · Design for Generative AI</span>
        <a
          href={GITHUB_URL}
          className="cursor-pointer underline decoration-border underline-offset-4 transition-colors hover:text-accent focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent"
        >
          Source
        </a>
      </footer>
    </div>
  );
}
