"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

/**
 * The reveal layer, CSS-first like the reference store: elements
 * carrying [data-reveal] fade/slide in when they enter the
 * viewport. It is pure progressive enhancement — content is fully
 * visible without JS; the hidden start state only applies once
 * this component has added .js-anim to <html>, a 2.5s failsafe
 * reveals everything regardless (the reference's own pattern),
 * and prefers-reduced-motion disables the whole layer in CSS.
 * Checkout carries no hooks and is never animated.
 *
 * The observer also watches for elements rendered AFTER the
 * initial pass (a MutationObserver registers them as they mount):
 * client-fetched blocks — the wishlist's recommendations rail is
 * one — would otherwise sit at the hidden start state forever,
 * never having been in the first snapshot.
 */
export default function Motion() {
  const pathname = usePathname();

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const root = document.documentElement;
    root.classList.add("js-anim");
    const pending = new Set<HTMLElement>();
    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-in");
            pending.delete(entry.target as HTMLElement);
            io.unobserve(entry.target);
          }
        }
      },
      { rootMargin: "0px 0px -8% 0px" },
    );
    const watch = (el: HTMLElement) => {
      if (pending.has(el) || el.classList.contains("is-in")) return;
      pending.add(el);
      io.observe(el);
    };
    document.querySelectorAll<HTMLElement>("[data-reveal]").forEach(watch);
    const mo = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        for (const node of mutation.addedNodes) {
          if (!(node instanceof HTMLElement)) continue;
          if (node.matches("[data-reveal]")) watch(node);
          node.querySelectorAll<HTMLElement>("[data-reveal]").forEach(watch);
        }
      }
    });
    mo.observe(document.body, { childList: true, subtree: true });
    const failsafe = setTimeout(() => pending.forEach((el) => el.classList.add("is-in")), 2500);
    return () => {
      io.disconnect();
      mo.disconnect();
      clearTimeout(failsafe);
    };
  }, [pathname]);

  return null;
}
