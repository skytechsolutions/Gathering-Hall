"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { bookingApi, Booking } from "@/services/api/booking.api";
import { hallApi } from "@/services/api/hall.api";
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
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">All System Bookings</h1>
          <p className="text-sm text-gray-500">Live global reservation ledger across every hall and owner</p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col gap-3 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm lg:flex-row lg:items-center lg:justify-between">
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
              className="w-full rounded-xl border border-gray-300 py-2 pl-10 pr-4 text-sm text-gray-900 placeholder-gray-400 focus:border-red-600 focus:outline-none"
            />
          </div>

          <select
            value={selectedHall}
            onChange={(e) => {
              setSelectedHall(e.target.value);
              setPage(1);
            }}
            className="rounded-xl border border-gray-300 px-3 py-2 text-sm text-gray-700 focus:border-red-600 focus:outline-none"
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
          {["ALL", "CONFIRMED", "HOLD", "CANCELLED", "BLOCKED", "EXPIRED"].map((st) => (
            <button
              key={st}
              onClick={() => {
                setStatusFilter(st);
                setPage(1);
              }}
              className={`rounded-xl px-2.5 py-1 text-xs font-semibold transition ${
                statusFilter === st
                  ? "bg-red-600 text-white"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* Bookings Table */}
      <div className="rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-gray-600">
            <thead className="bg-gray-50 text-xs font-semibold uppercase text-gray-500">
              <tr>
                <th className="px-5 py-3.5">Booking #</th>
                <th className="px-5 py-3.5">Hall</th>
                <th className="px-5 py-3.5">Customer</th>
                <th className="px-5 py-3.5">Date</th>
                <th className="px-5 py-3.5">Status</th>
                <th className="px-5 py-3.5">Total</th>
                <th className="px-5 py-3.5">Advance</th>
                <th className="px-5 py-3.5">Commission</th>
                <th className="px-5 py-3.5 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {isLoading ? (
                <tr>
                  <td colSpan={9} className="px-5 py-8 text-center text-sm text-gray-500">
                    <div className="flex justify-center">
                      <div className="h-6 w-6 animate-spin rounded-full border-2 border-red-600 border-t-transparent" />
                    </div>
                  </td>
                </tr>
              ) : data?.bookings && data.bookings.length > 0 ? (
                data.bookings.map((b) => (
                  <tr key={b.id} className="hover:bg-gray-50/50">
                    <td className="px-5 py-4 font-mono font-medium text-gray-900">{b.bookingNumber}</td>
                    <td className="px-5 py-4 font-semibold text-gray-900">{b.hall?.name || "—"}</td>
                    <td className="px-5 py-4">
                      <div className="font-medium text-gray-900">{b.customerName}</div>
                      <div className="text-xs text-gray-400">{b.customerPhone}</div>
                    </td>
                    <td className="px-5 py-4 font-medium text-gray-700">{b.eventDate}</td>
                    <td className="px-5 py-4">
                      <span
                        className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                          b.status === "CONFIRMED"
                            ? "bg-green-100 text-green-800"
                            : b.status === "HOLD"
                            ? "bg-yellow-100 text-yellow-800"
                            : b.status === "BLOCKED"
                            ? "bg-gray-900 text-white"
                            : "bg-red-100 text-red-800"
                        }`}
                      >
                        {b.status}
                      </span>
                    </td>
                    <td className="px-5 py-4 font-bold text-gray-900">
                      PKR {Number(b.totalAmount || 0).toLocaleString()}
                    </td>
                    <td className="px-5 py-4 text-green-700 font-medium">
                      PKR {Number(b.advanceAmount || 0).toLocaleString()}
                    </td>
                    <td className="px-5 py-4 font-semibold text-red-600">
                      PKR {Number(b.commissionAmount || 0).toLocaleString()}
                    </td>
                    <td className="px-5 py-4 text-right">
                      <button
                        onClick={() => setSelectedBooking(b)}
                        className="rounded-lg p-1.5 text-gray-500 hover:bg-gray-100 hover:text-gray-900"
                        title="View Details"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={9} className="px-5 py-8 text-center text-sm text-gray-500">
                    No bookings found matching your filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {data?.pagination && data.pagination.totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-gray-100 px-5 py-3">
            <span className="text-xs text-gray-500">
              Page {data.pagination.page} of {data.pagination.totalPages} ({data.pagination.total} total)
            </span>
            <div className="flex gap-2">
              <button
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="rounded-lg border border-gray-200 px-3 py-1 text-xs font-semibold text-gray-600 hover:bg-gray-50 disabled:opacity-50"
              >
                Previous
              </button>
              <button
                disabled={page >= data.pagination.totalPages}
                onClick={() => setPage((p) => p + 1)}
                className="rounded-lg border border-gray-200 px-3 py-1 text-xs font-semibold text-gray-600 hover:bg-gray-50 disabled:opacity-50"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Booking Detail Modal & Receipt View */}
      {selectedBooking && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-2xl rounded-2xl bg-white p-6 shadow-xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b pb-3 mb-4">
              <div>
                <span className="text-xs font-semibold text-red-600">Booking #{selectedBooking.bookingNumber}</span>
                <h3 className="font-bold text-gray-900 text-lg">Booking & Receipt Details</h3>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={handlePrint}
                  className="rounded-lg p-1.5 text-gray-500 hover:bg-gray-100"
                  title="Print Receipt"
                >
                  <Printer className="h-5 w-5" />
                </button>
                <button onClick={() => setSelectedBooking(null)} className="text-gray-400 hover:text-gray-600">
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 rounded-xl bg-gray-50 p-4 text-xs">
                <div>
                  <span className="text-gray-400">Hall</span>
                  <p className="font-bold text-sm text-gray-900">{selectedBooking.hall?.name || "—"}</p>
                </div>
                <div>
                  <span className="text-gray-400">Event Date</span>
                  <p className="font-bold text-sm text-gray-900">{selectedBooking.eventDate}</p>
                </div>
                <div>
                  <span className="text-gray-400">Customer Name</span>
                  <p className="font-semibold text-gray-800">{selectedBooking.customerName}</p>
                </div>
                <div>
                  <span className="text-gray-400">Customer Phone</span>
                  <p className="font-semibold text-gray-800">{selectedBooking.customerPhone}</p>
                </div>
                <div>
                  <span className="text-gray-400">Status</span>
                  <p className="font-bold text-gray-800">{selectedBooking.status}</p>
                </div>
                <div>
                  <span className="text-gray-400">Booking Created</span>
                  <p className="font-medium text-gray-800">
                    {new Date(selectedBooking.createdAt).toLocaleString()}
                  </p>
                </div>
              </div>

              {/* Financial Breakdown */}
              <div className="rounded-xl border border-gray-200 p-4">
                <h4 className="font-bold text-sm text-gray-900 mb-3">Financial Statement</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Total Agreed Rent</span>
                    <span className="font-bold text-gray-900">
                      PKR {Number(selectedBooking.totalAmount).toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between text-green-700">
                    <span>Advance Deposit Paid</span>
                    <span className="font-bold">
                      PKR {Number(selectedBooking.advanceAmount).toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between text-amber-700">
                    <span>Remaining Balance</span>
                    <span className="font-bold">
                      PKR {Number(selectedBooking.remainingAmount).toLocaleString()}
                    </span>
                  </div>
                  <div className="border-t pt-2 flex justify-between text-red-600 font-semibold">
                    <span>Platform Commission ({selectedBooking.commissionRate}%)</span>
                    <span>PKR {Number(selectedBooking.commissionAmount).toLocaleString()}</span>
                  </div>
                </div>
              </div>

              {selectedBooking.notes && (
                <div className="rounded-xl bg-gray-50 p-3 text-xs text-gray-600">
                  <span className="font-semibold text-gray-700">Special Notes:</span> {selectedBooking.notes}
                </div>
              )}
            </div>

            <div className="mt-6 flex justify-end gap-2">
              <button
                onClick={() => setSelectedBooking(null)}
                className="rounded-xl bg-gray-100 px-4 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-200"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
