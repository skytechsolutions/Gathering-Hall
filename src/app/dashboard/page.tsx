import Link from "next/link";
import { requireRole } from "@/lib/auth/session";
import { BookingSearch } from "./booking-search";
import { SearchResults } from "./search-results";
import { DateAvailability } from "./date-availability";
import { BookingCalendar } from "@/components/booking-calendar";

type Props = {
  searchParams: Promise<{ date?: string; name?: string; phone?: string; year?: string; month?: string }>;
};

export default async function DashboardPage({ searchParams }: Props) {
  const params = await searchParams;
  await requireRole(["ADMIN", "STAFF"]);

  const hasSearch = Boolean(params.date || params.name || params.phone);

  const now = new Date();
  const year = Number(params.year) || now.getFullYear();
  const month = Number(params.month) || now.getMonth() + 1;

  return (
    <div className="space-y-6">
      <BookingSearch date={params.date} name={params.name} phone={params.phone} />

      {params.date ? <DateAvailability date={params.date} /> : null}

      {hasSearch ? <SearchResults date={params.date} name={params.name} phone={params.phone} /> : null}

      <BookingCalendar year={year} month={month} />

      <Link href="/dashboard/upcoming" className="block text-center text-sm font-semibold text-primary hover:underline">
        See full Upcoming list →
      </Link>
    </div>
  );
}
