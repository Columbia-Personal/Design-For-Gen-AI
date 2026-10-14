"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";

const scrollKey = (pathname: string) => `caption-lab:scroll:${pathname}`;

function scrollImmediately(top: number) {
  const root = document.documentElement;
  const previousBehavior = root.style.scrollBehavior;
  root.style.scrollBehavior = "auto";
  window.scrollTo({ top, left: 0, behavior: "auto" });
  root.style.scrollBehavior = previousBehavior;
}

export function ScrollManager() {
  const pathname = usePathname();
  const isFirstRender = useRef(true);
  const isHistoryNavigation = useRef(false);

  useEffect(() => {
    const previousRestoration = window.history.scrollRestoration;
    window.history.scrollRestoration = "manual";

    function savePosition() {
      sessionStorage.setItem(scrollKey(window.location.pathname), String(window.scrollY));
    }

    function noteHistoryNavigation() {
      savePosition();
      isHistoryNavigation.current = true;
    }

    window.addEventListener("pagehide", savePosition);
    window.addEventListener("popstate", noteHistoryNavigation);
    return () => {
      window.removeEventListener("pagehide", savePosition);
      window.removeEventListener("popstate", noteHistoryNavigation);
      window.history.scrollRestoration = previousRestoration;
    };
  }, []);

  useEffect(() => {
    const currentPath = pathname;
    const hash = window.location.hash;

    if (isFirstRender.current) {
      isFirstRender.current = false;
      if (!hash) return;
    }

    const frame = window.requestAnimationFrame(() => {
      if (hash) {
        document.getElementById(hash.slice(1))?.scrollIntoView({ behavior: "smooth", block: "start" });
      } else if (isHistoryNavigation.current) {
        const savedPosition = Number(sessionStorage.getItem(scrollKey(currentPath)) ?? "0");
        scrollImmediately(Number.isFinite(savedPosition) ? savedPosition : 0);
      } else {
        window.scrollTo({ top: 0, left: 0, behavior: "smooth" });
      }
      isHistoryNavigation.current = false;
    });

    return () => {
      sessionStorage.setItem(scrollKey(currentPath), String(window.scrollY));
      window.cancelAnimationFrame(frame);
    };
  }, [pathname]);

  return null;
}
