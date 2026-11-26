"use client";

import { useLayoutEffect, useRef, useState, type ReactNode } from "react";
import { IconCaretDown } from "./icons";

/**
 * The catalog facet bar's phone behaviour: on small screens the
 * filter form starts COLLAPSED behind a Filters row (the panel
 * otherwise eats the whole first screen before a single product),
 * and expands in place on tap. When any filter is active it starts
 * expanded, so the visitor sees what is filtering their results.
 * Desktop never collapses — the toggle is not even rendered there
 * (CSS), and the body is always visible. The form itself is passed
 * in as children and stays a plain GET form.
 */
export default function FilterBar({
  activeCount,
  children,
}: {
  activeCount: number;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(true);
  const settled = useRef(false);

  // Settle the initial state before first paint: phones with no
  // active filters start collapsed; anything else stays open.
  useLayoutEffect(() => {
    if (settled.current) return;
    settled.current = true;
    if (
      activeCount === 0 &&
      window.matchMedia("(max-width: 749px)").matches
    ) {
      // One-time pre-paint settle (not a render loop): the layout
      // effect exists precisely so the collapse lands before the
      // visitor sees the panel — the pattern this rule warns about
      // (cascading renders) cannot occur behind the settled ref.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setOpen(false);
    }
  }, [activeCount]);

  return (
    <div className="filterbar">
      <button
        type="button"
        className="filterbar__toggle"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
      >
        <span className="filterbar__label">
          Filters
          {activeCount > 0 && (
            <span className="filterbar__count">
              {activeCount} active
            </span>
          )}
        </span>
        <IconCaretDown
          className={`filterbar__chev${open ? " filterbar__chev--open" : ""}`}
        />
      </button>
      <div
        className={`filterbar__body${open ? "" : " filterbar__body--closed"}`}
      >
        {children}
      </div>
    </div>
  );
}
