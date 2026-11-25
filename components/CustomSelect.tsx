"use client";

import { useEffect, useId, useRef, useState } from "react";
import { IconCaretDown, IconCheck } from "./icons";

export interface CustomSelectOption {
  value: string;
  label: string;
}

/**
 * The storefront's own dropdown — a trigger button in the shared
 * `.input` box language plus a glass listbox panel, driven entirely
 * by the --sf-* theme tokens (correct in light and dark). Replaces
 * every native select element: identical options, values and
 * change behaviour, only the rendering is custom (Ahsan's standing
 * rule: no browser-default controls anywhere in the frontend).
 *
 * Works controlled (value + onChange) or uncontrolled
 * (defaultValue). When `name` is given it also renders a hidden
 * input so a plain GET form submits the value exactly as a native
 * select would. Keyboard: arrows move, Enter/Space select,
 * Escape/Tab close; the panel closes on outside click.
 */
export default function CustomSelect({
  id,
  name,
  value,
  defaultValue,
  onChange,
  options,
  className = "",
  ariaLabel,
}: {
  id?: string;
  name?: string;
  value?: string;
  defaultValue?: string;
  onChange?: (value: string) => void;
  options: CustomSelectOption[];
  className?: string;
  ariaLabel?: string;
}) {
  const controlled = value !== undefined;
  const [inner, setInner] = useState(defaultValue ?? options[0]?.value ?? "");
  const current = controlled ? value : inner;
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const reactId = useId().replace(/[^a-zA-Z0-9_-]/g, "");
  const listId = `${reactId}-list`;
  const optionId = (i: number) => `${reactId}-opt-${i}`;

  const selectedIndex = Math.max(
    0,
    options.findIndex((o) => o.value === current),
  );
  const selectedLabel = options[selectedIndex]?.label ?? "";

  useEffect(() => {
    if (!open) return;
    setActive(selectedIndex);
    const onDown = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open ]);

  const choose = (v: string) => {
    if (!controlled) setInner(v);
    onChange?.(v);
    setOpen(false);
    triggerRef.current?.focus();
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (!open) {
      if (["ArrowDown", "ArrowUp", "Enter", " "].includes(e.key)) {
        e.preventDefault();
        setOpen(true);
      }
      return;
    }
    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setActive((i) => Math.min(options.length - 1, i + 1));
        break;
      case "ArrowUp":
        e.preventDefault();
        setActive((i) => Math.max(0, i - 1));
        break;
      case "Home":
        e.preventDefault();
        setActive(0);
        break;
      case "End":
        e.preventDefault();
        setActive(options.length - 1);
        break;
      case "Enter":
      case " ": {
        e.preventDefault();
        const opt = options[active];
        if (opt) choose(opt.value);
        break;
      }
      case "Escape":
        e.preventDefault();
        setOpen(false);
        triggerRef.current?.focus();
        break;
      case "Tab":
        setOpen(false);
        break;
    }
  };

  return (
    <div ref={rootRef} className={`csel ${className}`} onKeyDown={onKeyDown}>
      {name ? <input type="hidden" name={name} value={current} /> : null}
      <button
        ref={triggerRef}
        type="button"
        id={id}
        className="input csel__trigger"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listId}
        aria-activedescendant={open ? optionId(active) : undefined}
        aria-label={ariaLabel}
        onClick={() => setOpen((o) => !o)}
      >
        <span className="csel__value">{selectedLabel}</span>
        <IconCaretDown className="csel__caret" />
      </button>
      {open && (
        <ul role="listbox" id={listId} className="csel__panel" aria-label={ariaLabel}>
          {options.map((opt, i) => {
            const isSelected = opt.value === current;
            return (
              <li
                key={opt.value + ":" + i}
                role="option"
                id={optionId(i)}
                aria-selected={isSelected}
                className={`csel__option${i === active ? " csel__option--active" : ""}${isSelected ? " csel__option--selected" : ""}`}
                onMouseEnter={() => setActive(i)}
                onMouseDown={(e) => {
                  e.preventDefault();
                  choose(opt.value);
                }}
              >
                <span className="csel__value">{opt.label}</span>
                {isSelected && <IconCheck className="csel__check" />}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
