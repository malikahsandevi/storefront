import Link from "next/link";
import type { ReactNode } from "react";
import { IconArrow } from "./icons";

/**
 * The reference store's section signature: a numbered mono kicker
 * (accent index + muted label + a 32px gradient bar that fades
 * out), then the large display H2 at regular weight — the emphasised
 * words inside carry the accent gradient (pass them as <strong>).
 * `split` puts a ghost "View all" pill at the right, `center`
 * centres the block, exactly like the reference's head variants.
 */
export default function SectionHead({
  no,
  label,
  title,
  lead,
  id,
  href,
  hrefLabel = "View all",
  center = false,
  split = false,
}: {
  no: string;
  label: string;
  title: ReactNode;
  lead?: string;
  id?: string;
  href?: string;
  hrefLabel?: string;
  center?: boolean;
  split?: boolean;
}) {
  const head = (
    <div>
      <p className="kicker">
        <span className="kicker__idx" aria-hidden>{no}</span>
        <span>{label}</span>
        <span className="kicker__bar" aria-hidden />
      </p>
      <h2 id={id} className="h2">{title}</h2>
      {lead && <p className="lead">{lead}</p>}
    </div>
  );
  if (split) {
    return (
      <div data-reveal className="head head--split">
        {head}
        {href && (
          <Link href={href} className="btn btn--ghost btn--sm mb-1 shrink-0">
            {hrefLabel} <IconArrow className="arr h-4 w-4" />
          </Link>
        )}
      </div>
    );
  }
  return (
    <div data-reveal className={`head${center ? " head--center" : ""}`}>
      {head}
    </div>
  );
}
