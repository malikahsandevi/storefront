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
  return (
    <div data-reveal className="mb-9">
      <div className="flex items-center gap-3">
        <span aria-hidden className="mono-label text-primary">{no}</span>
        <span aria-hidden className="mono-label text-muted-2">{title}</span>
        <span aria-hidden className="kicker-bar" />
      </div>
      <div className="mt-3 flex items-end justify-between gap-4">
        <h2
          id={id}
          className="font-display text-3xl font-extrabold uppercase tracking-tight text-cream sm:text-4xl"
        >
          {title}
        </h2>
        {href && (
          <Link
            href={href}
            className="shrink-0 text-sm font-semibold text-muted underline-offset-4 transition hover:text-primary hover:underline"
          >
            View all →
          </Link>
        )}
      </div>
    </div>
  );
}
