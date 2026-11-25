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
 */
export default function Motion() {
  const pathname = usePathname();

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const root = document.documentElement;
    root.classList.add("js-anim");
    const els = Array.from(document.querySelectorAll<HTMLElement>("[data-reveal]"));
    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-in");
            io.unobserve(entry.target);
          }
        }
      },
      { rootMargin: "0px 0px -8% 0px" },
    );
    els.forEach((el) => io.observe(el));
    const failsafe = setTimeout(() => els.forEach((el) => el.classList.add("is-in")), 2500);
    return () => {
      io.disconnect();
      clearTimeout(failsafe);
    };
  }, [pathname]);

  return null;
}
