export function BookingSearch({ date, name, phone }: { date?: string; name?: string; phone?: string }) {
  return (
    <form action="/dashboard" method="GET" className="rounded-[32px] border border-hairline bg-canvas p-5 shadow-sm">
      <div className="grid gap-3 sm:grid-cols-[1fr_1fr_1fr_auto]">
        <div>
          <label htmlFor="date" className="mb-1 block text-xs font-semibold uppercase tracking-wide text-mute">By Date</label>
          <input
            id="date"
            name="date"
            type="date"
            autoComplete="off"
            defaultValue={date ?? ""}
            className="w-full rounded-2xl border border-hairline px-3 py-2.5 text-sm text-ink outline-none focus:border-ink"
          />
        </div>
        <div>
          <label htmlFor="name" className="mb-1 block text-xs font-semibold uppercase tracking-wide text-mute">By Customer Name</label>
          <input
            id="name"
            name="name"
            type="text"
            autoComplete="off"
            defaultValue={name ?? ""}
            className="w-full rounded-2xl border border-hairline px-3 py-2.5 text-sm text-ink outline-none focus:border-ink"
          />
        </div>
        <div>
          <label htmlFor="phone" className="mb-1 block text-xs font-semibold uppercase tracking-wide text-mute">By Phone Number</label>
          <input
            id="phone"
            name="phone"
            type="text"
            autoComplete="off"
            defaultValue={phone ?? ""}
            placeholder="03xxxxxxxxx"
            className="w-full rounded-2xl border border-hairline px-3 py-2.5 text-sm text-ink outline-none focus:border-ink"
          />
        </div>
        <div className="flex items-end gap-2">
          <button type="submit" className="rounded-2xl bg-primary px-5 py-2.5 text-sm font-bold text-white hover:bg-primary-pressed">
            Search
          </button>
          {date || name || phone ? (
            <a href="/dashboard" className="rounded-2xl bg-secondary-bg px-4 py-2.5 text-sm font-bold text-ink hover:bg-secondary-pressed">
              Clear
            </a>
          ) : null}
        </div>
      </div>
    </form>
  );
}
