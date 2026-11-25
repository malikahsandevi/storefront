"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Fragment, useEffect, useLayoutEffect, useRef, useState } from "react";
import { formatMoney, type CatalogCategory, type CatalogProduct } from "@/lib/api";
import { useShop } from "@/lib/store";
import { useCartUI } from "./CartDrawer";
import { IconArrow, IconBag, IconCaretDown, IconChevron, IconHeart, IconMoon, IconSearch, IconSun, IconUser } from "./icons";

/* Mega panel morph geometry — the admin AvatarViewer's FLIP
   timing, shared by the open/close morphs below: the card's own
   box (left/top/width/height/border-radius) transitions between
   the pill item's rect and the card's natural frame rect. */
interface MegaRect {
  left: number;
  top: number;
  width: number;
  height: number;
  radius: number;
}
interface MegaMorph {
  from: MegaRect;
  frame: MegaRect;
  /** "from" renders the card at the item box; "to" at the frame. */
  stage: "from" | "to";
  closing: boolean;
}
const MEGA_MORPH_MS = 300;
const MEGA_MORPH_EASING = "cubic-bezier(0.22, 0.61, 0.36, 1)";
const MEGA_MORPH_TRANSITION = `left ${MEGA_MORPH_MS}ms ${MEGA_MORPH_EASING}, top ${MEGA_MORPH_MS}ms ${MEGA_MORPH_EASING}, width ${MEGA_MORPH_MS}ms ${MEGA_MORPH_EASING}, height ${MEGA_MORPH_MS}ms ${MEGA_MORPH_EASING}, border-radius ${MEGA_MORPH_MS}ms ${MEGA_MORPH_EASING}`;
/** The panel card's own corner radius (.hdr__panel-card). */
const MEGA_CARD_RADIUS = 26;
/** The resting card's fill, copied from .hdr__panel-card in
    globals.css — painted inline while a morph runs, keyed to
    the morph's stage ("to" = this fill, "from" = the clear twin
    below), so the centre colours ramp in sync with the size
    change in both directions. */
const MEGA_CARD_BG =
  "radial-gradient(900px 300px at 85% -20%, color-mix(in srgb, var(--sf-primary) 16%, transparent), transparent 60%), var(--sf-bg-2)";
/** The same background with every stop transparent — the close
    fade's target: matching layer structure, so the gradient
    cross-fades instead of flipping. */
const MEGA_CARD_BG_CLEAR =
  "radial-gradient(900px 300px at 85% -20%, transparent, transparent 60%), transparent";
const MEGA_CARD_SHADOW = "0 40px 90px -30px rgb(0 0 0 / 0.85)";
const MEGA_CARD_BORDER = "var(--sf-line)";
/** The borders-only frame colour (.hdr__mega-card--morph). */
const MEGA_CARD_BORDER_ONLY = "color-mix(in srgb, var(--sf-text) 32%, transparent)";

/**
 * The store's header: ONE sticky glass bar (76px) — wordmark
 * left, the category navigation inside a PILL that grows to fill
 * the bar, and on the right a search pill (with the ⌘K chip) and
 * circular icon actions with count bubbles. The cart icon opens
 * the cart drawer; search opens a glass panel under the bar; on
 * small screens a burger opens the numbered link panel.
 * All destinations, the search submit and the badges are the
 * store's own wiring. ALL top-level categories stay in the nav.
 */
export default function Header({
  storeName,
  logo,
  categories,
  featured,
  currency,
  defaultMode,
}: {
  storeName: string;
  logo: string;
  tagline: string;
  categories: CatalogCategory[];
  /** One real product per main category that has subcategories —
   *  the hover mega panel's featured card (server-fetched). */
  featured: Record<string, CatalogProduct>;
  currency: string;
  contactEmail: string;
  phone: string;
  /** The admin-kept mode as the server resolved it — the theme
   *  switch's starting point before any visitor choice applies. */
  defaultMode: string;
}) {
  const { cartCount, wishlist, user } = useShop();
  const { setOpen: setCartOpen } = useCartUI();
  const router = useRouter();

  // Theme switch (dark/light): the admin-kept mode is the default
  // every new visitor gets; this switch is the visitor's OWN choice
  // — it flips <html data-mode> at once (the layout's token sets key
  // off it) and saves to localStorage, where the layout's pre-paint
  // boot script picks it up on later visits. It never writes back
  // to the admin setting and the palette is untouched. State starts
  // at the server-rendered default and syncs on mount to the
  // effective attribute the boot script already stamped.
  const [mode, setMode] = useState<"dark" | "light">(
    defaultMode === "light" ? "light" : "dark",
  );
  useEffect(() => {
    const m = document.documentElement.getAttribute("data-mode");
    if (m === "dark" || m === "light") setMode(m);
  }, []);
  const toggleMode = () => {
    const next = mode === "dark" ? "light" : "dark";
    document.documentElement.setAttribute("data-mode", next);
    try {
      localStorage.setItem("sf-mode", next);
    } catch {
      /* storage unavailable (private mode etc.) — the flip still
         applies for this visit, it just won't persist. */
    }
    setMode(next);
  };
  const [term, setTerm] = useState("");
  const [panel, setPanel] = useState<"none" | "search" | "menu">("none");
  // The hover mega panel's category (desktop nav) — null when shut.
  const [mega, setMega] = useState<string | null>(null);
  const topCategories = categories.filter((c) => !c.parent);
  const subsOf = (id: string) =>
    categories.filter((c) => c.parent && String(c.parent._id) === String(id));
  const megaCategory = mega
    ? topCategories.find((c) => String(c._id) === mega) || null
    : null;
  const megaSubs = megaCategory ? subsOf(megaCategory._id) : [];
  const megaIndex = megaCategory
    ? topCategories.findIndex((c) => String(c._id) === String(megaCategory._id))
    : -1;
  const megaProduct = megaCategory ? featured[String(megaCategory._id)] : undefined;

  /* Mega panel open/close ANIMATION — the admin AvatarViewer's
     FLIP morph (Ahsan, 2026-11-26: "category se sub popup tak
     size change show — wo animation lagao"). The scale/fade grow
     shipped first was rejected: like the admin's customer profile
     image growing into its viewer card, the popup's CARD ITSELF
     changes size — its box is measured at the pill item it came
     from and at its own natural frame, and left/top/width/
     height/border-radius transition between the two rects (the
     viewer's exact 300ms + easing). Closing re-measures the item
     and shrinks the card back into it before unmounting. While a
     morph runs the card is absolutely positioned inside the panel
     with panel-relative rects (so page scroll can't skew them)
     and the grid keeps the frame's width, clipped by the card's
     overflow — the content never reflows mid-morph. The centre
     fill + content are keyed to the morph's own stage (below),
     so their opacity RAMPS with the size change — 0 → 1 as the
     box grows on open, 1 → 0 as it shrinks on close, same 300ms
     + easing, one synced motion (Ahsan, 2026-11-26: "opacity
     value bahry gi animation jisy complete hogi") — while the
     border frame itself never fades, and at the end of the
     shrink nothing but the frame lands on the category, so no
     colour is left on it. `mega` stays set through the exit
     so the panel can animate before unmounting. All helpers touch
     only refs + setState, so the first-render closures captured
     by the global key handler stay valid. */
  const [megaMorph, setMegaMorph] = useState<MegaMorph | null>(null);
  /** False only for a morph's first render (placed, not yet morphing). */
  const [megaPrimed, setMegaPrimed] = useState(false);
  const megaRef = useRef<string | null>(null);
  const megaMorphRef = useRef<MegaMorph | null>(null);
  const megaClosingRef = useRef(false);
  /** Category whose open morph starts once its panel has rendered. */
  const megaPendingRef = useRef<string | null>(null);
  /** Bumped on every open/close/kill so stale rAFs + timers bail. */
  const megaSessionRef = useRef(0);
  const megaTimerRef = useRef<number | null>(null);
  const megaCardRef = useRef<HTMLDivElement>(null);
  const navItemRefs = useRef(new Map<string, HTMLLIElement>());
  const megaReducedMotion = () =>
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const clearMegaTimer = () => {
    if (megaTimerRef.current !== null) {
      window.clearTimeout(megaTimerRef.current);
      megaTimerRef.current = null;
    }
  };
  const setMorph = (m: MegaMorph | null) => {
    megaMorphRef.current = m;
    setMegaMorph(m);
  };
  const flipMorph = (stage: "from" | "to") => {
    const m = megaMorphRef.current;
    if (m) setMorph({ ...m, stage });
  };
  /** The pill item's box (the link is the visual pill), viewport coords. */
  const megaItemRect = (id: string): MegaRect | null => {
    const li = navItemRefs.current.get(id);
    if (!li) return null;
    const el = (li.querySelector("a") as HTMLElement | null) ?? li;
    const r = el.getBoundingClientRect();
    return {
      left: r.left,
      top: r.top,
      width: r.width,
      height: r.height,
      radius: r.height / 2,
    };
  };
  /** A viewport rect → panel-relative (the morph's coordinate space). */
  const megaRel = (panel: HTMLElement, r: MegaRect): MegaRect => {
    const p = panel.getBoundingClientRect();
    return { ...r, left: r.left - p.left, top: r.top - p.top };
  };
  const killMega = () => {
    megaSessionRef.current += 1;
    clearMegaTimer();
    megaRef.current = null;
    megaClosingRef.current = false;
    megaPendingRef.current = null;
    setMorph(null);
    setMegaPrimed(false);
    setMega(null);
  };
  const finishMegaClose = () => {
    megaTimerRef.current = null;
    megaRef.current = null;
    megaClosingRef.current = false;
    setMorph(null);
    setMegaPrimed(false);
    setMega(null);
  };
  const closeMega = () => {
    if (megaRef.current === null || megaClosingRef.current) return;
    if (megaReducedMotion()) {
      killMega();
      return;
    }
    const session = (megaSessionRef.current += 1);
    clearMegaTimer();
    megaClosingRef.current = true;
    const card = megaCardRef.current;
    const itemRect = megaItemRect(megaRef.current);
    const panelEl = card?.offsetParent as HTMLElement | null | undefined;
    if (!card || !itemRect || !panelEl) {
      finishMegaClose();
      return;
    }
    const current = megaMorphRef.current;
    if (current) {
      // Mid-open morph: redirect it — re-measure the item (it may
      // have moved) and shrink from wherever the card is now.
      setMorph({
        ...current,
        from: megaRel(panelEl, itemRect),
        closing: true,
        stage: "from",
      });
      megaTimerRef.current = window.setTimeout(
        finishMegaClose,
        MEGA_MORPH_MS + 40,
      );
      return;
    }
    // Steady state: place the card at its natural box first (no
    // transition), then flip the stage so it shrinks into the item.
    const cr = card.getBoundingClientRect();
    const frame = megaRel(panelEl, {
      left: cr.left,
      top: cr.top,
      width: cr.width,
      height: cr.height,
      radius: MEGA_CARD_RADIUS,
    });
    setMegaPrimed(false);
    setMorph({ from: megaRel(panelEl, itemRect), frame, stage: "to", closing: true });
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        if (megaSessionRef.current !== session) return;
        setMegaPrimed(true);
        flipMorph("from");
        megaTimerRef.current = window.setTimeout(
          finishMegaClose,
          MEGA_MORPH_MS + 40,
        );
      });
    });
  };
  /* Start an open morph for the rendered panel: measure the item
     box and the card's natural frame, place the card at the item,
     then flip the stage two frames later so the transition runs
     it into the frame (the AvatarViewer's exact sequence). A
     morph already in flight (re-hover mid-close) instead resumes
     from the card's current rendered box into its stored frame. */
  const startOpenMorph = (id: string) => {
    const card = megaCardRef.current;
    const itemRect = megaItemRect(id);
    const panelEl = card?.offsetParent as HTMLElement | null | undefined;
    if (!card || !itemRect || !panelEl) return;
    const current = megaMorphRef.current;
    let from: MegaRect;
    let frame: MegaRect;
    const cr = card.getBoundingClientRect();
    if (current) {
      from = megaRel(panelEl, {
        left: cr.left,
        top: cr.top,
        width: cr.width,
        height: cr.height,
        radius: MEGA_CARD_RADIUS,
      });
      frame = current.frame;
    } else {
      frame = megaRel(panelEl, {
        left: cr.left,
        top: cr.top,
        width: cr.width,
        height: cr.height,
        radius: MEGA_CARD_RADIUS,
      });
      from = megaRel(panelEl, itemRect);
    }
    const session = megaSessionRef.current;
    setMegaPrimed(false);
    setMorph({ from, frame, stage: "from", closing: false });
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        if (megaSessionRef.current !== session) return;
        setMegaPrimed(true);
        flipMorph("to");
        megaTimerRef.current = window.setTimeout(() => {
          megaTimerRef.current = null;
          if (megaSessionRef.current !== session) return;
          setMorph(null);
          setMegaPrimed(false);
        }, MEGA_MORPH_MS + 40);
      });
    });
  };
  const openMega = (id: string) => {
    // Re-entrant enter for the item already open/opening: while
    // the card morphs, it sweeps over the resting pointer, the
    // hit target churns off and back onto the item, and the
    // browser refires mouseenter — a true no-op here, so the
    // refire can't cancel the running morph's completion timer.
    if (megaRef.current === id && !megaClosingRef.current) return;
    megaSessionRef.current += 1;
    clearMegaTimer();
    const fresh = megaRef.current === null;
    const rescue = megaClosingRef.current;
    const sameItem = megaRef.current === id;
    megaClosingRef.current = false;
    megaRef.current = id;
    if ((fresh || rescue) && !megaReducedMotion()) {
      // A fresh open morphs once the panel renders (layout effect
      // below); a re-hover of the SAME item mid-close finds the
      // panel already rendered with its category unchanged, so no
      // render is coming — resume the morph right here.
      if (rescue && sameItem) startOpenMorph(id);
      else megaPendingRef.current = id;
    } else {
      megaPendingRef.current = null;
    }
    setMega(id);
  };
  // Fresh opens (and category changes mid-rescue) start their
  // morph here, once the panel for the new category has rendered.
  useLayoutEffect(() => {
    if (!mega || megaPendingRef.current !== mega) return;
    megaPendingRef.current = null;
    startOpenMorph(mega);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mega]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setPanel((p) => (p === "search" ? "none" : "search"));
      }
      if (e.key === "Escape") {
        setPanel("none");
        closeMega();
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // The mega panel and the click panels never stack: opening search
  // or the menu shuts the hover panel (instantly, as before).
  useEffect(() => {
    if (panel !== "none") killMega();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [panel]);

  // Category pill scroll arrows: an arrow (over a soft shade of
  // the pill's own colour) shows at an end only while the pill can
  // scroll that way, so the scrollability is discoverable; clicking
  // scrolls the pill by a chunk. Native scroll/drag/wheel still work.
  const navListRef = useRef<HTMLUListElement>(null);
  const [canPrev, setCanPrev] = useState(false);
  const [canNext, setCanNext] = useState(false);
  const updateNavArrows = () => {
    const el = navListRef.current;
    if (!el) return;
    setCanPrev(el.scrollLeft > 4);
    setCanNext(el.scrollLeft + el.clientWidth < el.scrollWidth - 4);
  };
  useEffect(() => {
    updateNavArrows();
    window.addEventListener("resize", updateNavArrows);
    return () => window.removeEventListener("resize", updateNavArrows);
  }, [categories]);
  const scrollNav = (dir: 1 | -1) => {
    const el = navListRef.current;
    if (!el) return;
    el.scrollBy({ left: dir * Math.max(220, el.clientWidth * 0.6), behavior: "smooth" });
  };

  const submitSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPanel("none");
    router.push(term.trim() ? `/shop?q=${encodeURIComponent(term.trim())}` : "/shop");
  };

  const nameParts = storeName.trim().split(/\s+/);
  const wordmark =
    nameParts.length > 1 ? (
      <>
        {nameParts.slice(0, -1).join(" ")}{" "}
        <span className="grad-text">{nameParts[nameParts.length - 1]}</span>
      </>
    ) : (
      storeName
    );

  const tailLinks: { href: string; label: string }[] = [
    { href: "/wishlist", label: "Wishlist" },
    { href: user ? "/account" : "/login", label: user ? "My Account" : "Sign In" },
  ];

  // Mobile menu rows: main entries keep the panel's sequential
  // numbering; subcategories ride directly under their main category
  // as indented rows (no hover on touch — they must be reachable).
  const menuRows = (() => {
    let n = 0;
    const main = (href: string, label: string) => ({
      href,
      label,
      sub: false,
      idx: String(++n).padStart(2, "0"),
      depth: 0,
    });
    const sub = (href: string, label: string, depth: number) => ({
      href,
      label,
      sub: true,
      idx: "–",
      depth,
    });
    // Recursive walk: every descendant sits under its main category
    // as an indented row, so deeper levels stay reachable without
    // hover (each extra level indents further at render).
    const walkSubs = (parentId: string, depth: number): ReturnType<typeof sub>[] =>
      subsOf(parentId).flatMap((s) => [
        sub(`/category/${s.slug}`, s.name, depth),
        ...walkSubs(s._id, depth + 1),
      ]);
    return [
      main("/shop", "All Products"),
      ...topCategories.flatMap((category) => [
        main(`/category/${category.slug}`, category.name),
        ...walkSubs(category._id, 1),
      ]),
      ...tailLinks.map((link) => main(link.href, link.label)),
    ];
  })();

  // While a morph runs, the card is placed by the morph's current
  // rect (panel-relative, via the --morph class + these inline
  // styles; the transition attaches only once the card is primed,
  // exactly like the admin viewer). The PAINT is keyed to the
  // stage, so it rides the same transition as the geometry:
  // stage "from" paints the clear twin (transparent fill, no
  // shadow, the strengthened border colour) and stage "to" the
  // resting card's fill — opening (from → to) the centre colours
  // ramp 0 → 1 as the box grows, closing (to → from) they ramp
  // 1 → 0 as it shrinks, reaching each end exactly when the size
  // change completes. The grid's content opacity follows the
  // same keying. The border frame never fades: both stages paint
  // a fully visible border colour.
  const megaMorphRect = megaMorph
    ? megaMorph.stage === "from"
      ? megaMorph.from
      : megaMorph.frame
    : null;
  const megaMorphCardStyle: React.CSSProperties | undefined =
    megaMorph && megaMorphRect
      ? {
          left: megaMorphRect.left,
          top: megaMorphRect.top,
          width: megaMorphRect.width,
          height: megaMorphRect.height,
          borderRadius: megaMorphRect.radius,
          transition: megaPrimed
            ? `${MEGA_MORPH_TRANSITION}, background ${MEGA_MORPH_MS}ms ${MEGA_MORPH_EASING}, box-shadow ${MEGA_MORPH_MS}ms ${MEGA_MORPH_EASING}, border-color ${MEGA_MORPH_MS}ms ${MEGA_MORPH_EASING}`
            : undefined,
          ...(megaMorph.stage === "to"
            ? {
                background: MEGA_CARD_BG,
                boxShadow: MEGA_CARD_SHADOW,
                borderColor: MEGA_CARD_BORDER,
              }
            : {
                background: MEGA_CARD_BG_CLEAR,
                boxShadow: "none",
                borderColor: MEGA_CARD_BORDER_ONLY,
              }),
        }
      : undefined;
  const megaMorphGridStyle: React.CSSProperties | undefined = megaMorph
    ? {
        width: megaMorph.frame.width,
        opacity: megaMorph.stage === "to" ? 1 : 0,
        transition: megaPrimed
          ? `opacity ${MEGA_MORPH_MS}ms ${MEGA_MORPH_EASING}`
          : "none",
      }
    : undefined;

  return (
    <div className="hdr">
      {/* Main bar — leaving the bar (nav + any open panel together)
          shuts the hover mega panel. */}
      <header className="hdr__bar" onMouseLeave={() => closeMega()}>
        <div className="hwrap hdr__bar-in">
          <button
            type="button"
            className="hdr__burger"
            aria-label="Menu"
            aria-expanded={panel === "menu"}
            onClick={() => setPanel((p) => (p === "menu" ? "none" : "menu"))}
          >
            <span aria-hidden />
            <span aria-hidden />
          </button>

          <Link href="/" className="hdr__logo" aria-label={`${storeName} home`}>
            {logo ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={logo} alt={storeName} loading="lazy" />
            ) : (
              <span className="hdr__wordmark">{wordmark}</span>
            )}
          </Link>

          <nav className="hdr__nav" aria-label="Categories">
            <ul ref={navListRef} className="hdr__nav-list no-scrollbar" onScroll={updateNavArrows}>
              <li onMouseEnter={() => closeMega()}>
                <Link href="/shop" className="hdr__nav-link">
                  All Products
                </Link>
              </li>
              {topCategories.map((category) => {
                const subs = subsOf(category._id);
                return (
                  <li
                    key={category._id}
                    ref={(el) => {
                      if (el) navItemRefs.current.set(String(category._id), el);
                      else navItemRefs.current.delete(String(category._id));
                    }}
                    onMouseEnter={() => {
                      if (panel === "none") {
                        if (subs.length) openMega(String(category._id));
                        else closeMega();
                      }
                    }}
                  >
                    <Link
                      href={`/category/${category.slug}`}
                      className="hdr__nav-link"
                      aria-haspopup={subs.length ? "true" : undefined}
                      aria-expanded={
                        subs.length ? mega === String(category._id) : undefined
                      }
                    >
                      {category.name}
                      {/* Dropdown caret: only on categories WITH
                          subcategories — the same set that opens
                          the mega panel — so visitors can tell
                          which pill items open it. */}
                      {subs.length > 0 && <IconCaretDown className="hdr__nav-caret" />}
                    </Link>
                  </li>
                );
              })}
            </ul>
            {canPrev && (
              <span className="hdr__nav-fade hdr__nav-fade--prev">
                <button
                  type="button"
                  className="hdr__nav-arrow hdr__nav-arrow--prev"
                  aria-label="Scroll categories back"
                  onClick={() => scrollNav(-1)}
                >
                  <IconChevron />
                </button>
              </span>
            )}
            {canNext && (
              <span className="hdr__nav-fade hdr__nav-fade--next">
                <button
                  type="button"
                  className="hdr__nav-arrow hdr__nav-arrow--next"
                  aria-label="Scroll categories forward"
                  onClick={() => scrollNav(1)}
                >
                  <IconChevron />
                </button>
              </span>
            )}
          </nav>

          <div className="hdr__actions">
            <button
              type="button"
              className="hdr__search"
              aria-label="Search products"
              aria-expanded={panel === "search"}
              onClick={() => setPanel((p) => (p === "search" ? "none" : "search"))}
            >
              <IconSearch />
              <span className="hdr__search-label">Search</span>
              <span className="hdr__kbd" aria-hidden>⌘K</span>
            </button>
            <Link href="/wishlist" className="hdr__icon" aria-label="Wishlist">
              <IconHeart />
              {wishlist.length > 0 && <span className="hdr__bubble">{wishlist.length}</span>}
            </Link>
            <Link href={user ? "/account" : "/login"} className="hdr__icon" aria-label={user ? "My account" : "Sign in"}>
              <IconUser />
            </Link>
            <button
              type="button"
              className="hdr__icon"
              aria-label={mode === "dark" ? "Switch to light mode" : "Switch to dark mode"}
              onClick={toggleMode}
            >
              {mode === "dark" ? <IconSun /> : <IconMoon />}
            </button>
            <button type="button" className="hdr__icon" aria-label="Cart" onClick={() => setCartOpen(true)}>
              <IconBag />
              {cartCount > 0 && <span className="hdr__bubble">{cartCount}</span>}
            </button>
          </div>
        </div>

        {/* Search panel */}
        {panel === "search" && (
          <div className="hdr__panel">
            <div className="hdr__panel-card">
              <form className="flex items-center gap-3 px-6 py-5" onSubmit={submitSearch} role="search">
                <IconSearch className="h-5 w-5 shrink-0 text-muted" />
                <input
                  value={term}
                  onChange={(e) => setTerm(e.target.value)}
                  type="search"
                  name="q"
                  placeholder="Search products…"
                  aria-label="Search products"
                  autoFocus
                  className="w-full border-0 bg-transparent text-base text-cream shadow-none outline-none placeholder:text-muted-2 focus:shadow-none"
                />
                <button type="submit" className="btn btn--primary btn--sm shrink-0">
                  Search
                </button>
              </form>
              {topCategories.length > 0 && (
                <div className="flex flex-wrap items-center gap-2 border-t border-line px-6 py-4">
                  <span className="mono-label mr-1 text-muted-2">Browse</span>
                  {topCategories.slice(0, 6).map((category) => (
                    <Link
                      key={category._id}
                      href={`/category/${category.slug}`}
                      className="chip transition hover:border-primary"
                      onClick={() => setPanel("none")}
                    >
                      {category.name}
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Hover mega panel (desktop): the reference store's
            composition — the category's index, name and description
            with a View All link on the left, its subcategories as a
            numbered list in the middle, and one featured product of
            the category on the right. Only categories WITH
            subcategories open it; it lives inside the bar, so moving
            from the nav down into the panel keeps it open and
            leaving the bar shuts it. */}
        {megaCategory && panel === "none" && (
          <div className="hdr__panel hdr__mega">
            <div
              ref={megaCardRef}
              className={`hdr__panel-card${megaMorph ? " hdr__mega-card--morph" : ""}${megaMorph?.closing ? " hdr__mega-card--closing" : ""}${megaMorph?.stage === "to" ? " hdr__mega-card--paintin" : ""}`}
              style={megaMorphCardStyle}
            >
              <div className="hdr__mega-grid" style={megaMorphGridStyle}>
                <div className="hdr__mega-intro">
                  <p className="hdr__mega-idx" aria-hidden>
                    {String(megaIndex + 1).padStart(2, "0")}
                  </p>
                  <h3 className="hdr__mega-title">{megaCategory.name}</h3>
                  {megaCategory.description && (
                    <p className="hdr__mega-desc">{megaCategory.description}</p>
                  )}
                  <Link
                    href={`/category/${megaCategory.slug}`}
                    className="hdr__mega-all"
                    onClick={() => closeMega()}
                  >
                    View All {megaCategory.name}
                    <IconArrow className="h-4 w-4" />
                  </Link>
                </div>
                <nav
                  className="hdr__mega-subs"
                  aria-label={`${megaCategory.name} subcategories`}
                >
                  {megaSubs.map((sub, i) => (
                    <Link
                      key={sub._id}
                      href={`/category/${sub.slug}`}
                      onClick={() => closeMega()}
                    >
                      <span className="idx" aria-hidden>
                        {String(i + 1).padStart(2, "0")}
                      </span>
                      <span>{sub.name}</span>
                    </Link>
                  ))}
                </nav>
                {megaProduct && (
                  <Link
                    href={`/product/${megaProduct.slug}`}
                    className="hdr__mega-feat"
                    onClick={() => closeMega()}
                  >
                    <span className="hdr__mega-feat-media">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={
                          megaProduct.image ||
                          megaProduct.images?.find((img) => img.isMain)?.url ||
                          megaProduct.images?.[0]?.url ||
                          ""
                        }
                        alt={megaProduct.name}
                        loading="lazy"
                      />
                    </span>
                    {(megaProduct.brand?.name || megaProduct.category?.name) && (
                      <span className="hdr__mega-feat-tag">
                        {megaProduct.brand?.name || megaProduct.category?.name}
                      </span>
                    )}
                    <span className="hdr__mega-feat-name">{megaProduct.name}</span>
                    <span className="hdr__mega-feat-price">
                      {formatMoney(megaProduct.price, currency)}
                    </span>
                  </Link>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Mobile menu panel */}
        {panel === "menu" && (
          <div className="hdr__panel">
            <div className="hdr__panel-card">
              <nav className="hdr__mobile-links" aria-label="Menu">
                {menuRows.map((row) => (
                  <Link
                    key={row.href}
                    href={row.href}
                    className={row.sub ? "hdr__mobile-sublink" : undefined}
                    style={
                      row.sub && row.depth > 1
                        ? { paddingLeft: 46 + (row.depth - 1) * 20 }
                        : undefined
                    }
                    onClick={() => setPanel("none")}
                  >
                    <span className="idx" aria-hidden>{row.idx}</span>
                    <span>{row.label}</span>
                    <IconArrow className="h-4 w-4 text-primary" />
                  </Link>
                ))}
                {/* The visitor's own theme switch, reachable on
                    mobile too — same behaviour as the header icon:
                    flips this device only, the menu stays open so
                    the change is visible at once. */}
                <button
                  type="button"
                  className="hdr__mobile-theme"
                  aria-label={mode === "dark" ? "Switch to light mode" : "Switch to dark mode"}
                  onClick={toggleMode}
                >
                  <span className="idx" aria-hidden>–</span>
                  <span>{mode === "dark" ? "Light Mode" : "Dark Mode"}</span>
                  {mode === "dark" ? (
                    <IconSun className="h-4 w-4 text-primary" />
                  ) : (
                    <IconMoon className="h-4 w-4 text-primary" />
                  )}
                </button>
              </nav>
            </div>
          </div>
        )}
      </header>
    </div>
  );
}
