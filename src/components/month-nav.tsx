import Link from "next/link";

function ChevronLeft() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
      <path d="M15 18l-6-6 6-6" />
    </svg>
  );
}

function ChevronRight() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
      <path d="M9 18l6-6-6-6" />
    </svg>
  );
}

export function MonthNav({ prevHref, nextHref }: { prevHref: string; nextHref: string }) {
  return (
    <div className="flex items-center gap-2">
      <Link
        href={prevHref}
        aria-label="Previous month"
        className="flex h-9 w-9 items-center justify-center rounded-full border border-hairline text-body transition hover:border-ink hover:bg-surface-card active:scale-95"
      >
        <ChevronLeft />
      </Link>
      <Link
        href={nextHref}
        aria-label="Next month"
        className="flex h-9 w-9 items-center justify-center rounded-full border border-hairline text-body transition hover:border-ink hover:bg-surface-card active:scale-95"
      >
        <ChevronRight />
      </Link>
    </div>
  );
}
