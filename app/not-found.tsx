import Link from "next/link";

export default function NotFound() {
  return (
    <div className="py-24 text-center">
      <p className="bg-gradient-to-br from-primary to-rose-400 bg-clip-text text-8xl font-black tracking-tighter text-transparent sm:text-9xl">404</p>
      <h1 className="mt-4 text-4xl font-extrabold tracking-tight text-cream">Page not found</h1>
      <p className="mx-auto mt-3 max-w-md text-muted">
        The page you are looking for does not exist or has moved. Browse the shop instead — everything there is real and in stock.
      </p>
      <div className="mt-7 flex justify-center gap-3">
        <Link href="/shop" className="rounded-full bg-primary px-8 py-3 font-bold text-white shadow-glow transition hover:bg-primary-dark">
          Go to Shop
        </Link>
        <Link href="/" className="rounded-full border border-line/80 px-8 py-3 font-semibold text-muted transition hover:border-primary hover:text-cream">
          Home
        </Link>
      </div>
    </div>
  );
}
