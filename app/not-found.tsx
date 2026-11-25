import Link from "next/link";

export default function NotFound() {
  return (
    <div className="py-24 text-center">
      <p className="bg-gradient-to-br from-primary to-secondary bg-clip-text font-display text-8xl font-black tracking-tighter text-transparent sm:text-9xl">404</p>
      <h1 className="mt-4 font-display text-4xl font-black uppercase tracking-tight text-cream">Page not found</h1>
      <p className="mx-auto mt-3 max-w-md text-muted">
        The page you are looking for does not exist or has moved. Browse the shop instead — everything there is real and in stock.
      </p>
      <div className="mt-7 flex justify-center gap-3">
        <Link href="/shop" className="bg-primary px-8 py-3.5 font-display text-[13px] font-bold uppercase tracking-[0.1em] text-white transition hover:bg-primary-dark">
          Go to Shop
        </Link>
        <Link href="/" className="border border-line px-8 py-3 font-semibold text-muted transition hover:border-primary hover:text-cream">
          Home
        </Link>
      </div>
    </div>
  );
}
