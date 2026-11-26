import type { ReactNode } from "react";

/**
 * The shared frame for the store's policy / information pages
 * (Privacy, Terms, Returns & Refunds, About): the house page
 * header — mono kicker, display title — over one panel of
 * headed sections. Content is passed in as plain sections so
 * each page file stays a readable document.
 */
export interface PolicySection {
  heading: string;
  body: ReactNode[];
}

export default function PolicyLayout({
  label,
  title,
  intro,
  sections,
}: {
  label: string;
  title: ReactNode;
  intro: string;
  sections: PolicySection[];
}) {
  return (
    <div className="wrap pt-10 pb-4 md:pt-14">
      <p className="mono-label text-primary">{label}</p>
      <h1 className="mt-3 font-display text-[clamp(1.9rem,3vw,2.6rem)] font-normal leading-[1.05] tracking-[-0.02em] text-cream">
        {title}
      </h1>
      <p className="mt-4 max-w-2xl text-[15px] leading-relaxed text-muted">{intro}</p>
      <div className="panel panel--pad mt-10 max-w-3xl">
        {sections.map((section, i) => (
          <section key={section.heading} className={i > 0 ? "mt-8" : undefined}>
            <h2 className="font-display text-lg font-medium text-cream">{section.heading}</h2>
            {section.body.map((paragraph, j) => (
              <div key={j} className="mt-2.5 text-sm leading-relaxed text-muted">
                {paragraph}
              </div>
            ))}
          </section>
        ))}
      </div>
    </div>
  );
}
