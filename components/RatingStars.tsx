export default function RatingStars({ rating, className = "" }: { rating: number; className?: string }) {
  const full = Math.round(Math.max(0, Math.min(5, rating)));
  return (
    <span className={className || "text-amber-400"} aria-label={`Rated ${rating} out of 5`}>
      <span aria-hidden>{"★".repeat(full)}{"☆".repeat(5 - full)}</span>
    </span>
  );
}
