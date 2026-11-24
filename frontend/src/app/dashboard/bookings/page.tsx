"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { bookingApi, Booking } from "@/services/api/booking.api";
import { hallApi } from "@/services/api/hall.api";
import {
  CalendarCheck2,
  Search,
  Plus,
  Eye,
  CheckCircle2,
  XCircle,
  Clock,
  Printer,
  AlertCircle,
  X,
  CreditCard,
} from "lucide-react";

export default function OwnerBookingsPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [selectedHall, setSelectedHall] = useState("");
  const [page, setPage] = useState(1);

  // Modals state
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const [bookingForm, setBookingForm] = useState({
    hallId: "",
    customerName: "",
    customerPhone: "",
    customerEmail: "",
    customerAddress: "",
    eventDate: new Date().toISOString().slice(0, 10),
    eventType: "BARAT",
    status: "HOLD" as "HOLD" | "CONFIRMED",
    totalAmount: 150000,
    advanceAmount: 30000,
    holdHours: 48,
    notes: "",
  });

  // Fetch Owner's Bookings
  const { data, isLoading } = useQuery({
    queryKey: ["owner-bookings", search, statusFilter, selectedHall, page],
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

  // Fetch halls list for dropdown
  const { data: hallsData } = useQuery({
    queryKey: ["owner-halls-dropdown"],
    queryFn: async () => {
      const res = await hallApi.getAll();
      const halls = (res as any)?.halls || [];
      if (halls.length > 0 && !bookingForm.hallId) {
        setBookingForm((prev) => ({ ...prev, hallId: halls[0].id }));
      }
      return halls as any[];
    },
  });

  // Mutations
  const createMutation = useMutation({
    mutationFn: (formData: any) => bookingApi.create(formData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["owner-bookings"] });
      queryClient.invalidateQueries({ queryKey: ["owner-overview"] });
      setCreateModalOpen(false);
      setFormError(null);
    },
    onError: (err: any) => {
      setFormError(err.message || "Failed to create booking.");
    },
  });

  const confirmMutation = useMutation({
    mutationFn: ({ id, advanceAmount }: { id: string; advanceAmount: number }) =>
      bookingApi.confirm(id, { advanceAmount }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["owner-bookings"] });
      queryClient.invalidateQueries({ queryKey: ["owner-overview"] });
      setSelectedBooking(null);
    },
  });

  const cancelMutation = useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) =>
      bookingApi.cancel(id, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["owner-bookings"] });
      queryClient.invalidateQueries({ queryKey: ["owner-overview"] });
      setSelectedBooking(null);
    },
  });

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!bookingForm.hallId) {
      setFormError("Please select a hall.");
      return;
    }
    setFormError(null);
    createMutation.mutate({
      ...bookingForm,
      totalAmount: Number(bookingForm.totalAmount),
      advanceAmount: Number(bookingForm.advanceAmount),
      holdHours: Number(bookingForm.holdHours),
    });
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">Bookings & Reservations</h1>
          <p className="text-sm text-gray-500">Manage bookings, token holds, customer advances, and confirmations</p>
        </div>
        <button
          onClick={() => {
            setFormError(null);
            setCreateModalOpen(true);
          }}
          className="inline-flex items-center gap-2 rounded-xl bg-red-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-red-700 transition"
        >
          <Plus className="h-4 w-4" />
          Create Booking
        </button>
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
            <option value="">All My Halls</option>
            {hallsData?.map((h) => (
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
                <th className="px-5 py-3.5">Total (PKR)</th>
                <th className="px-5 py-3.5">Advance</th>
                <th className="px-5 py-3.5">Remaining</th>
                <th className="px-5 py-3.5 text-right">Actions</th>
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
                    <td className="px-5 py-4 text-amber-700 font-medium">
                      PKR {Number(b.remainingAmount || 0).toLocaleString()}
                    </td>
                    <td className="px-5 py-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => setSelectedBooking(b)}
                          className="rounded-lg p-1.5 text-gray-500 hover:bg-gray-100 hover:text-gray-900"
                          title="View Details & Receipt"
                        >
                          <Eye className="h-4 w-4" />
                        </button>

                        {b.status === "HOLD" && (
                          <button
                            onClick={() =>
                              confirmMutation.mutate({
                                id: b.id,
                                advanceAmount: b.advanceAmount || 0,
                              })
                            }
                            className="rounded-lg p-1.5 text-green-600 hover:bg-green-50"
                            title="Confirm Booking"
                          >
                            <CheckCircle2 className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={9} className="px-5 py-8 text-center text-sm text-gray-500">
                    No bookings found.
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

      {/* Booking Details & Receipt Modal */}
      {selectedBooking && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-2xl rounded-2xl bg-white p-6 shadow-xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b pb-3 mb-4">
              <div>
                <span className="text-xs font-semibold text-red-600">Booking #{selectedBooking.bookingNumber}</span>
                <h3 className="font-bold text-gray-900 text-lg">Booking Statement & Customer Invoice</h3>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={handlePrint} className="rounded-lg p-1.5 text-gray-500 hover:bg-gray-100">
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
                  <span className="text-gray-400">Hall Venue</span>
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
                  <span className="text-gray-400">Phone Number</span>
                  <p className="font-semibold text-gray-800">{selectedBooking.customerPhone}</p>
                </div>
                <div>
                  <span className="text-gray-400">Event Type</span>
                  <p className="font-bold text-gray-800">{selectedBooking.eventType}</p>
                </div>
                <div>
                  <span className="text-gray-400">Booking Status</span>
                  <p className="font-bold text-gray-800">{selectedBooking.status}</p>
                </div>
              </div>

              {selectedBooking.status === "HOLD" && selectedBooking.holdExpiresAt && (
                <div className="rounded-xl bg-amber-50 p-3 text-xs text-amber-800 flex items-center gap-2">
                  <Clock className="h-4 w-4 shrink-0 text-amber-600" />
                  <span>
                    Temporary hold active until:{" "}
                    <strong>{new Date(selectedBooking.holdExpiresAt).toLocaleString()}</strong>
                  </span>
                </div>
              )}

              {/* Payment Summary */}
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
                  <div className="flex justify-between text-amber-700 font-bold border-t pt-2">
                    <span>Remaining Balance Due</span>
                    <span>
                      PKR {Number(selectedBooking.remainingAmount).toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>

              {selectedBooking.notes && (
                <div className="rounded-xl bg-gray-50 p-3 text-xs text-gray-600">
                  <span className="font-semibold text-gray-700">Special Notes:</span> {selectedBooking.notes}
                </div>
              )}
            </div>

            <div className="mt-6 flex items-center justify-between border-t pt-4">
              <div className="flex gap-2">
                {selectedBooking.status === "HOLD" && (
                  <button
                    onClick={() => {
                      if (confirm("Cancel this hold and free the date?")) {
                        cancelMutation.mutate({ id: selectedBooking.id, reason: "Cancelled by owner" });
                      }
                    }}
                    className="rounded-xl border border-red-200 px-3 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-50"
                  >
                    Release Hold
                  </button>
                )}
                {selectedBooking.status === "CONFIRMED" && (
                  <button
                    onClick={() => {
                      if (confirm("Cancel this confirmed booking?")) {
                        cancelMutation.mutate({ id: selectedBooking.id, reason: "Cancelled by customer request" });
                      }
                    }}
                    className="rounded-xl border border-red-200 px-3 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-50"
                  >
                    Cancel Booking
                  </button>
                )}
              </div>

              <div className="flex gap-2">
                {selectedBooking.status === "HOLD" && (
                  <button
                    onClick={() =>
                      confirmMutation.mutate({
                        id: selectedBooking.id,
                        advanceAmount: selectedBooking.advanceAmount || 0,
                      })
                    }
                    className="rounded-xl bg-green-600 px-4 py-2 text-xs font-semibold text-white hover:bg-green-700"
                  >
                    Confirm Reservation
                  </button>
                )}
                <button
                  onClick={() => setSelectedBooking(null)}
                  className="rounded-xl bg-gray-100 px-4 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-200"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Create Booking Modal */}
      {createModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-xl rounded-2xl bg-white p-6 shadow-xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b pb-3 mb-4">
              <h3 className="font-bold text-gray-900 text-lg">Create New Booking</h3>
              <button onClick={() => setCreateModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                <X className="h-5 w-5" />
              </button>
            </div>

            {formError && (
              <div className="mb-4 flex items-center gap-2 rounded-xl bg-red-50 p-3 text-xs text-red-700 border border-red-200">
                <AlertCircle className="h-4 w-4 shrink-0 text-red-600" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleCreateSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700">Select Hall</label>
                <select
                  required
                  value={bookingForm.hallId}
                  onChange={(e) => setBookingForm({ ...bookingForm, hallId: e.target.value })}
                  className="mt-1 w-full rounded-xl border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-red-600 focus:outline-none"
                >
                  <option value="">-- Select Hall --</option>
                  {hallsData?.map((hall) => (
                    <option key={hall.id} value={hall.id}>
                      {hall.name} ({hall.city})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700">Customer Name</label>
                  <input
                    type="text"
                    required
                    value={bookingForm.customerName}
                    onChange={(e) => setBookingForm({ ...bookingForm, customerName: e.target.value })}
                    placeholder="Muhammad Bilal"
                    className="mt-1 w-full rounded-xl border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-red-600 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700">Customer Phone</label>
                  <input
                    type="tel"
                    required
                    value={bookingForm.customerPhone}
                    onChange={(e) => setBookingForm({ ...bookingForm, customerPhone: e.target.value })}
                    placeholder="0312-3456789"
                    className="mt-1 w-full rounded-xl border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-red-600 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700">Event Date</label>
                  <input
                    type="date"
                    required
                    value={bookingForm.eventDate}
                    onChange={(e) => setBookingForm({ ...bookingForm, eventDate: e.target.value })}
                    className="mt-1 w-full rounded-xl border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-red-600 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700">Event Type</label>
                  <select
                    value={bookingForm.eventType}
                    onChange={(e) => setBookingForm({ ...bookingForm, eventType: e.target.value })}
                    className="mt-1 w-full rounded-xl border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-red-600 focus:outline-none"
                  >
                    <option value="BARAT">Barat</option>
                    <option value="WALIMA">Walima</option>
                    <option value="MEHNDI">Mehndi</option>
                    <option value="OTHER">Other / Corporate</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700">Booking Type</label>
                  <select
                    value={bookingForm.status}
                    onChange={(e) => setBookingForm({ ...bookingForm, status: e.target.value as any })}
                    className="mt-1 w-full rounded-xl border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-red-600 focus:outline-none"
                  >
                    <option value="HOLD">Temporary Hold (Token)</option>
                    <option value="CONFIRMED">Confirmed Reservation</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700">Total Rent (PKR)</label>
                  <input
                    type="number"
                    required
                    value={bookingForm.totalAmount}
                    onChange={(e) => setBookingForm({ ...bookingForm, totalAmount: Number(e.target.value) })}
                    className="mt-1 w-full rounded-xl border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-red-600 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700">Advance Paid (PKR)</label>
                  <input
                    type="number"
                    value={bookingForm.advanceAmount}
                    onChange={(e) => setBookingForm({ ...bookingForm, advanceAmount: Number(e.target.value) })}
                    className="mt-1 w-full rounded-xl border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-red-600 focus:outline-none"
                  />
                </div>
              </div>

              {bookingForm.status === "HOLD" && (
                <div>
                  <label className="block text-xs font-semibold text-gray-700">Hold Duration</label>
                  <select
                    value={bookingForm.holdHours}
                    onChange={(e) => setBookingForm({ ...bookingForm, holdHours: Number(e.target.value) })}
                    className="mt-1 w-full rounded-xl border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-red-600 focus:outline-none"
                  >
                    <option value={24}>24 Hours</option>
                    <option value={48}>48 Hours</option>
                    <option value={72}>72 Hours</option>
                  </select>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-gray-700">Special Notes</label>
                <textarea
                  rows={2}
                  value={bookingForm.notes}
                  onChange={(e) => setBookingForm({ ...bookingForm, notes: e.target.value })}
                  placeholder="Stage decor theme, DJ sound timing, catering details..."
                  className="mt-1 w-full rounded-xl border border-gray-300 p-2.5 text-xs text-gray-900 focus:border-red-600 focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setCreateModalOpen(false)}
                  className="rounded-xl border border-gray-200 px-4 py-2 text-xs font-semibold text-gray-600 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createMutation.isPending}
                  className="rounded-xl bg-red-600 px-4 py-2 text-xs font-semibold text-white hover:bg-red-700 disabled:opacity-50"
                >
                  {createMutation.isPending ? "Creating..." : "Save Booking"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
