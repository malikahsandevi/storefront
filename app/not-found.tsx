import Link from "next/link";

export default function NotFound() {
  return (
    <div className="py-24 text-center">
      <p className="grad-primary bg-clip-text font-display text-8xl font-black tracking-tighter text-transparent sm:text-9xl">404</p>
      <h1 className="mt-4 font-display text-[clamp(2.1rem,4.5vw,3rem)] font-normal leading-[1.05] tracking-[-0.02em] text-cream">Page not found</h1>
      <p className="mx-auto mt-3 max-w-md text-muted">
        The page you are looking for does not exist or has moved. Browse the shop instead — everything there is real and in stock.
      </p>
      <div className="mt-7 flex justify-center gap-3">
        <Link href="/shop" className="btn-primary-pill btn-shine px-8 py-4 font-display text-[13px] font-semibold uppercase tracking-[0.08em]">
          Go to Shop
        </Link>
        <Link href="/" className="btn-ghost-pill px-8 py-3 font-semibold text-muted hover:text-cream">
          Home
        </Link>
      </div>
    </div>
  );
}
