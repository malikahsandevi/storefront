"use client";

import { useState } from "react";
import { apiCall, type CatalogProduct } from "@/lib/api";
import { useShop } from "@/lib/store";

export default function ReviewForm({ product }: { product: CatalogProduct }) {
  const { user } = useShop();
  const [rating, setRating] = useState(5);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [firstName, setFirstName] = useState("");
  const [email, setEmail] = useState("");
  const [state, setState] = useState<"idle" | "sending" | "done" | "error">("idle");
  const [message, setMessage] = useState("");
  const inputCls =
    "w-full border border-line bg-ink-2 px-3.5 py-2.5 text-sm text-cream placeholder:text-muted-2";

  if (state === "done") {
    return (
      <div className="border border-line bg-surface p-6">
        <p className="font-semibold text-cream">Thank you for your review.</p>
        <p className="mt-1 text-sm text-muted">It is awaiting approval and will appear here once approved.</p>
      </div>
    );
  }

  return (
    <form
      className="border border-line bg-surface p-6"
      onSubmit={async (e) => {
        e.preventDefault();
        setState("sending");
        setMessage("");
        try {
          await apiCall("POST", "/api/storefront/reviews", {
            product: product._id,
            rating,
            title,
            content,
            customer: {
              firstName: user ? user.firstName : firstName,
              lastName: user ? user.lastName : "",
              email: user ? user.email : email,
            },
          });
          setState("done");
        } catch (error) {
          setState("error");
          setMessage(error instanceof Error ? error.message : "Could not submit your review.");
        }
      }}
    >
      <h3 className="font-display text-lg font-extrabold uppercase tracking-tight text-cream">Write a review</h3>
      <div className="mt-3 flex items-center gap-1" role="radiogroup" aria-label="Your rating">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            role="radio"
            aria-checked={rating === star}
            aria-label={`${star} star${star > 1 ? "s" : ""}`}
            onClick={() => setRating(star)}
            className={`text-2xl transition ${star <= rating ? "text-amber-400" : "text-line hover:text-amber-400/60"}`}
          >
            ★
          </button>
        ))}
        <span className="ml-2 text-sm text-muted">{rating}/5</span>
      </div>
      {!user && (
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <input required value={firstName} onChange={(e) => setFirstName(e.target.value)} placeholder="Your name" className={inputCls} aria-label="Your name" />
          <input required type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Your email" className={inputCls} aria-label="Your email" />
        </div>
      )}
      <input required value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Review title" className={`${inputCls} mt-3`} aria-label="Review title" maxLength={100} />
      <textarea required value={content} onChange={(e) => setContent(e.target.value)} placeholder="What did you think of this product?" rows={4} className={`${inputCls} mt-3`} aria-label="Review text" maxLength={1000} />
      {state === "error" && <p className="mt-3 text-sm text-primary" role="alert">{message}</p>}
      <button
        type="submit"
        disabled={state === "sending"}
        className="mt-4 bg-primary px-7 py-3 font-display text-[13px] font-bold uppercase tracking-[0.1em] text-white transition hover:bg-primary-dark active:scale-[0.98] disabled:opacity-60"
      >
        {state === "sending" ? "Submitting…" : "Submit Review"}
      </button>
    </form>
  );
}
