"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { formatMoney, type CatalogCategory, type CatalogProduct } from "@/lib/api";
import { AddToCartButton } from "./buttons";
import RatingStars from "./RatingStars";
import { IconArrow, IconCheck } from "./icons";

/**
 * The Product Finder — the reference home's first numbered section
 * is a three-question finder terminal; this is the same machine
 * running on our live catalog. Three steps (category, budget,
 * priority) filter the product pool the server fetched, and the
 * result is a real product with its real price and stock. Nothing
 * is stored and no account is needed.
 */
type Answers = { category?: string; budget?: string; priority?: string };

const BUDGETS = [
  { id: "u50", title: "Under $50", desc: "Everyday picks that stay under fifty.", test: (p: number) => p < 50 },
  { id: "m150", title: "$50 – $150", desc: "The middle range, where most best-sellers live.", test: (p: number) => p >= 50 && p <= 150 },
  { id: "o150", title: "Over $150", desc: "Premium gear with the full feature set.", test: (p: number) => p > 150 },
  { id: "any", title: "Any budget", desc: "Show me the best fit, whatever it costs.", test: (_p: number) => true },
];

const PRIORITIES = [
  { id: "rated", title: "Top rated", desc: "The products other customers rated highest." },
  { id: "newest", title: "Newest", desc: "The latest additions to the catalog." },
  { id: "lowest", title: "Lowest price", desc: "The most affordable fit for my answers." },
  { id: "saving", title: "Biggest saving", desc: "The deepest discount against the compare price." },
];

export default function Finder({
  products,
  categories,
  currency,
}: {
  products: CatalogProduct[];
  categories: CatalogCategory[];
  currency: string;
}) {
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Answers>({});
  const [done, setDone] = useState(false);

  const topCategories = useMemo(
    () => categories.filter((c) => !c.parent && c.productsCount > 0).slice(0, 4),
    [categories],
  );

  const result = useMemo(() => {
    if (!done) return null;
    let pool = products.slice();
    if (answers.category && answers.category !== "any") {
      pool = pool.filter((p) => p.category?.slug === answers.category);
    }
    const budget = BUDGETS.find((b) => b.id === answers.budget) || BUDGETS[3];
    pool = pool.filter((p) => budget.test(p.price));
    const inStock = pool.filter((p) => p.stock > 0);
    if (inStock.length) pool = inStock;
    const saving = (p: CatalogProduct) =>
      p.comparePrice && p.comparePrice > p.price ? p.comparePrice - p.price : 0;
    switch (answers.priority) {
      case "rated":
        pool.sort((a, b) => b.averageRating - a.averageRating || b.reviewCount - a.reviewCount);
        break;
      case "newest":
        pool.sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt));
        break;
      case "lowest":
        pool.sort((a, b) => a.price - b.price);
        break;
      case "saving":
        pool.sort((a, b) => saving(b) - saving(a));
        break;
    }
    return { pick: pool[0] || null, also: pool[1] || null };
  }, [done, answers, products]);

  const choose = (patch: Answers) => {
    const next = { ...answers, ...patch };
    setAnswers(next);
    if (step < 2) {
      setStep(step + 1);
    } else {
      setDone(true);
    }
  };

  const restart = () => {
    setAnswers({});
    setStep(0);
    setDone(false);
  };

  const questions = [
    {
      q: "What are you shopping for?",
      hint: "Pick a category — the finder only recommends from the live catalog.",
      options: [
        ...topCategories.map((c) => ({
          id: c.slug,
          title: c.name,
          desc: `${c.productsCount} ${c.productsCount === 1 ? "product" : "products"} in this category.`,
          icon: c.name.charAt(0).toUpperCase(),
        })),
        { id: "any", title: "Anything", desc: "Surprise me — search the whole catalog.", icon: "✦" },
      ],
      pick: (id: string) => choose({ category: id }),
    },
    {
      q: "What is your budget?",
      hint: "Prices are the store's live prices — the recommendation stays inside your range.",
      options: BUDGETS.map((b) => ({ id: b.id, title: b.title, desc: b.desc, icon: "$" })),
      pick: (id: string) => choose({ budget: id }),
    },
    {
      q: "What matters most?",
      hint: "Last one — this decides how the matches are ranked.",
      options: PRIORITIES.map((p) => ({ id: p.id, title: p.title, desc: p.desc, icon: "✓" })),
      pick: (id: string) => choose({ priority: id }),
    },
  ];

  const current = questions[step];

  return (
    <div className="find__term">
      <div className="find__bar">
        <span className="find__dots" aria-hidden>
          <i />
          <i />
          <i />
        </span>
        <span>{done ? "Your recommendation" : `Step ${step + 1} of 3`}</span>
      </div>
      <div className="find__progress" aria-hidden>
        {[0, 1, 2].map((i) => (
          <span key={i} className={done || i <= step ? "is-done" : ""} />
        ))}
      </div>

      {!done ? (
        <>
          <div className="find__step" key={step}>
            <p className="find__q">{current.q}</p>
            <p className="find__hint">{current.hint}</p>
            <div className="find__opts">
              {current.options.map((option) => (
                <button
                  key={option.id}
                  type="button"
                  className="find__opt"
                  onClick={() => current.pick(option.id)}
                >
                  <span className="find__opt-ico" aria-hidden>{option.icon}</span>
                  <span className="find__opt-t">{option.title}</span>
                  <span className="find__opt-d">{option.desc}</span>
                </button>
              ))}
            </div>
          </div>
          <div className="find__nav">
            <button
              type="button"
              className="find__back"
              disabled={step === 0}
              onClick={() => setStep((s) => Math.max(0, s - 1))}
            >
              ← Back
            </button>
            <span>
              Question {step + 1} / 3
            </span>
          </div>
        </>
      ) : (
        <div className="find__result">
          {result?.pick ? (
            <>
              <div className="find__res">
                <Link href={`/product/${result.pick.slug}`} className="find__res-media">
                  {result.pick.image ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={result.pick.image} alt={result.pick.name} loading="lazy" />
                  ) : (
                    <span className="flex h-full w-full items-center justify-center font-display text-5xl text-line">
                      {result.pick.name.charAt(0)}
                    </span>
                  )}
                </Link>
                <div>
                  <p className="find__res-tag">Your recommendation</p>
                  <h3 className="find__res-name">
                    <Link href={`/product/${result.pick.slug}`}>{result.pick.name}</Link>
                  </h3>
                  {result.pick.reviewCount > 0 && (
                    <p className="mt-2.5 flex items-center gap-2 text-sm text-muted">
                      <RatingStars rating={result.pick.averageRating} />
                      {result.pick.averageRating.toFixed(1)} · {result.pick.reviewCount}{" "}
                      {result.pick.reviewCount === 1 ? "review" : "reviews"}
                    </p>
                  )}
                  <p className="mt-2.5 flex items-center gap-2 text-sm text-muted">
                    <IconCheck className="h-4 w-4 text-primary" />
                    {result.pick.stock > 0
                      ? `In stock — ${result.pick.stock} available`
                      : "Currently out of stock"}
                  </p>
                  <p className="find__res-price">
                    {formatMoney(result.pick.price, currency)}
                    {result.pick.comparePrice && result.pick.comparePrice > result.pick.price && (
                      <s>{formatMoney(result.pick.comparePrice, currency)}</s>
                    )}
                  </p>
                  <div className="find__res-actions">
                    <AddToCartButton product={result.pick} className="btn--sm" />
                    <Link href={`/product/${result.pick.slug}`} className="btn btn--ghost btn--sm">
                      View product <IconArrow className="arr h-4 w-4" />
                    </Link>
                  </div>
                </div>
              </div>
              {result.also && (
                <div className="find__foot">
                  <p className="text-sm text-muted">
                    Also worth a look:{" "}
                    <Link href={`/product/${result.also.slug}`} className="font-semibold text-cream underline-offset-4 hover:underline">
                      {result.also.name}
                    </Link>{" "}
                    — {formatMoney(result.also.price, currency)}
                  </p>
                  <button type="button" className="find__back" onClick={restart}>
                    ↺ Start over
                  </button>
                </div>
              )}
            </>
          ) : (
            <div className="py-4 text-center">
              <p className="font-display text-xl text-cream">No product matches that combination yet.</p>
              <p className="mx-auto mt-2 max-w-md text-sm text-muted">
                Try a different budget or category — or browse the full catalog instead.
              </p>
              <div className="mt-5 flex flex-wrap justify-center gap-3">
                <button type="button" className="btn btn--primary btn--sm" onClick={restart}>
                  Start over
                </button>
                <Link href="/shop" className="btn btn--ghost btn--sm">
                  Browse the shop
                </Link>
              </div>
            </div>
          )}
        </div>
      )}
      <p className="find__disclaimer">
        This finder is a guide, not a promise: it ranks the live catalog by your answers, and
        prices and stock are always confirmed at checkout. Nothing you answer is stored.
      </p>
    </div>
  );
}
