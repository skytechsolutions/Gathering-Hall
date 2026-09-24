import { requireRole } from "@/lib/auth/session";
import { UpcomingEvents } from "../upcoming-events";
import { MonthSummary } from "./month-summary";

export default async function UpcomingPage() {
  await requireRole(["ADMIN", "STAFF"]);

  return (
    <div className="space-y-6">
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">Upcoming</p>

      <UpcomingEvents />

      <MonthSummary />
    </div>
  );
}
