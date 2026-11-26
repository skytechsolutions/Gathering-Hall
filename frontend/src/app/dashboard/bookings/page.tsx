"use client";

import { useState, useMemo, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { bookingApi, Booking } from "@/services/api/booking.api";
import { hallApi } from "@/services/api/hall.api";
import { Modal } from "@/components/ui/modal";
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
  SunMedium,
  Moon,
  Sparkles,
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

  const [bookingForm, setBookingForm] = useState<{
    hallId: string;
    customerName: string;
    customerPhone: string;
    customerEmail: string;
    customerAddress: string;
    eventDate: string;
    session: "DAY" | "NIGHT";
    eventType: string;
    status: "HOLD" | "CONFIRMED";
    totalAmount: number | "";
    advanceAmount: number | "";
    holdHours: number;
    notes: string;
  }>({
    hallId: "",
    customerName: "",
    customerPhone: "",
    customerEmail: "",
    customerAddress: "",
    eventDate: new Date().toISOString().slice(0, 10),
    session: "DAY" as "DAY" | "NIGHT",
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
      return halls as any[];
    },
  });

  // Filter to only active (APPROVED) halls for new reservations
  const activeHalls = useMemo(() => {
    return (hallsData || []).filter((h: any) => h.status === "APPROVED");
  }, [hallsData]);

  // Keep selected hall in sync with active halls
  useEffect(() => {
    if (activeHalls.length > 0) {
      if (!bookingForm.hallId || !activeHalls.some((h: any) => h.id === bookingForm.hallId)) {
        setBookingForm((prev) => ({ ...prev, hallId: activeHalls[0].id }));
      }
    } else {
      setBookingForm((prev) => ({ ...prev, hallId: "" }));
    }
  }, [activeHalls, bookingForm.hallId]);

  // Mutations
  const createMutation = useMutation({
    mutationFn: (formData: any) => bookingApi.create(formData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["owner-bookings"] });
      queryClient.invalidateQueries({ queryKey: ["owner-overview"] });
      queryClient.invalidateQueries({ queryKey: ["hall-availability"] });
      queryClient.invalidateQueries({ queryKey: ["owner-customers"] });
      queryClient.invalidateQueries({ queryKey: ["customer-ledger"] });
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
      queryClient.invalidateQueries({ queryKey: ["hall-availability"] });
      queryClient.invalidateQueries({ queryKey: ["owner-customers"] });
      queryClient.invalidateQueries({ queryKey: ["customer-ledger"] });
      setSelectedBooking(null);
    },
  });

  const cancelMutation = useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) =>
      bookingApi.cancel(id, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["owner-bookings"] });
      queryClient.invalidateQueries({ queryKey: ["owner-overview"] });
      queryClient.invalidateQueries({ queryKey: ["hall-availability"] });
      queryClient.invalidateQueries({ queryKey: ["owner-customers"] });
      queryClient.invalidateQueries({ queryKey: ["customer-ledger"] });
      setSelectedBooking(null);
    },
  });

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!bookingForm.hallId) {
      setFormError("Please select an active wedding hall.");
      return;
    }

    const isHallActive = activeHalls.some((h: any) => h.id === bookingForm.hallId);
    if (!isHallActive) {
      setFormError("The selected wedding hall is disabled. Please select an active hall.");
      return;
    }
    setFormError(null);
    createMutation.mutate({
      ...bookingForm,
      totalAmount: Number(bookingForm.totalAmount) || 0,
      advanceAmount: Number(bookingForm.advanceAmount) || 0,
      holdHours: Number(bookingForm.holdHours),
    });
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between bg-white rounded-2xl p-4 sm:p-6 border border-gray-100">
        <div>
          <h1 className="text-xl sm:text-3xl font-black tracking-tight text-gray-900">
            Bookings & Reservations
          </h1>
          <p className="text-xs sm:text-sm text-gray-500 font-medium mt-0.5 sm:mt-1">
            Manage hall bookings, independent Day/Night sessions, token holds, and advance payments
          </p>
        </div>
        <button
          onClick={() => {
            setFormError(null);
            setCreateModalOpen(true);
          }}
          className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-[#3b3c44] px-4 py-2.5 text-xs sm:text-sm font-bold text-white hover:bg-[#2b2c33] active:scale-95 transition"
        >
          <Plus className="h-4 w-4" />
          Create Booking
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col gap-3 rounded-2xl border border-slate-200/80 bg-white p-3.5 sm:p-5 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-1 flex-col gap-2.5 sm:flex-row sm:items-center">
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
              className="w-full rounded-xl border border-slate-200 py-2.5 pl-10 pr-4 text-xs sm:text-sm text-gray-900 placeholder-gray-400 focus:border-[#3b3c44] focus:ring-2 focus:ring-slate-300 focus:outline-none"
            />
          </div>

          <select
            value={selectedHall}
            onChange={(e) => {
              setSelectedHall(e.target.value);
              setPage(1);
            }}
            className="rounded-xl border border-slate-200 px-3.5 py-2.5 text-xs sm:text-sm font-semibold text-gray-700 focus:border-[#3b3c44] focus:ring-2 focus:ring-slate-300 focus:outline-none"
          >
            <option value="">All My Halls</option>
            {hallsData?.map((h) => (
              <option key={h.id} value={h.id}>
                {h.name}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 [scrollbar-width:none]">
          {["ALL", "CONFIRMED", "HOLD", "CANCELLED", "BLOCKED"].map((st) => (
            <button
              key={st}
              onClick={() => {
                setStatusFilter(st);
                setPage(1);
              }}
              className={`rounded-xl px-3 py-1.5 text-xs font-bold whitespace-nowrap transition ${
                statusFilter === st
                  ? "bg-[#3b3c44] text-white"
                  : "bg-gray-100/80 text-gray-600 hover:bg-gray-200/80"
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* Bookings Container */}
      <div className="rounded-2xl border border-slate-200/80 bg-white overflow-hidden">
        {/* Mobile Card View (Visible on < md) */}
        <div className="md:hidden divide-y divide-slate-100">
          {isLoading ? (
            <div className="py-12 flex justify-center">
              <div className="h-7 w-7 animate-spin rounded-full border-3 border-[#3b3c44] border-t-transparent" />
            </div>
          ) : data?.bookings && data.bookings.length > 0 ? (
            data.bookings.map((b) => {
              const isNight = b.session === "NIGHT" || b.notes?.includes("[SESSION:NIGHT]");
              return (
                <div key={b.id} className="p-4 space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-mono font-black text-xs text-[#3b3c44]">
                      {b.bookingNumber}
                    </span>
                    <span
                      className={`inline-flex rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
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
                  </div>

                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h4 className="font-bold text-sm text-gray-900">{b.customerName}</h4>
                      <p className="text-xs text-gray-400 font-mono">{b.customerPhone}</p>
                      <p className="text-xs font-semibold text-gray-600 mt-0.5">{b.hall?.name || "—"}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs font-bold text-gray-800">{b.eventDate}</p>
                      <div className="mt-1">
                        {isNight ? (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200/50">
                            <Moon className="h-2.5 w-2.5" /> Night
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200/50">
                            <SunMedium className="h-2.5 w-2.5" /> Day
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-1.5 rounded-xl bg-slate-50 p-2 text-center text-xs border border-slate-100">
                    <div>
                      <span className="text-[10px] text-gray-400 font-medium">Total</span>
                      <p className="font-bold text-gray-900 text-[11px] mt-0.5">
                        PKR {Number(b.totalAmount || 0).toLocaleString()}
                      </p>
                    </div>
                    <div>
                      <span className="text-[10px] text-emerald-600 font-medium">Advance</span>
                      <p className="font-bold text-emerald-700 text-[11px] mt-0.5">
                        PKR {Number(b.advanceAmount || 0).toLocaleString()}
                      </p>
                    </div>
                    <div>
                      <span className="text-[10px] text-amber-600 font-medium">Remaining</span>
                      <p className="font-bold text-amber-700 text-[11px] mt-0.5">
                        PKR {Number(b.remainingAmount || 0).toLocaleString()}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-1">
                    <button
                      onClick={() => setSelectedBooking(b)}
                      className="flex-1 inline-flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-xs font-bold text-slate-700 transition"
                    >
                      <Eye className="h-3.5 w-3.5" />
                      <span>View Details</span>
                    </button>
                    {b.status === "HOLD" && (
                      <button
                        onClick={() =>
                          confirmMutation.mutate({
                            id: b.id,
                            advanceAmount: b.advanceAmount || 0,
                          })
                        }
                        className="inline-flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-xs font-bold text-white transition"
                      >
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        <span>Confirm</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          ) : (
            <div className="py-10 text-center text-sm text-gray-400 font-medium">
              No bookings found matching your search.
            </div>
          )}
        </div>

        {/* Desktop Table View (Hidden on mobile) */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left text-sm text-gray-600">
            <thead className="bg-gray-50/70 text-xs font-bold uppercase text-gray-400 border-b border-gray-100">
              <tr>
                <th className="px-5 py-3.5">Booking #</th>
                <th className="px-5 py-3.5">Hall</th>
                <th className="px-5 py-3.5">Customer</th>
                <th className="px-5 py-3.5">Session</th>
                <th className="px-5 py-3.5">Event Date</th>
                <th className="px-5 py-3.5">Status</th>
                <th className="px-5 py-3.5">Total (PKR)</th>
                <th className="px-5 py-3.5">Advance</th>
                <th className="px-5 py-3.5">Remaining</th>
                <th className="px-5 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100/80">
              {isLoading ? (
                <tr>
                  <td colSpan={10} className="px-5 py-12 text-center text-sm text-gray-500">
                    <div className="flex justify-center">
                      <div className="h-7 w-7 animate-spin rounded-full border-3 border-[#3b3c44] border-t-transparent" />
                    </div>
                  </td>
                </tr>
              ) : data?.bookings && data.bookings.length > 0 ? (
                data.bookings.map((b) => {
                  const isNight = b.session === "NIGHT" || b.notes?.includes("[SESSION:NIGHT]");
                  return (
                    <tr key={b.id} className="hover:bg-slate-100/50 transition">
                      <td className="px-5 py-4 font-mono font-bold text-[#3b3c44]">{b.bookingNumber}</td>
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
                      <td className="px-5 py-4 text-amber-700 font-bold">
                        PKR {Number(b.remainingAmount || 0).toLocaleString()}
                      </td>
                      <td className="px-5 py-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => setSelectedBooking(b)}
                            className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 hover:text-gray-900 transition"
                            title="View Details & Invoice"
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
                              className="rounded-lg p-2 text-emerald-600 hover:bg-emerald-50 transition"
                              title="Confirm Reservation"
                            >
                              <CheckCircle2 className="h-4 w-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={10} className="px-5 py-10 text-center text-sm text-gray-400 font-medium">
                    No bookings found matching your search.
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
                className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-bold text-gray-600 hover:bg-gray-50 disabled:opacity-40 transition"
              >
                Previous
              </button>
              <button
                disabled={page >= data.pagination.totalPages}
                onClick={() => setPage((p) => p + 1)}
                className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-bold text-gray-600 hover:bg-gray-50 disabled:opacity-40 transition"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Booking Details & Receipt Modal */}
      <Modal
        isOpen={!!selectedBooking}
        onClose={() => setSelectedBooking(null)}
        maxWidth="max-w-2xl"
      >
        {selectedBooking && (
          <div>
            <div className="flex items-center justify-between border-b border-gray-100 pb-3 mb-4">
              <div>
                <span className="text-xs font-bold text-[#3b3c44]">Booking #{selectedBooking.bookingNumber}</span>
                <h3 className="font-extrabold text-gray-900 text-lg">Booking Statement & Customer Invoice</h3>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={handlePrint}
                  className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 transition"
                  title="Print Invoice"
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
              <div className="grid grid-cols-2 gap-3.5 rounded-xl bg-gray-50/80 border border-gray-100 p-4 text-xs">
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
                  <span className="text-gray-400 font-medium">Phone Number</span>
                  <p className="font-bold text-gray-900 font-mono mt-0.5">{selectedBooking.customerPhone}</p>
                </div>
                <div>
                  <span className="text-gray-400 font-medium">Event Type</span>
                  <p className="font-bold text-gray-900 mt-0.5">{selectedBooking.eventType}</p>
                </div>
                <div>
                  <span className="text-gray-400 font-medium">Booking Session</span>
                  <p className="font-bold text-gray-900 mt-0.5">
                    {selectedBooking.session === "NIGHT" || selectedBooking.notes?.includes("[SESSION:NIGHT]")
                      ? "🌙 Night Session"
                      : "☀️ Day Session"}
                  </p>
                </div>
              </div>

              {selectedBooking.status === "HOLD" && selectedBooking.holdExpiresAt && (
                <div className="rounded-xl bg-amber-50/80 border border-amber-200/60 p-3 text-xs text-amber-900 flex items-center gap-2">
                  <Clock className="h-4 w-4 shrink-0 text-amber-600" />
                  <span>
                    Temporary hold expires on:{" "}
                    <strong>{new Date(selectedBooking.holdExpiresAt).toLocaleString()}</strong>
                  </span>
                </div>
              )}

              {/* Payment Summary */}
              <div className="rounded-2xl border border-slate-200/80 bg-white p-4">
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
                    <span>Remaining Balance Due</span>
                    <span className="font-black">
                      PKR {Number(selectedBooking.remainingAmount).toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>

              {selectedBooking.notes && (
                <div className="rounded-xl bg-gray-50/80 border border-gray-100 p-3 text-xs text-gray-600">
                  <span className="font-bold text-gray-700">Special Notes:</span> {selectedBooking.notes}
                </div>
              )}
            </div>

            <div className="mt-6 flex items-center justify-between border-t border-gray-100 pt-4">
              <div className="flex gap-2">
                {selectedBooking.status === "HOLD" && (
                  <button
                    onClick={() => {
                      if (confirm("Cancel this hold and free the session?")) {
                        cancelMutation.mutate({ id: selectedBooking.id, reason: "Cancelled by owner" });
                      }
                    }}
                    className="rounded-lg border border-rose-200 bg-rose-50/50 px-3 py-1.5 text-xs font-bold text-rose-700 hover:bg-rose-100 transition"
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
                    className="rounded-lg border border-rose-200 bg-rose-50/50 px-3 py-1.5 text-xs font-bold text-rose-700 hover:bg-rose-100 transition"
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
                    className="rounded-xl bg-emerald-600 px-4 py-2 text-xs font-bold text-white hover:bg-emerald-700 transition"
                  >
                    Confirm Reservation
                  </button>
                )}
                <button
                  onClick={() => setSelectedBooking(null)}
                  className="rounded-xl bg-gray-100 px-4 py-2 text-xs font-bold text-gray-700 hover:bg-gray-200 transition"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* Create Booking Modal */}
      <Modal
        isOpen={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        maxWidth="max-w-xl"
      >
        <div className="flex items-center justify-between border-b border-gray-100 pb-3 mb-4">
          <div>
            <h3 className="font-extrabold text-gray-900 text-lg">Create New Reservation</h3>
            <p className="text-xs text-gray-400 font-medium">Day & Night independent booking sessions supported</p>
          </div>
          <button
            onClick={() => setCreateModalOpen(false)}
            className="text-gray-400 hover:text-gray-600 rounded-lg p-1"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {formError && (
          <div className="mb-4 flex items-center gap-2 rounded-xl bg-rose-50 p-3.5 text-xs text-rose-700 border border-rose-200">
            <AlertCircle className="h-4 w-4 shrink-0 text-rose-600" />
            <span>{formError}</span>
          </div>
        )}

        <form onSubmit={handleCreateSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-gray-700">Select Hall</label>
            <select
              required
              value={bookingForm.hallId}
              onChange={(e) => setBookingForm({ ...bookingForm, hallId: e.target.value })}
              className="mt-1 w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm text-gray-900 focus:border-[#3b3c44] focus:ring-2 focus:ring-slate-300 focus:outline-none"
            >
              <option value="">-- Select Hall --</option>
              {activeHalls?.map((hall: any) => (
                <option key={hall.id} value={hall.id}>
                  {hall.name} ({hall.city})
                </option>
              ))}
            </select>
            {activeHalls.length === 0 && (
              <p className="mt-1.5 text-xs text-amber-600 font-medium">
                No active halls found. Please enable a hall from My Halls before booking.
              </p>
            )}
          </div>

          {/* Session Selector (Day / Night) */}
          <div>
            <label className="block text-xs font-bold text-gray-700">Booking Session</label>
            <div className="grid grid-cols-2 gap-2.5 mt-1.5">
              <button
                type="button"
                onClick={() => setBookingForm((prev) => ({ ...prev, session: "DAY" }))}
                className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs font-bold transition border ${
                  bookingForm.session === "DAY"
                    ? "bg-amber-500 text-white border-amber-500"
                    : "bg-white text-gray-700 border-gray-200 hover:bg-gray-50"
                }`}
              >
                <SunMedium className="h-4 w-4" />
                <span>☀️ Day (11am - 4pm)</span>
              </button>

              <button
                type="button"
                onClick={() => setBookingForm((prev) => ({ ...prev, session: "NIGHT" }))}
                className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs font-bold transition border ${
                  bookingForm.session === "NIGHT"
                    ? "bg-indigo-600 text-white border-indigo-600"
                    : "bg-white text-gray-700 border-gray-200 hover:bg-gray-50"
                }`}
              >
                <Moon className="h-4 w-4" />
                <span>🌙 Night (6pm - 12am)</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-gray-700">Customer Name</label>
              <input
                type="text"
                required
                value={bookingForm.customerName}
                onChange={(e) => setBookingForm({ ...bookingForm, customerName: e.target.value })}
                placeholder="Muhammad Bilal"
                className="mt-1 w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm text-gray-900 focus:border-[#3b3c44] focus:ring-2 focus:ring-slate-300 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-700">Customer Phone</label>
              <input
                type="tel"
                required
                value={bookingForm.customerPhone}
                onChange={(e) => setBookingForm({ ...bookingForm, customerPhone: e.target.value })}
                placeholder="0312-3456789"
                className="mt-1 w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm text-gray-900 focus:border-[#3b3c44] focus:ring-2 focus:ring-slate-300 focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-bold text-gray-700">Event Date</label>
              <input
                type="date"
                required
                value={bookingForm.eventDate}
                onChange={(e) => setBookingForm({ ...bookingForm, eventDate: e.target.value })}
                className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-gray-900 focus:border-[#3b3c44] focus:ring-2 focus:ring-slate-300 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-700">Event Type</label>
              <select
                value={bookingForm.eventType}
                onChange={(e) => setBookingForm({ ...bookingForm, eventType: e.target.value })}
                className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-gray-900 focus:border-[#3b3c44] focus:ring-2 focus:ring-slate-300 focus:outline-none"
              >
                <option value="BARAT">Barat</option>
                <option value="WALIMA">Walima</option>
                <option value="MEHNDI">Mehndi</option>
                <option value="OTHER">Other / Corporate</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-700">Booking Type</label>
              <select
                value={bookingForm.status}
                onChange={(e) => setBookingForm({ ...bookingForm, status: e.target.value as any })}
                className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-gray-900 focus:border-[#3b3c44] focus:ring-2 focus:ring-slate-300 focus:outline-none"
              >
                <option value="HOLD">Temporary Hold (Token)</option>
                <option value="CONFIRMED">Confirmed Reservation</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-gray-700">Total Rent (PKR)</label>
              <input
                type="number"
                required
                placeholder="0"
                value={bookingForm.totalAmount === 0 || bookingForm.totalAmount === "" ? "" : bookingForm.totalAmount}
                onChange={(e) => setBookingForm({ ...bookingForm, totalAmount: e.target.value === "" ? "" : Number(e.target.value) })}
                className="mt-1 w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm text-gray-900 focus:border-[#3b3c44] focus:ring-2 focus:ring-slate-300 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-700">Advance Paid (PKR)</label>
              <input
                type="number"
                placeholder="0"
                value={bookingForm.advanceAmount === 0 || bookingForm.advanceAmount === "" ? "" : bookingForm.advanceAmount}
                onChange={(e) => setBookingForm({ ...bookingForm, advanceAmount: e.target.value === "" ? "" : Number(e.target.value) })}
                className="mt-1 w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm text-gray-900 focus:border-[#3b3c44] focus:ring-2 focus:ring-slate-300 focus:outline-none"
              />
            </div>
          </div>

          {bookingForm.status === "HOLD" && (
            <div>
              <label className="block text-xs font-bold text-gray-700">Hold Duration</label>
              <select
                value={bookingForm.holdHours}
                onChange={(e) => setBookingForm({ ...bookingForm, holdHours: Number(e.target.value) })}
                className="mt-1 w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm text-gray-900 focus:border-[#3b3c44] focus:ring-2 focus:ring-slate-300 focus:outline-none"
              >
                <option value={24}>24 Hours</option>
                <option value={48}>48 Hours</option>
                <option value={72}>72 Hours</option>
              </select>
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-gray-700">Special Notes</label>
            <textarea
              rows={2}
              value={bookingForm.notes}
              onChange={(e) => setBookingForm({ ...bookingForm, notes: e.target.value })}
              placeholder="Stage decor theme, DJ sound timing, catering details..."
              className="mt-1 w-full rounded-xl border border-slate-200 p-3 text-xs text-gray-900 focus:border-[#3b3c44] focus:ring-2 focus:ring-slate-300 focus:outline-none"
            />
          </div>

          <div className="flex justify-end gap-2.5 pt-3 border-t border-gray-100">
            <button
              type="button"
              onClick={() => setCreateModalOpen(false)}
              className="rounded-xl border border-gray-200 px-4 py-2.5 text-xs font-bold text-gray-600 hover:bg-gray-50 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={createMutation.isPending}
              className="rounded-xl bg-[#3b3c44] px-5 py-2.5 text-xs font-bold text-white hover:bg-[#2b2c33] disabled:opacity-50 active:scale-95 transition"
            >
              {createMutation.isPending ? "Creating..." : "Save Booking"}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
