// Shared stroke icons (20px, currentColor) in the reference design's
// line style. Pure presentational SVGs — no behaviour attached.

type P = { className?: string };

const base = {
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.7,
  strokeLinecap: "round",
  strokeLinejoin: "round",
  viewBox: "0 0 24 24",
  "aria-hidden": true,
} as const;

export function IconCheck({ className }: P) {
  return (
    <svg {...base} className={className}>
      <path d="M4 12.5 9.5 18 20 6.5" />
    </svg>
  );
}

export function IconArrow({ className }: P) {
  return (
    <svg {...base} className={className}>
      <path d="M4 12h15" />
      <path d="m13 6 6 6-6 6" />
    </svg>
  );
}

export function IconSearch({ className }: P) {
  return (
    <svg {...base} className={className}>
      <circle cx="11" cy="11" r="7" />
      <path d="m20.5 20.5-4.6-4.6" />
    </svg>
  );
}

export function IconBag({ className }: P) {
  return (
    <svg {...base} className={className}>
      <path d="M5.5 8h15l-1.6 10.2a1.5 1.5 0 0 1-1.5 1.3H8.4a1.5 1.5 0 0 1-1.5-1.2L5.5 8Z" />
      <path d="M8.8 10V6.8a3.2 3.2 0 0 1 6.4 0V10" />
    </svg>
  );
}

export function IconHeart({ className }: P) {
  return (
    <svg {...base} className={className}>
      <path d="M12 20.5C7 16.5 3.5 13.2 3.5 9.6 3.5 7.2 5.3 5.5 7.6 5.5c1.7 0 3.4 1 4.4 2.6.9-1.6 2.7-2.6 4.4-2.6 2.3 0 4.1 1.7 4.1 4.1 0 3.6-3.5 6.9-8.5 10.9Z" />
    </svg>
  );
}

export function IconUser({ className }: P) {
  return (
    <svg {...base} className={className}>
      <circle cx="12" cy="8" r="3.6" />
      <path d="M5 20c1.2-3.2 3.8-4.8 7-4.8s5.8 1.6 7 4.8" />
    </svg>
  );
}

export function IconBox({ className }: P) {
  return (
    <svg {...base} className={className}>
      <path d="M12 3 4 7v10l8 4 8-4V7l-8-4Z" />
      <path d="M4 7l8 4 8-4" />
      <path d="M12 11v10" />
    </svg>
  );
}

export function IconMail({ className }: P) {
  return (
    <svg {...base} className={className}>
      <rect x="3.5" y="5.5" width="17" height="13" rx="2" />
      <path d="m4 7 8 6 8-6" />
    </svg>
  );
}

export function IconPhone({ className }: P) {
  return (
    <svg {...base} className={className}>
      <path d="M6.5 3.5h3l1.5 4-2 1.5a12 12 0 0 0 5.5 5.5l1.5-2 4 1.5v3c0 .8-.7 1.5-1.5 1.4C10.8 16.9 7.1 13.2 6.1 5c-.1-.8.6-1.5 1.4-1.5Z" />
    </svg>
  );
}

export function IconClose({ className }: P) {
  return (
    <svg {...base} className={className}>
      <path d="M6 6l12 12M18 6 6 18" />
    </svg>
  );
}

export function IconShield({ className }: P) {
  return (
    <svg {...base} className={className}>
      <path d="M12 3.5 5 6v5.5c0 4.4 2.9 7.4 7 9 4.1-1.6 7-4.6 7-9V6l-7-2.5Z" />
      <path d="m9 11.8 2.2 2.2L15.5 9.5" />
    </svg>
  );
}

export function IconTruck({ className }: P) {
  return (
    <svg {...base} className={className}>
      <path d="M3 7h11v9H3zM14 10h4l3 3v3h-7" />
      <circle cx="7" cy="18" r="1.8" />
      <circle cx="17" cy="18" r="1.8" />
    </svg>
  );
}

export function IconChat({ className }: P) {
  return (
    <svg {...base} className={className}>
      <path d="M4 6.5A2.5 2.5 0 0 1 6.5 4h11A2.5 2.5 0 0 1 20 6.5v7a2.5 2.5 0 0 1-2.5 2.5H12l-4.5 4v-4H6.5A2.5 2.5 0 0 1 4 13.5v-7Z" />
    </svg>
  );
}
