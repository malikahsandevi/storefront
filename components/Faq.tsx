"use client";

import { useState } from "react";

/** The FAQ accordion: hairline rows, a rotating plus in a circle,
 *  one answer open at a time. Content comes from the caller
 *  (real store facts only). */
export default function Faq({ items }: { items: { q: string; a: string }[] }) {
  const [open, setOpen] = useState(0);
  return (
    <div className="faq" data-reveal>
      {items.map((item, i) => {
        const isOpen = open === i;
        return (
          <div key={item.q} className="faq__item" data-open={isOpen}>
            <button
              type="button"
              className="faq__q"
              aria-expanded={isOpen}
              onClick={() => setOpen(isOpen ? -1 : i)}
            >
              <span>{item.q}</span>
              <span className="fx" aria-hidden>+</span>
            </button>
            {isOpen && <p className="faq__a">{item.a}</p>}
          </div>
        );
      })}
    </div>
  );
}
