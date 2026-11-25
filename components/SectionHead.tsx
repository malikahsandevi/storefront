import Link from "next/link";

/**
 * The hodl section signature: a numbered mono kicker (accent index +
 * muted label + a 32px gradient bar that fades out), then the large
 * display H2, with an optional "View all →" link on the right.
 * Numbering is sequential per page and passed in by the caller.
 */
export default function SectionHead({
  no,
  title,
  id,
  href,
}: {
  no: string;
  title: string;
  id?: string;
  href?: string;
}) {
  // hodl treatment: the H2 is set large in the display font at
  // REGULAR weight, sentence case, tight −0.02em tracking, with the
  // final word carrying the accent gradient (their signature move).
  const words = title.trim().split(/\s+/);
  const head = words.length > 1 ? words.slice(0, -1).join(" ") + " " : "";
  const tail = words[words.length - 1];
  return (
    <div data-reveal className="mb-10">
      <div className="flex items-center gap-3">
        <span aria-hidden className="mono-label text-primary">{no}</span>
        <span aria-hidden className="mono-label text-muted-2">{title}</span>
        <span aria-hidden className="kicker-bar" />
      </div>
      <div className="mt-4 flex items-end justify-between gap-4">
        <h2
          id={id}
          className="font-display text-[clamp(2.125rem,4.4vw,3.875rem)] font-normal leading-[1.04] tracking-[-0.02em] text-cream [text-wrap:balance]"
        >
          {head}
          <span className="grad-text">{tail}</span>
        </h2>
        {href && (
          <Link
            href={href}
            className="btn-ghost-pill mb-1 shrink-0 px-5 py-2.5 font-display text-[13px] font-semibold uppercase tracking-[0.08em] text-cream"
          >
            View all →
          </Link>
        )}
      </div>
    </div>
  );
}
