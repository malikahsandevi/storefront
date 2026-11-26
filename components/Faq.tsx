"use client";

import { useId, useState } from "react";

/** The FAQ accordion: hairline rows, a rotating plus in a circle,
 *  one answer open at a time. Content comes from the caller
 *  (real store facts only). EVERY answer is always rendered —
 *  collapsed answers are clipped by CSS, never unmounted — so
 *  the full text is in the server-rendered HTML for crawlers
 *  and no-JS readers, exactly as it is for clickers. */
export default function Faq({ items }: { items: { q: string; a: string }[] }) {
  const [open, setOpen] = useState(0);
  const uid = useId().replace(/[^a-zA-Z0-9]/g, "");
  return (
    <div className="faq" data-reveal>
      {items.map((item, i) => {
        const isOpen = open === i;
        const panelId = `faq-${uid}-${i}`;
        return (
          <div key={item.q} className="faq__item" data-open={isOpen}>
            <button
              type="button"
              className="faq__q"
              aria-expanded={isOpen}
              aria-controls={panelId}
              onClick={() => setOpen(isOpen ? -1 : i)}
            >
              <span>{item.q}</span>
              <span className="fx" aria-hidden>+</span>
            </button>
            <div className="faq__body" id={panelId} aria-hidden={!isOpen}>
              <p className="faq__a">{item.a}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
