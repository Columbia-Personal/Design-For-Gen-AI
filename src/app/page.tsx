"use client";

import { motion, useReducedMotion, type Variants } from "motion/react";
import { Boxes, Palette, Wind, Triangle } from "lucide-react";

const GITHUB_URL = "#";

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
    icon: Wind,
    name: "Motion for React",
    note: "the animation you're looking at",
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
      <div aria-hidden className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
        <div className="blob-a absolute -top-32 -left-24 h-[32rem] w-[32rem] rounded-full bg-accent/20 blur-3xl" />
        <div className="blob-b absolute top-1/3 -right-32 h-[28rem] w-[28rem] rounded-full bg-secondary/20 blur-3xl" />
        <div className="blob-c absolute bottom-0 left-1/4 h-[26rem] w-[26rem] rounded-full bg-accent/10 blur-3xl" />
      </div>

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
            Design for Generative AI · Assignment 01
          </p>

          <motion.h1
            variants={shouldReduceMotion ? undefined : heroContainer}
            initial={shouldReduceMotion ? undefined : "hidden"}
            animate={shouldReduceMotion ? undefined : "show"}
            className="font-display text-6xl leading-none font-medium tracking-tight text-primary sm:text-8xl"
          >
            <motion.span variants={heroWord} className="block">
              Hello,
            </motion.span>
            <motion.span variants={heroWord} className="block text-accent">
              world.
            </motion.span>
          </motion.h1>

          <p className="max-w-md text-lg leading-relaxed text-secondary">
            The smallest program that proves the pipe works.
          </p>

          <p className="font-mono text-sm text-secondary/80">
            Ritvik Sharma, pushed from a laptop, served from Vercel&apos;s edge
            network.
          </p>
        </section>

        <motion.section
          initial="offscreen"
          whileInView="onscreen"
          viewport={{ once: true, amount: 0.5 }}
          variants={revealContainer}
          className="flex flex-col gap-6 border-t border-border py-16"
        >
          <motion.p variants={reveal} className="text-lg leading-relaxed text-foreground">
            A hello world app is the standard first test when you&apos;re
            setting up something new: build the smallest possible version,
            run it, and confirm it works before adding anything else. This
            one runs through more of the stack than a bare-minimum version
            would (React, Tailwind, Motion, Next.js), but the purpose is the
            same.
          </motion.p>
          <motion.p variants={reveal} className="text-lg leading-relaxed text-foreground">
            The assignment isn&apos;t really about the words &ldquo;hello
            world.&rdquo; It&apos;s about proving the deployment pipeline
            works: push code to GitHub, connect it to Vercel, get a
            successful build, and confirm the page loads for someone else in
            a private browser window with no login required. Once that&apos;s
            done, everything built afterward can assume deployment already
            works.
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
          className="cursor-pointer underline decoration-border underline-offset-4 transition-colors hover:text-accent"
        >
          Source
        </a>
      </footer>
    </div>
  );
}
