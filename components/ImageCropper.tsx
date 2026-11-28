"use client";

import { useEffect, useRef, useState } from "react";
import { IconClose } from "@/components/icons";

const OUTPUT_MAX = 512;

/**
 * "Set Photo" crop popup for the profile photo — the admin
 * ImageCropper's behaviour in the storefront's auth-modal styling.
 * The picked photo sits in a SQUARE frame behind a circular mask
 * (the avatar renders round, so the circle is the truth): drag to
 * reposition, zoom with the slider. Confirm renders exactly the
 * frame's square through a canvas — the output is square by
 * construction, so nothing but a 1:1 image can ever be saved —
 * shrinks it to at most 512px as a JPEG data URL and hands it to
 * onConfirm (which uploads it). Cancel changes nothing.
 */
export default function ImageCropper({
  imageSrc,
  onClose,
  onConfirm,
}: {
  /** Object URL of the picked photo; null keeps the cropper closed. */
  imageSrc: string | null;
  onClose: () => void;
  /** Uploads the cropped square; resolves on success (the cropper
   *  then closes), rejects with the error to show in place. */
  onConfirm: (dataUrl: string) => Promise<void>;
}) {
  const frameRef = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLImageElement | null>(null);
  const dragRef = useRef<{ x: number; y: number; ox: number; oy: number } | null>(null);

  const [frameSize, setFrameSize] = useState(320);
  const [natural, setNatural] = useState<{ w: number; h: number } | null>(null);
  const [zoom, setZoom] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [loadError, setLoadError] = useState("");
  const [applying, setApplying] = useState(false);
  const [applyError, setApplyError] = useState("");

  // Fresh state + a readable copy of the image every time it opens.
  useEffect(() => {
    if (!imageSrc) return;
    setZoom(1);
    setOffset({ x: 0, y: 0 });
    setNatural(null);
    setLoadError("");
    setApplyError("");
    setApplying(false);
    imgRef.current = null;

    const img = new Image();
    img.onload = () => {
      imgRef.current = img;
      setNatural({ w: img.naturalWidth, h: img.naturalHeight });
    };
    img.onerror = () => setLoadError("That photo could not be read.");
    img.src = imageSrc;
  }, [imageSrc]);

  // Measure the frame once it is on screen (it is viewport-capped).
  useEffect(() => {
    if (!imageSrc) return;
    const measure = () => {
      if (frameRef.current) setFrameSize(frameRef.current.clientWidth);
    };
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, [imageSrc]);

  // Escape cancels; the page behind locks its scroll while cropping
  // (the same contract as the page's other modals).
  useEffect(() => {
    if (!imageSrc) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [imageSrc, onClose]);

  if (!imageSrc) return null;

  const F = frameSize;
  // Cover-fit scale: at zoom 1 the image exactly covers the square.
  const baseScale = natural ? Math.max(F / natural.w, F / natural.h) : 1;
  const scale = baseScale * zoom;
  const dispW = natural ? natural.w * scale : F;
  const dispH = natural ? natural.h * scale : F;
  const maxOx = Math.max(0, (dispW - F) / 2);
  const maxOy = Math.max(0, (dispH - F) / 2);
  const ox = Math.max(-maxOx, Math.min(maxOx, offset.x));
  const oy = Math.max(-maxOy, Math.min(maxOy, offset.y));
  const imgLeft = (F - dispW) / 2 + ox;
  const imgTop = (F - dispH) / 2 + oy;

  const handlePointerDown = (e: React.PointerEvent) => {
    if (!natural || applying) return;
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    dragRef.current = { x: e.clientX, y: e.clientY, ox, oy };
  };
  const handlePointerMove = (e: React.PointerEvent) => {
    const drag = dragRef.current;
    if (!drag) return;
    setOffset({
      x: drag.ox + (e.clientX - drag.x),
      y: drag.oy + (e.clientY - drag.y),
    });
  };
  const endDrag = () => {
    dragRef.current = null;
  };

  const handleConfirm = async () => {
    const img = imgRef.current;
    if (!img || !natural || applying) return;
    setApplying(true);
    setApplyError("");
    try {
      // The frame's square in source-image coordinates — a square
      // region rendered onto a square canvas: 1:1 by construction.
      const sx = -imgLeft / scale;
      const sy = -imgTop / scale;
      const side = F / scale;
      const out = Math.min(OUTPUT_MAX, Math.max(1, Math.round(side)));
      const canvas = document.createElement("canvas");
      canvas.width = out;
      canvas.height = out;
      const ctx = canvas.getContext("2d");
      if (!ctx) throw new Error("That photo could not be processed.");
      ctx.drawImage(img, sx, sy, side, side, 0, 0, out, out);
      await onConfirm(canvas.toDataURL("image/jpeg", 0.9));
      onClose();
    } catch (err) {
      setApplyError(err instanceof Error ? err.message : "Could not save your photo.");
      setApplying(false);
    }
  };

  return (
    <div className="auth-root" role="dialog" aria-modal="true" aria-labelledby="crop-photo-h">
      <button type="button" aria-label="Close" className="auth__backdrop" onClick={onClose} />
      <div className="auth__card">
        <div className="auth__head">
          <div>
            <h2 id="crop-photo-h" className="auth__title">
              Set Photo
            </h2>
            <p className="mt-1 text-xs text-muted">
              Drag the photo to position it — the circle is how it will appear. Only the square
              inside is saved.
            </p>
          </div>
          <button
            type="button"
            aria-label="Close"
            onClick={onClose}
            className="text-muted transition hover:text-cream"
          >
            <IconClose className="h-5 w-5" />
          </button>
        </div>

        <div className="mt-5 flex flex-col items-center gap-4">
          <div
            ref={frameRef}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={endDrag}
            onPointerCancel={endDrag}
            data-crop-frame
            className="relative aspect-square w-[320px] max-w-[78vw] touch-none select-none overflow-hidden rounded-2xl border border-line bg-ink-2"
            style={{ cursor: natural ? "grab" : "default" }}
          >
            {natural ? (
              <>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={imageSrc}
                  alt=""
                  draggable={false}
                  className="pointer-events-none absolute max-w-none"
                  style={{ width: dispW, height: dispH, left: imgLeft, top: imgTop }}
                />
                {/* Circular mask: everything outside the circle is dimmed. */}
                <div className="pointer-events-none absolute inset-0">
                  <div className="h-full w-full rounded-full border-2 border-white/90 shadow-[0_0_0_9999px_rgba(0,0,0,0.5)]" />
                </div>
              </>
            ) : (
              <div className="absolute inset-0 flex items-center justify-center px-6 text-center text-sm text-muted">
                {loadError ? (
                  <span className="text-primary">{loadError}</span>
                ) : (
                  "Loading photo…"
                )}
              </div>
            )}
          </div>

          {/* Zoom */}
          <div className="flex w-[320px] max-w-[78vw] items-center gap-2.5">
            <span className="text-xs font-medium text-muted">Zoom</span>
            <input
              type="range"
              min={1}
              max={3}
              step={0.01}
              value={zoom}
              disabled={!natural || applying}
              onChange={(e) => setZoom(Number(e.target.value))}
              aria-label="Zoom"
              className="flex-1"
              style={{ accentColor: "var(--sf-primary)" }}
            />
            <span className="w-10 text-right text-[11px] font-semibold text-muted">
              {Math.round(zoom * 100)}%
            </span>
          </div>

          {applyError && (
            <p className="text-center text-sm text-primary" role="alert">
              {applyError}
            </p>
          )}
        </div>

        <div className="mt-6 flex gap-2.5">
          <button
            type="button"
            onClick={onClose}
            disabled={applying}
            className="btn btn--ghost flex-1 disabled:opacity-60"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => void handleConfirm()}
            disabled={!natural || applying}
            className="btn btn--primary flex-1 disabled:opacity-60"
          >
            {applying ? "Saving…" : "Use Photo"}
          </button>
        </div>
      </div>
    </div>
  );
}
