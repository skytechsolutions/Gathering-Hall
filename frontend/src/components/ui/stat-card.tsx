export type StatTone = "neutral" | "muted" | "accent";

const TONE_STYLES: Record<StatTone, string> = {
  neutral: "border-hairline bg-canvas text-ink",
  muted: "border-transparent bg-secondary-bg text-body",
  accent: "border-transparent bg-accent-blue/10 text-accent-blue",
};

export function StatCard({ label, value, tone }: { label: string; value: number; tone: StatTone }) {
  return (
    <div className={`rounded-2xl border p-4 text-center shadow-sm ${TONE_STYLES[tone]}`}>
      <p className="text-2xl font-bold sm:text-3xl">{value}</p>
      <p className="mt-1 text-xs font-semibold opacity-80">{label}</p>
    </div>
  );
}
