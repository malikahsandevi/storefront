"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

/**
 * The V13 motion layer (GSAP + ScrollTrigger), as progressive
 * enhancement only:
 *  - every animated state is set FROM JavaScript (fromTo), so the
 *    server-rendered page is fully visible with no JS at all;
 *  - prefers-reduced-motion disables the whole layer;
 *  - transform/opacity only — no layout shift, 60fps;
 *  - checkout and other critical flows carry no data-* hooks, so
 *    nothing there is ever animated.
 * Hooks: [data-hero-line] masked line reveals, [data-hero-fade]
 * staggered hero companions, [data-reveal] scroll reveals,
 * [data-marquee-track] the header ticker loop.
 */
export default function Motion() {
  const pathname = usePathname();

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let cancelled = false;
    let ctx: { revert: () => void } | undefined;

    (async () => {
      const gsap = (await import("gsap")).default;
      const { ScrollTrigger } = await import("gsap/ScrollTrigger");
      if (cancelled) return;
      gsap.registerPlugin(ScrollTrigger);

      ctx = gsap.context(() => {
        gsap.fromTo(
          "[data-hero-line]",
          { yPercent: 115 },
          { yPercent: 0, duration: 0.9, ease: "power4.out", stagger: 0.09, delay: 0.05 },
        );
        gsap.fromTo(
          "[data-hero-fade]",
          { autoAlpha: 0, y: 16 },
          { autoAlpha: 1, y: 0, duration: 0.7, ease: "power3.out", stagger: 0.08, delay: 0.4 },
        );
        gsap.utils.toArray<HTMLElement>("[data-reveal]").forEach((el) => {
          gsap.fromTo(
            el,
            { autoAlpha: 0, y: 26 },
            {
              autoAlpha: 1,
              y: 0,
              duration: 0.65,
              ease: "power3.out",
              scrollTrigger: { trigger: el, start: "top 92%", once: true },
            },
          );
        });
        gsap.utils.toArray<HTMLElement>("[data-marquee-track]").forEach((track) => {
          gsap.to(track, { xPercent: -50, duration: 30, ease: "none", repeat: -1 });
        });
        gsap.utils.toArray<HTMLElement>("[data-parallax]").forEach((el) => {
          // The element is oversized (120% height, -10% top) so the
          // ±4% drift never uncovers the frame.
          gsap.fromTo(
            el,
            { yPercent: -4 },
            {
              yPercent: 4,
              ease: "none",
              scrollTrigger: { trigger: el, start: "top bottom", end: "bottom top", scrub: true },
            },
          );
        });
      });
      ScrollTrigger.refresh();
    })();

    return () => {
      cancelled = true;
      ctx?.revert();
    };
  }, [pathname]);

  return null;
}
