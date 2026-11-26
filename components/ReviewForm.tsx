"use client";

import { useState } from "react";
import { apiCall, type CatalogProduct } from "@/lib/api";
import { useShop } from "@/lib/store";

/** The review form: same submission wiring as before (signed-in
 *  customers post as themselves; guests give a name + email and
 *  the review lands as pending), restyled as a vault panel. */
export default function ReviewForm({ product }: { product: CatalogProduct }) {
  const { user } = useShop();
  const [rating, setRating] = useState(5);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [firstName, setFirstName] = useState("");
  const [email, setEmail] = useState("");
  const [state, setState] = useState<"idle" | "sending" | "done" | "error">("idle");
  const [message, setMessage] = useState("");

  if (state === "done") {
    return (
      <div className="panel panel--pad">
        <p className="font-semibold text-cream">Thank you for your review.</p>
        <p className="mt-1.5 text-sm text-muted">It is awaiting approval and will appear here once approved.</p>
      </div>
    );
  }

  return (
    <form
      className="panel panel--pad"
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
      <h3 className="font-display text-xl font-medium text-cream">Write a review</h3>
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
      {!user && (
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <input required value={firstName} onChange={(e) => setFirstName(e.target.value)} placeholder="Your name" className="input" aria-label="Your name" />
          <input required type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Your email" className="input" aria-label="Your email" />
        </div>
      )}
      <input required value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Review title" className="input mt-3" aria-label="Review title" maxLength={100} />
      <textarea required value={content} onChange={(e) => setContent(e.target.value)} placeholder="What did you think of this product?" rows={4} className="input mt-3" aria-label="Review text" maxLength={1000} />
      {state === "error" && <p className="mt-3 text-sm text-primary" role="alert">{message}</p>}
      <button type="submit" disabled={state === "sending"} className="btn btn--primary btn--sm mt-5 disabled:opacity-60">
        {state === "sending" ? "Submitting…" : "Submit Review"}
      </button>
    </form>
  );
}
