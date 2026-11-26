"use client";

import { useState } from "react";
import { apiCall, type CatalogProduct } from "@/lib/api";
import { useShop } from "@/lib/store";

/** The review form — account-only (Ahsan, 2026-11-26: "without
 *  login ye review na ho or review me email na ly"). A guest
 *  sees a sign-in prompt in place of the form (the button opens
 *  the auth popup; once signed in, the form takes its place).
 *  A signed-in customer gets rating + title + text ONLY — the
 *  name/email inputs are gone for good: the review carries the
 *  account's own identity, which the backend takes from the
 *  session token, and a quiet "Posting as …" line says whose.
 *  Reviews still land as pending, exactly as before. */
export default function ReviewForm({ product }: { product: CatalogProduct }) {
  const { user, ready, openAuth } = useShop();
  const [rating, setRating] = useState(5);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [state, setState] = useState<"idle" | "sending" | "done" | "error">("idle");
  const [message, setMessage] = useState("");

  if (!ready) {
    return (
      <div className="panel panel--pad">
        <p className="text-sm text-muted">Loading…</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="panel panel--pad">
        <h3 className="font-display text-xl font-medium text-cream">Write a review</h3>
        <p className="mt-2 text-sm text-muted">Sign in to write a review.</p>
        <button type="button" className="btn btn--primary btn--sm mt-4" onClick={() => openAuth("login")}>
          Sign In
        </button>
      </div>
    );
  }

  if (state === "done") {
    return (
      <div className="panel panel--pad">
        <p className="font-semibold text-cream">Thank you for your review.</p>
        <p className="mt-1.5 text-sm text-muted">It is awaiting approval and will appear here once approved.</p>
      </div>
    );
  }

  const postingAs = [user.firstName, user.lastName].filter(Boolean).join(" ") || user.email;

  return (
    <form
      className="panel panel--pad"
      onSubmit={async (e) => {
        e.preventDefault();
        setState("sending");
        setMessage("");
        try {
          await apiCall(
            "POST",
            "/api/storefront/reviews",
            {
              product: product._id,
              rating,
              title,
              content,
            },
            user.token,
          );
          setState("done");
        } catch (error) {
          setState("error");
          setMessage(error instanceof Error ? error.message : "Could not submit your review.");
        }
      }}
    >
      <h3 className="font-display text-xl font-medium text-cream">Write a review</h3>
      <p className="mt-1.5 text-sm text-muted">Posting as {postingAs}</p>
      <div className="mt-3 flex items-center gap-0.5" role="radiogroup" aria-label="Your rating">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            role="radio"
            aria-checked={rating === star}
            aria-label={`${star} star${star > 1 ? "s" : ""}`}
            onClick={() => setRating(star)}
            className={`flex h-9 w-9 items-center justify-center text-2xl transition ${star <= rating ? "text-primary" : "text-line hover:text-primary/60"}`}
          >
            ★
          </button>
        ))}
        <span className="ml-2 text-sm text-muted">{rating}/5</span>
      </div>
      <input required value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Review title" className="input mt-3" aria-label="Review title" maxLength={100} />
      <textarea required value={content} onChange={(e) => setContent(e.target.value)} placeholder="What did you think of this product?" rows={4} className="input mt-3" aria-label="Review text" maxLength={1000} />
      {state === "error" && <p className="mt-3 text-sm text-primary" role="alert">{message}</p>}
      <button type="submit" disabled={state === "sending"} className="btn btn--primary btn--sm mt-5 disabled:opacity-60">
        {state === "sending" ? "Submitting…" : "Submit Review"}
      </button>
    </form>
  );
}
