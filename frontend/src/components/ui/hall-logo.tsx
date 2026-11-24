// A simple original mark for Chamkani Gathering Hall — a three-peak
// mandap/archway silhouette (a common wedding-venue motif) inside a
// circle, drawn as plain vector paths so no external image asset is
// needed. Swap this out any time for a real photo/logo file.
export function HallLogo({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className}>
      <path
        d="M4 20V11.5C4 9 5.8 7 8 7c0-2 1.8-3.5 4-3.5S16 5 16 7c2.2 0 4 2 4 4.5V20"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="M4 20h16" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
      <path d="M9 20v-5a3 3 0 0 1 6 0v5" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="12" cy="7" r="1" fill="currentColor" stroke="none" />
    </svg>
  );
}
