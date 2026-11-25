"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { bookingApi, Booking } from "@/services/api/booking.api";
import { hallApi } from "@/services/api/hall.api";
import { Modal } from "@/components/ui/modal";
import {
  CalendarCheck2,
  Search,
  Filter,
  Eye,
  Printer,
  Building2,
  Clock,
  User,
  X,
  CreditCard,
  SunMedium,
  Moon,
  Sparkles,
} from "lucide-react";

export default function SuperAdminBookingsPage() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [selectedHall, setSelectedHall] = useState("");
  const [page, setPage] = useState(1);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);

  // Fetch all bookings
  const { data, isLoading } = useQuery({
    queryKey: ["admin-bookings", search, statusFilter, selectedHall, page],
    queryFn: async () => {
      const res = await bookingApi.getAll({
        search: search.trim() || undefined,
        status: statusFilter === "ALL" ? undefined : statusFilter,
        hallId: selectedHall || undefined,
        page,
        limit: 10,
      });
      return res as { bookings: Booking[]; pagination: { total: number; page: number; totalPages: number } };
    },
  });

  // Fetch halls list for filter
  const { data: hallsData } = useQuery({
    queryKey: ["halls-filter-list"],
    queryFn: async () => {
      const res = await hallApi.getAll({ limit: 100 });
      return res as { halls: any[] };
    },
  });

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between bg-white rounded-3xl p-6 border border-gray-100 shadow-[0_4px_25px_rgba(0,0,0,0.03)]">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-gray-900">All System Bookings</h1>
          <p className="text-xs sm:text-sm text-gray-500 font-medium mt-1">
            Global reservation registry across every hall, Day/Night session, and owner
          </p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col gap-3 rounded-3xl border border-gray-100 bg-white p-4 sm:p-5 shadow-[0_4px_25px_rgba(0,0,0,0.02)] lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-1 flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3.5 top-3 h-4 w-4 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              placeholder="Search by customer, phone, or booking #..."
              className="w-full rounded-2xl border border-gray-200 py-2.5 pl-10 pr-4 text-sm text-gray-900 placeholder-gray-400 focus:border-blue-600 focus:ring-2 focus:ring-blue-100 focus:outline-none"
            />
          </div>

          <select
            value={selectedHall}
            onChange={(e) => {
              setSelectedHall(e.target.value);
              setPage(1);
            }}
            className="rounded-2xl border border-gray-200 px-3.5 py-2.5 text-sm font-semibold text-gray-700 focus:border-blue-600 focus:ring-2 focus:ring-blue-100 focus:outline-none"
          >
            <option value="">All Halls</option>
            {hallsData?.halls?.map((h) => (
              <option key={h.id} value={h.id}>
                {h.name}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          {["ALL", "CONFIRMED", "HOLD", "CANCELLED", "BLOCKED"].map((st) => (
            <button
              key={st}
              onClick={() => {
                setStatusFilter(st);
                setPage(1);
              }}
              className={`rounded-xl px-3 py-1.5 text-xs font-bold transition ${
                statusFilter === st
                  ? "bg-blue-600 text-white shadow-sm shadow-blue-500/20"
                  : "bg-gray-100/80 text-gray-600 hover:bg-gray-200/80"
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* Bookings Table */}
      <div className="rounded-3xl border border-gray-100 bg-white shadow-[0_4px_25px_rgba(0,0,0,0.02)] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-gray-600">
            <thead className="bg-gray-50/70 text-xs font-bold uppercase text-gray-400 border-b border-gray-100">
              <tr>
                <th className="px-5 py-3.5">Booking #</th>
                <th className="px-5 py-3.5">Hall</th>
                <th className="px-5 py-3.5">Customer</th>
                <th className="px-5 py-3.5">Session</th>
                <th className="px-5 py-3.5">Event Date</th>
                <th className="px-5 py-3.5">Status</th>
                <th className="px-5 py-3.5">Total</th>
                <th className="px-5 py-3.5">Advance</th>
                <th className="px-5 py-3.5">Commission</th>
                <th className="px-5 py-3.5 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100/80">
              {isLoading ? (
                <tr>
                  <td colSpan={10} className="px-5 py-12 text-center text-sm text-gray-500">
                    <div className="flex justify-center">
                      <div className="h-7 w-7 animate-spin rounded-full border-3 border-blue-600 border-t-transparent" />
                    </div>
                  </td>
                </tr>
              ) : data?.bookings && data.bookings.length > 0 ? (
                data.bookings.map((b) => {
                  const isNight = b.session === "NIGHT" || b.notes?.includes("[SESSION:NIGHT]");
                  return (
                    <tr key={b.id} className="hover:bg-blue-50/20 transition">
                      <td className="px-5 py-4 font-mono font-bold text-blue-600">{b.bookingNumber}</td>
                      <td className="px-5 py-4 font-bold text-gray-900">{b.hall?.name || "—"}</td>
                      <td className="px-5 py-4">
                        <div className="font-semibold text-gray-900">{b.customerName}</div>
                        <div className="text-xs text-gray-400 font-mono">{b.customerPhone}</div>
                      </td>
                      <td className="px-5 py-4">
                        {isNight ? (
                          <span className="inline-flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200/50">
                            <Moon className="h-3 w-3" /> Night
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full bg-amber-50 text-amber-700 border border-amber-200/50">
                            <SunMedium className="h-3 w-3" /> Day
                          </span>
                        )}
                      </td>
                      <td className="px-5 py-4 font-semibold text-gray-800">{b.eventDate}</td>
                      <td className="px-5 py-4">
                        <span
                          className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-bold ${
                            b.status === "CONFIRMED"
                              ? "bg-emerald-50 text-emerald-700 border border-emerald-200/60"
                              : b.status === "HOLD"
                              ? "bg-amber-50 text-amber-700 border border-amber-200/60"
                              : b.status === "BLOCKED"
                              ? "bg-gray-900 text-white"
                              : "bg-rose-50 text-rose-700 border border-rose-200/60"
                          }`}
                        >
                          {b.status}
                        </span>
                      </td>
                      <td className="px-5 py-4 font-black text-gray-900">
                        PKR {Number(b.totalAmount || 0).toLocaleString()}
                      </td>
                      <td className="px-5 py-4 text-emerald-700 font-bold">
                        PKR {Number(b.advanceAmount || 0).toLocaleString()}
                      </td>
                      <td className="px-5 py-4 font-black text-blue-600">
                        PKR {Number(b.commissionAmount || 0).toLocaleString()}
                      </td>
                      <td className="px-5 py-4 text-right">
                        <button
                          onClick={() => setSelectedBooking(b)}
                          className="rounded-xl p-2 text-gray-500 hover:bg-gray-100 hover:text-gray-900 transition"
                          title="View Details"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={10} className="px-5 py-10 text-center text-sm text-gray-400 font-medium">
                    No bookings found matching your filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {data?.pagination && data.pagination.totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-gray-100 px-5 py-3.5">
            <span className="text-xs text-gray-500 font-medium">
              Page {data.pagination.page} of {data.pagination.totalPages} ({data.pagination.total} total)
            </span>
            <div className="flex gap-2">
              <button
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="rounded-xl border border-gray-200 px-3 py-1.5 text-xs font-bold text-gray-600 hover:bg-gray-50 disabled:opacity-40 transition"
              >
                Previous
              </button>
              <button
                disabled={page >= data.pagination.totalPages}
                onClick={() => setPage((p) => p + 1)}
                className="rounded-xl border border-gray-200 px-3 py-1.5 text-xs font-bold text-gray-600 hover:bg-gray-50 disabled:opacity-40 transition"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Booking Detail Modal & Receipt View */}
      <Modal
        isOpen={!!selectedBooking}
        onClose={() => setSelectedBooking(null)}
        maxWidth="max-w-2xl"
      >
        {selectedBooking && (
          <div>
            <div className="flex items-center justify-between border-b border-gray-100 pb-3 mb-4">
              <div>
                <span className="text-xs font-bold text-blue-600">Booking #{selectedBooking.bookingNumber}</span>
                <h3 className="font-extrabold text-gray-900 text-lg">Booking & Receipt Details</h3>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={handlePrint}
                  className="rounded-xl p-2 text-gray-500 hover:bg-gray-100 transition"
                  title="Print Receipt"
                >
                  <Printer className="h-5 w-5" />
                </button>
                <button
                  onClick={() => setSelectedBooking(null)}
                  className="text-gray-400 hover:text-gray-600 rounded-lg p-1"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3.5 rounded-2xl bg-gray-50/80 border border-gray-100 p-4 text-xs">
                <div>
                  <span className="text-gray-400 font-medium">Hall Venue</span>
                  <p className="font-bold text-sm text-gray-900 mt-0.5">{selectedBooking.hall?.name || "—"}</p>
                </div>
                <div>
                  <span className="text-gray-400 font-medium">Event Date</span>
                  <p className="font-bold text-sm text-gray-900 mt-0.5">{selectedBooking.eventDate}</p>
                </div>
                <div>
                  <span className="text-gray-400 font-medium">Customer Name</span>
                  <p className="font-bold text-gray-900 mt-0.5">{selectedBooking.customerName}</p>
                </div>
                <div>
                  <span className="text-gray-400 font-medium">Customer Phone</span>
                  <p className="font-bold text-gray-900 font-mono mt-0.5">{selectedBooking.customerPhone}</p>
                </div>
                <div>
                  <span className="text-gray-400 font-medium">Status</span>
                  <p className="font-bold text-gray-800 mt-0.5">{selectedBooking.status}</p>
                </div>
                <div>
                  <span className="text-gray-400 font-medium">Session</span>
                  <p className="font-bold text-gray-900 mt-0.5">
                    {selectedBooking.session === "NIGHT" || selectedBooking.notes?.includes("[SESSION:NIGHT]")
                      ? "🌙 Night Session"
                      : "☀️ Day Session"}
                  </p>
                </div>
              </div>

              {/* Financial Breakdown */}
              <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-xs">
                <h4 className="font-bold text-sm text-gray-900 mb-3">Financial Statement</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-500 font-medium">Total Agreed Rent</span>
                    <span className="font-black text-gray-900">
                      PKR {Number(selectedBooking.totalAmount).toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between text-emerald-700">
                    <span className="font-medium">Advance Deposit Paid</span>
                    <span className="font-black">
                      PKR {Number(selectedBooking.advanceAmount).toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between text-amber-700 font-bold border-t border-gray-100 pt-2">
                    <span>Remaining Balance</span>
                    <span className="font-black">
                      PKR {Number(selectedBooking.remainingAmount).toLocaleString()}
                    </span>
                  </div>
                  <div className="border-t border-gray-100 pt-2 flex justify-between text-blue-600 font-bold">
                    <span>Platform Commission ({selectedBooking.commissionRate}%)</span>
                    <span>PKR {Number(selectedBooking.commissionAmount).toLocaleString()}</span>
                  </div>
                </div>
              </div>

              {selectedBooking.notes && (
                <div className="rounded-2xl bg-gray-50/80 border border-gray-100 p-3 text-xs text-gray-600">
                  <span className="font-bold text-gray-700">Special Notes:</span> {selectedBooking.notes}
                </div>
              )}
            </div>

            <div className="mt-6 flex justify-end gap-2 border-t border-gray-100 pt-3">
              <button
                onClick={() => setSelectedBooking(null)}
                className="rounded-2xl bg-gray-100 px-4 py-2 text-xs font-bold text-gray-700 hover:bg-gray-200 transition"
              >
                Close
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
