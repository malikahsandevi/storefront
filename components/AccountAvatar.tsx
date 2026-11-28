"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { IconClose, IconEye } from "@/components/icons";

interface Rect {
  left: number;
  top: number;
  width: number;
  height: number;
  radius: number;
}

const MORPH_MS = 320;
const EASING = "cubic-bezier(0.22, 0.61, 0.36, 1)";
const MORPH_TRANSITION = `left ${MORPH_MS}ms ${EASING}, top ${MORPH_MS}ms ${EASING}, width ${MORPH_MS}ms ${EASING}, height ${MORPH_MS}ms ${EASING}, border-radius ${MORPH_MS}ms ${EASING}`;

interface FillState {
  from: Rect;
  frame: Rect;
  stage: "from" | "to";
  closing: boolean;
}

/** The account card's big profile disc: the customer's photo when
 *  there is a loadable one; their initials on the house disc when
 *  there is not — a stored placeholder value ("default-avatar.png")
 *  or a failed load must never paint the browser's broken-image
 *  glyph. Same fallback contract as ReviewAvatar, at profile size.
 *
 *  The disc always wears a primary-colour ring. When a real photo
 *  is showing, an eye badge pinned to the rim at the 4 o'clock
 *  position opens the IN-CARD fill view (Ahsan's design, 2026-11-28):
 *  the card's other content fades out (the page does that via
 *  onFillChange) while the photo — ring and all — morphs out of the
 *  circle to fill the whole profile card block, cover-fit, corners
 *  rounding to the card's own radius. The cross at the filled
 *  block's top-right (or Escape) morphs it back into the circle and
 *  the details fade back in. No overlay, no backdrop. */
export default function AccountAvatar({
  name,
  avatar,
  size = 148,
  onFillChange,
}: {
  name: string;
  avatar?: string;
  size?: number;
  /** Told when the fill view opens/closes so the card can fade its
   *  other content out and back in, in sync with the morph. */
  onFillChange?: (active: boolean) => void;
}) {
  const [failed, setFailed] = useState(false);
  const wrapRef = useRef<HTMLSpanElement>(null);
  const [fill, setFill] = useState<FillState | null>(null);
  const [primed, setPrimed] = useState(false);
  const timersRef = useRef<number[]>([]);

  const usable = Boolean(avatar) && /^https?:\/\//i.test(avatar || "") && !failed;
  const initials = name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join("");

  const later = useCallback((fn: () => void, ms: number) => {
    timersRef.current.push(window.setTimeout(fn, ms));
  }, []);

  useEffect(() => {
    const timers = timersRef.current;
    return () => timers.forEach((t) => window.clearTimeout(t));
  }, []);

  const measureDisc = useCallback((): Rect | null => {
    const el = wrapRef.current;
    if (!el || !el.isConnected) return null;
    const r = el.getBoundingClientRect();
    return { left: r.left, top: r.top, width: r.width, height: r.height, radius: r.width / 2 };
  }, []);

  const measureCard = useCallback((): Rect | null => {
    const el = wrapRef.current;
    if (!el || !el.isConnected) return null;
    const card = el.closest("[data-profile-card]");
    if (!card) return null;
    const r = card.getBoundingClientRect();
    const radius = parseFloat(getComputedStyle(card).borderTopLeftRadius) || 24;
    return { left: r.left, top: r.top, width: r.width, height: r.height, radius };
  }, []);

  const openFill = () => {
    const from = measureDisc();
    const frame = measureCard();
    if (!from || !frame) return;
    setPrimed(false);
    setFill({ from, frame, stage: "from", closing: false });
    // The card's details fade out as the photo zooms to fill it.
    onFillChange?.(true);
    // Two frames later the image sits at the disc; flipping the
    // stage then morphs it into the card frame.
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        setPrimed(true);
        setFill((f) => (f ? { ...f, stage: "to" } : f));
      });
    });
  };

  const closeFill = useCallback(() => {
    setFill((current) => {
      if (!current || current.closing) return current;
      // Re-measure the disc — it may have moved (layout) since the
      // fill opened. If it is gone, shrink toward the last spot.
      const fresh = measureDisc();
      return { ...current, from: fresh ?? current.from, stage: "from", closing: true };
    });
    // The details fade back in as the photo returns to the circle.
    onFillChange?.(false);
    later(() => {
      setFill(null);
      setPrimed(false);
    }, MORPH_MS + 40);
  }, [later, measureDisc, onFillChange]);

  // Esc closes; the page locks its scroll while filled so the
  // morph stays glued to the card it fills.
  useEffect(() => {
    if (!fill) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeFill();
    };
    window.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [fill, closeFill]);

  const rect = fill ? (fill.stage === "from" ? fill.from : fill.frame) : null;

  return (
    <span
      ref={wrapRef}
      className="relative inline-block flex-none"
      style={{ width: size, height: size }}
    >
      {!usable ? (
        <span
          aria-hidden
          className="flex h-full w-full items-center justify-center rounded-full border-4 border-primary bg-primary/20 font-display font-bold text-primary"
          style={{ fontSize: Math.round(size * 0.36) }}
        >
          {initials || "?"}
        </span>
      ) : (
        <>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            key={avatar}
            src={avatar}
            alt=""
            loading="lazy"
            onError={() => setFailed(true)}
            className="h-full w-full rounded-full border-4 border-primary object-cover"
            style={{ visibility: fill ? "hidden" : "visible" }}
          />
          {/* Eye badge pinned ON the rim at 4 o'clock: its centre
              sits on the circle's boundary (93.3% across, 75% down
              is the rim point 30° below the right-hand horizontal),
              so the badge straddles the edge. */}
          <button
            type="button"
            onClick={openFill}
            aria-label="View profile photo"
            title="View photo"
            className="absolute z-10 flex h-9 w-9 items-center justify-center rounded-full border border-line bg-ink-2 text-cream shadow-lg transition hover:text-primary"
            style={{
              left: "93.3%",
              top: "75%",
              transform: "translate(-50%, -50%)",
              visibility: fill ? "hidden" : "visible",
            }}
          >
            <IconEye className="h-[18px] w-[18px]" />
          </button>
        </>
      )}

      {fill &&
        rect &&
        avatar &&
        createPortal(
          <>
            {/* The morphing photo itself: disc <-> the whole card
                block, primary ring on it the whole way. */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={avatar}
              alt={name}
              data-avatar-fill-image
              className="fixed z-[90] border-4 border-primary object-cover shadow-2xl"
              style={{
                left: rect.left,
                top: rect.top,
                width: rect.width,
                height: rect.height,
                borderRadius: rect.radius,
                transition: primed ? MORPH_TRANSITION : undefined,
              }}
            />
            {fill.stage === "to" && !fill.closing && (
              <button
                type="button"
                onClick={closeFill}
                aria-label="Close photo view"
                className="fixed z-[91] flex h-9 w-9 items-center justify-center rounded-full bg-black/55 text-white shadow-lg transition hover:bg-primary"
                style={{
                  left: fill.frame.left + fill.frame.width - 48,
                  top: fill.frame.top + 12,
                }}
              >
                <IconClose className="h-4 w-4" />
              </button>
            )}
          </>,
          document.body,
        )}
    </span>
  );
}
