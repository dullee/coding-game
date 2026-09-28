export function Stars({ count, className = "" }: { count: number; className?: string }) {
  return (
    <span className={`tracking-wider ${className}`} aria-label={`${count} of 3 stars`}>
      {[0, 1, 2].map((i) => (
        <span key={i} className={i < count ? "text-warn" : "text-border"}>★</span>
      ))}
    </span>
  );
}

export const starsFor = (points: number) => (points >= 900 ? 3 : points >= 700 ? 2 : points >= 500 ? 1 : 0);
