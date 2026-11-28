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

const MORPH_MS = 300;
const EASING = "cubic-bezier(0.22, 0.61, 0.36, 1)";
const MORPH_TRANSITION = `left ${MORPH_MS}ms ${EASING}, top ${MORPH_MS}ms ${EASING}, width ${MORPH_MS}ms ${EASING}, height ${MORPH_MS}ms ${EASING}, border-radius ${MORPH_MS}ms ${EASING}`;

interface ViewState {
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
 *  position opens the photo large: it morphs out of the disc into
 *  a centred square frame on a dimmed backdrop (the admin
 *  AvatarViewer's pattern) and shrinks back on close. */
export default function AccountAvatar({
  name,
  avatar,
  size = 148,
}: {
  name: string;
  avatar?: string;
  size?: number;
}) {
  const [failed, setFailed] = useState(false);
  const wrapRef = useRef<HTMLSpanElement>(null);
  const [view, setView] = useState<ViewState | null>(null);
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

  const openViewer = () => {
    const from = measureDisc();
    if (!from) return;
    // A centred square frame — the photo is square, so the frame is.
    const side = Math.min(440, window.innerWidth - 32, window.innerHeight * 0.78);
    const frame: Rect = {
      left: (window.innerWidth - side) / 2,
      top: (window.innerHeight - side) / 2,
      width: side,
      height: side,
      radius: 24,
    };
    setPrimed(false);
    setView({ from, frame, stage: "from", closing: false });
    // Two frames later the image sits at the disc; flipping the
    // stage then morphs it into the frame.
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        setPrimed(true);
        setView((v) => (v ? { ...v, stage: "to" } : v));
      });
    });
  };

  const closeViewer = useCallback(() => {
    setView((current) => {
      if (!current || current.closing) return current;
      // Re-measure the disc — it may have moved (scroll, layout)
      // since the viewer opened. If it is gone, shrink in place.
      const fresh = measureDisc();
      return { ...current, from: fresh ?? current.from, stage: "from", closing: true };
    });
    later(() => {
      setView(null);
      setPrimed(false);
    }, MORPH_MS + 40);
  }, [later, measureDisc]);

  // Esc closes; the page behind locks its scroll while viewing.
  useEffect(() => {
    if (!view) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeViewer();
    };
    window.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [view, closeViewer]);

  const rect = view ? (view.stage === "from" ? view.from : view.frame) : null;

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
          />
          {/* Eye badge pinned ON the rim at 4 o'clock: its centre
              sits on the circle's boundary (93.3% across, 75% down
              is the rim point 30° below the right-hand horizontal),
              so the badge straddles the edge. */}
          <button
            type="button"
            onClick={openViewer}
            aria-label="View profile photo"
            title="View photo"
            className="absolute z-10 flex h-9 w-9 items-center justify-center rounded-full border border-line bg-ink-2 text-cream shadow-lg transition hover:text-primary"
            style={{ left: "93.3%", top: "75%", transform: "translate(-50%, -50%)" }}
          >
            <IconEye className="h-[18px] w-[18px]" />
          </button>
        </>
      )}

      {view &&
        rect &&
        avatar &&
        createPortal(
          <div className="fixed inset-0 z-[140]">
            {/* Backdrop — clicking outside the photo closes. */}
            <div
              onClick={closeViewer}
              className="absolute inset-0 bg-black/60"
              style={{ opacity: view.closing ? 0 : 1, transition: `opacity ${MORPH_MS}ms ease` }}
            />
            {/* The morphing photo itself: disc <-> centred frame. */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={avatar}
              alt={name}
              data-avatar-viewer-image
              className="fixed z-[141] border-4 border-primary object-cover shadow-2xl"
              style={{
                left: rect.left,
                top: rect.top,
                width: rect.width,
                height: rect.height,
                borderRadius: rect.radius,
                transition: primed ? MORPH_TRANSITION : undefined,
              }}
            />
            {view.stage === "to" && !view.closing && (
              <button
                type="button"
                onClick={closeViewer}
                aria-label="Close photo viewer"
                className="fixed z-[142] flex h-9 w-9 items-center justify-center rounded-full bg-black/55 text-white shadow-lg transition hover:bg-primary"
                style={{
                  left: view.frame.left + view.frame.width - 48,
                  top: view.frame.top + 12,
                }}
              >
                <IconClose className="h-4 w-4" />
              </button>
            )}
          </div>,
          document.body,
        )}
    </span>
  );
}
