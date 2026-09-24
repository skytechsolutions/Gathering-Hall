import { getDateAvailability, type DateShiftAvailability } from "@/lib/booking/availability";

const STATUS_LABEL: Record<string, string> = {
  AVAILABLE: "Open",
  HOLD: "Hold (tentative)",
  CONFIRMED: "Confirmed",
};

const STATUS_CARD_STYLE: Record<string, string> = {
  AVAILABLE: "border-hairline bg-canvas",
  HOLD: "border-accent-blue/30 bg-accent-blue/5",
  CONFIRMED: "border-success-deep/20 bg-success-pale",
};

const STATUS_BADGE_STYLE: Record<string, string> = {
  AVAILABLE: "bg-secondary-bg text-body",
  HOLD: "bg-accent-blue/10 text-accent-blue",
  CONFIRMED: "bg-success-pale text-success-deep",
};

function ShiftCard({ label, info }: { label: string; info: DateShiftAvailability }) {
  return (
    <div className={`rounded-[28px] border p-5 ${STATUS_CARD_STYLE[info.status]}`}>
      <div className="flex items-center justify-between">
        <p className="text-sm font-bold uppercase tracking-wide text-ink">{label}</p>
        <span className={`rounded-full px-3 py-1 text-[11px] font-bold uppercase tracking-wide ${STATUS_BADGE_STYLE[info.status]}`}>
          {STATUS_LABEL[info.status]}
        </span>
      </div>
      {info.status === "AVAILABLE" ? (
        <p className="mt-3 text-sm text-mute">No booking — this slot is free.</p>
      ) : (
        <div className="mt-3 space-y-1">
          <p className="text-lg font-bold text-ink">{info.eventType ?? "Event not decided yet"}</p>
          <p className="text-sm text-body">{info.customerName}</p>
          <p className="text-xs text-mute">{info.bookingNumber}</p>
        </div>
      )}
    </div>
  );
}

export async function DateAvailability({ date }: { date: string }) {
  const { dayName, day, night } = await getDateAvailability(date);

  return (
    <div className="rounded-2xl border border-hairline bg-canvas p-4 shadow-sm sm:rounded-[32px] sm:p-6">
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">Availability</p>
      <h2 className="mt-1 text-xl font-bold text-ink">
        {date} — {dayName}
      </h2>
      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <ShiftCard label="Day" info={day} />
        <ShiftCard label="Night" info={night} />
      </div>
    </div>
  );
}
