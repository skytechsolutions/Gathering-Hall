"use client";

import { useState, useMemo, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { bookingApi, Booking } from "@/services/api/booking.api";
import { hallApi } from "@/services/api/hall.api";
import { Modal } from "@/components/ui/modal";
import { useAuth, getSessionHoursLabel } from "@/context/auth-context";
import {
  Search,
  Plus,
  Eye,
  CheckCircle2,
  Clock,
  Printer,
  AlertCircle,
  X,
  SunMedium,
  Moon,
} from "lucide-react";

export default function OwnerBookingsPage() {
  const queryClient = useQueryClient();
  const { sessionSettings } = useAuth();
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
    holdHours: sessionSettings.autoHoldHours || 48,
    notes: "",
  });

  // Sync default autoHoldHours from Owner Settings
  useEffect(() => {
    if (sessionSettings.autoHoldHours) {
      setBookingForm((prev) => ({ ...prev, holdHours: sessionSettings.autoHoldHours }));
    }
  }, [sessionSettings.autoHoldHours]);

  // Fetch Owner's Bookings
  const { data, isLoading } = useQuery({
    queryKey: ["owner-bookings", search, statusFilter, selectedHall, page],
    queryFn: async () => {
      const res = await bookingApi.getAll({
        search: search.trim() || undefined,
        status: statusFilter === "ALL" ? undefined : statusFilter,
        hallId: selectedHall || undefined,
        page,
        limit: 15,
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
    setFormError(null);

    if (!bookingForm.hallId) {
      setFormError("Please select a hall venue.");
      return;
    }

    createMutation.mutate({
      ...bookingForm,
      totalAmount: Number(bookingForm.totalAmount) || 0,
      advanceAmount: Number(bookingForm.advanceAmount) || 0,
    });
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-5 select-none font-sans">
      {/* ============================================================== */}
      {/* 1. TOP TITLE HEADER (Matches media_1795762356947_a332a993)   */}
      {/* ============================================================== */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div>
          <h1 className="font-serif text-2xl sm:text-3xl text-[#1f2421] font-normal tracking-tight">
            Bookings & Reservations
          </h1>
          <p className="text-xs text-[#7a6f60] font-normal mt-0.5">
            Manage hall bookings, independent Day/Night sessions, token holds, and advance payments
          </p>
        </div>

        <button
          onClick={() => {
            setFormError(null);
            setCreateModalOpen(true);
          }}
          className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 rounded-lg bg-[#1e382b] hover:bg-[#162a20] px-4 py-2 text-xs sm:text-sm font-semibold text-white transition shadow-xs active:scale-[0.98] cursor-pointer"
        >
          <Plus className="h-4 w-4" />
          <span>Create Booking</span>
        </button>
      </div>

      {/* ============================================================== */}
      {/* 2. SEARCH & FILTER ROW (Directly on cream canvas)              */}
      {/* ============================================================== */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pt-1">
        <div className="flex flex-1 flex-col sm:flex-row sm:items-center gap-2.5">
          {/* Search Input */}
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-[#7a7368]" />
            <input
              type="text"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              placeholder="Search by customer, phone, or booking #..."
              className="w-full rounded-lg border border-[#d6cec3] bg-white/70 py-2 pl-9 pr-3 text-xs text-[#1f2421] placeholder-[#7a7368] focus:border-[#1e382b] focus:ring-1 focus:ring-[#1e382b]/30 focus:outline-none transition"
            />
          </div>

          {/* Hall Selector Dropdown */}
          <select
            value={selectedHall}
            onChange={(e) => {
              setSelectedHall(e.target.value);
              setPage(1);
            }}
            className="rounded-lg border border-[#d6cec3] bg-white/70 px-3 py-2 text-xs font-medium text-[#1f2421] focus:border-[#1e382b] focus:outline-none cursor-pointer"
          >
            <option value="">All My Halls</option>
            {hallsData?.map((h) => (
              <option key={h.id} value={h.id}>
                {h.name}
              </option>
            ))}
          </select>
        </div>

        {/* Filter Tabs / Pills */}
        <div className="flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0 [scrollbar-width:none]">
          {["ALL", "CONFIRMED", "HOLD", "CANCELLED", "BLOCKED"].map((st) => (
            <button
              key={st}
              onClick={() => {
                setStatusFilter(st);
                setPage(1);
              }}
              className={`rounded-md px-3 py-1.5 text-xs font-bold whitespace-nowrap transition cursor-pointer ${
                statusFilter === st
                  ? "bg-[#1e382b] text-white shadow-2xs"
                  : "text-[#7a6f60] hover:text-[#1f2421]"
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* ============================================================== */}
      {/* 3. BOOKINGS TABLE CARD                                         */}
      {/* ============================================================== */}
      <div className="rounded-2xl border border-[#e5ded4] bg-[#faf7f2] overflow-hidden shadow-2xs">
        {/* Mobile View (< md) */}
        <div className="md:hidden divide-y divide-[#e5ded4]">
          {isLoading ? (
            <div className="py-12 flex justify-center">
              <div className="h-7 w-7 animate-spin rounded-full border-3 border-[#1e382b] border-t-transparent" />
            </div>
          ) : data?.bookings && data.bookings.length > 0 ? (
            data.bookings.map((b) => {
              const isNight = b.session === "NIGHT" || b.notes?.includes("[SESSION:NIGHT]");
              return (
                <div key={b.id} className="p-4 space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-mono font-bold text-xs text-[#1f2421]">
                      {b.bookingNumber}
                    </span>
                    <span className="inline-flex items-center gap-1.5 text-xs font-semibold">
                      {b.status === "CONFIRMED" ? (
                        <>
                          <span className="w-2 h-2 rounded-full bg-emerald-600 inline-block" />
                          <span className="text-[#1f2421]">CONFIRMED</span>
                        </>
                      ) : b.status === "HOLD" ? (
                        <>
                          <span className="w-2 h-2 rounded-full bg-amber-500 inline-block" />
                          <span className="text-amber-700">HOLD</span>
                        </>
                      ) : b.status === "BLOCKED" ? (
                        <>
                          <span className="w-2 h-2 rounded-full bg-gray-900 inline-block" />
                          <span className="text-gray-900">BLOCKED</span>
                        </>
                      ) : (
                        <>
                          <span className="w-2 h-2 rounded-full border border-[#7a6f60] inline-block" />
                          <span className="text-[#7a6f60]">CANCELLED</span>
                        </>
                      )}
                    </span>
                  </div>

                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h4 className="font-semibold text-xs text-[#1f2421]">{b.customerName}</h4>
                      <p className="text-[11px] text-[#7a6f60] font-mono">{b.customerPhone}</p>
                      <p className="text-xs font-medium text-[#1f2421] mt-0.5">{b.hall?.name || "—"}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs font-mono text-[#1f2421]">{b.eventDate}</p>
                      <div className="mt-1 text-xs text-[#1f2421] font-medium">
                        {isNight ? "☾ Night" : "☼ Day"}
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-1.5 rounded-xl bg-white/60 p-2 text-center text-xs border border-[#e5ded4]">
                    <div>
                      <span className="text-[10px] text-[#7a6f60] font-medium">Total</span>
                      <p className="font-semibold text-[#1f2421] text-xs mt-0.5">
                        PKR {Number(b.totalAmount || 0).toLocaleString()}
                      </p>
                    </div>
                    <div>
                      <span className="text-[10px] text-[#7a6f60] font-medium">Advance</span>
                      <p className="font-semibold text-[#1f2421] text-xs mt-0.5">
                        PKR {Number(b.advanceAmount || 0).toLocaleString()}
                      </p>
                    </div>
                    <div>
                      <span className="text-[10px] text-[#7a6f60] font-medium">Remaining</span>
                      <p className="font-semibold text-[#c28e36] text-xs mt-0.5">
                        PKR {Number(b.remainingAmount || 0).toLocaleString()}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-1">
                    <button
                      onClick={() => setSelectedBooking(b)}
                      className="flex-1 inline-flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-lg border border-[#d6cec3] bg-white hover:bg-[#ebe3d7] text-xs font-semibold text-[#1f2421] transition cursor-pointer"
                    >
                      <Eye className="h-3.5 w-3.5" />
                      <span>Details</span>
                    </button>
                    {b.status === "HOLD" && (
                      <button
                        onClick={() =>
                          confirmMutation.mutate({
                            id: b.id,
                            advanceAmount: b.advanceAmount || 0,
                          })
                        }
                        className="inline-flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-lg bg-[#1e382b] hover:bg-[#162a20] text-xs font-semibold text-white transition cursor-pointer"
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
            <div className="py-10 text-center text-xs text-[#7a6f60] font-medium">
              No bookings found matching your search.
            </div>
          )}
        </div>

        {/* Desktop Table View (Hidden on mobile) */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left text-xs text-[#1f2421]">
            <thead className="bg-[#faf7f2] text-[11px] font-bold uppercase tracking-wider text-[#7a6f60] border-b border-[#e5ded4] select-none">
              <tr>
                <th className="px-5 py-3.5 font-bold">Booking #</th>
                <th className="px-5 py-3.5 font-bold">Hall</th>
                <th className="px-5 py-3.5 font-bold">Customer</th>
                <th className="px-5 py-3.5 font-bold">Session</th>
                <th className="px-5 py-3.5 font-bold">Event Date</th>
                <th className="px-5 py-3.5 font-bold">Status</th>
                <th className="px-5 py-3.5 font-bold">Total (PKR)</th>
                <th className="px-5 py-3.5 font-bold">Advance</th>
                <th className="px-5 py-3.5 font-bold">Remaining</th>
                <th className="px-5 py-3.5 font-bold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#e5ded4]">
              {isLoading ? (
                <tr>
                  <td colSpan={10} className="px-5 py-12 text-center text-xs text-[#7a6f60]">
                    <div className="flex justify-center">
                      <div className="h-7 w-7 animate-spin rounded-full border-3 border-[#1e382b] border-t-transparent" />
                    </div>
                  </td>
                </tr>
              ) : data?.bookings && data.bookings.length > 0 ? (
                data.bookings.map((b) => {
                  const isNight = b.session === "NIGHT" || b.notes?.includes("[SESSION:NIGHT]");
                  return (
                    <tr key={b.id} className="hover:bg-[#ebe3d7]/20 transition">
                      {/* Booking # */}
                      <td className="px-5 py-4 font-mono font-bold text-[#1f2421]">
                        {b.bookingNumber}
                      </td>

                      {/* Hall */}
                      <td className="px-5 py-4 font-semibold text-[#1f2421] leading-tight max-w-[130px]">
                        {b.hall?.name || "—"}
                      </td>

                      {/* Customer */}
                      <td className="px-5 py-4">
                        <div className="font-semibold text-[#1f2421]">{b.customerName}</div>
                        <div className="text-[11px] text-[#7a6f60] font-mono">{b.customerPhone}</div>
                      </td>

                      {/* Session */}
                      <td className="px-5 py-4 font-medium text-[#1f2421] whitespace-nowrap">
                        {isNight ? "☾ Night" : "☼ Day"}
                      </td>

                      {/* Event Date */}
                      <td className="px-5 py-4 font-mono text-[#1f2421] whitespace-nowrap">
                        {b.eventDate}
                      </td>

                      {/* Status */}
                      <td className="px-5 py-4 whitespace-nowrap">
                        <span className="inline-flex items-center gap-1.5 text-xs font-semibold">
                          {b.status === "CONFIRMED" ? (
                            <>
                              <span className="w-2 h-2 rounded-full bg-emerald-600 inline-block" />
                              <span className="text-[#1f2421]">CONFIRMED</span>
                            </>
                          ) : b.status === "HOLD" ? (
                            <>
                              <span className="w-2 h-2 rounded-full bg-amber-500 inline-block" />
                              <span className="text-amber-700">HOLD</span>
                            </>
                          ) : b.status === "BLOCKED" ? (
                            <>
                              <span className="w-2 h-2 rounded-full bg-gray-900 inline-block" />
                              <span className="text-gray-900">BLOCKED</span>
                            </>
                          ) : (
                            <>
                              <span className="w-2 h-2 rounded-full border border-[#7a6f60] inline-block" />
                              <span className="text-[#7a6f60]">CANCELLED</span>
                            </>
                          )}
                        </span>
                      </td>

                      {/* Total */}
                      <td className="px-5 py-4 font-semibold text-[#1f2421] whitespace-nowrap">
                        PKR {Number(b.totalAmount || 0).toLocaleString()}
                      </td>

                      {/* Advance */}
                      <td className="px-5 py-4 font-semibold text-[#1f2421] whitespace-nowrap">
                        PKR {Number(b.advanceAmount || 0).toLocaleString()}
                      </td>

                      {/* Remaining */}
                      <td className="px-5 py-4 font-semibold text-[#c28e36] whitespace-nowrap">
                        PKR {Number(b.remainingAmount || 0).toLocaleString()}
                      </td>

                      {/* Actions */}
                      <td className="px-5 py-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => setSelectedBooking(b)}
                            className="rounded-md border border-[#d6cec3] bg-white hover:bg-[#ebe3d7] px-2.5 py-1 text-xs font-semibold text-[#1f2421] transition cursor-pointer"
                          >
                            Details
                          </button>

                          {b.status === "HOLD" && (
                            <button
                              onClick={() =>
                                confirmMutation.mutate({
                                  id: b.id,
                                  advanceAmount: b.advanceAmount || 0,
                                })
                              }
                              className="rounded-md bg-[#1e382b] hover:bg-[#162a20] px-2.5 py-1 text-xs font-semibold text-white transition cursor-pointer"
                            >
                              Confirm
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={10} className="px-5 py-10 text-center text-xs text-[#7a6f60] font-medium">
                    No bookings found matching your search.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {data?.pagination && data.pagination.totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-[#e5ded4] px-5 py-3.5 bg-[#faf7f2]">
            <span className="text-xs text-[#7a6f60] font-medium">
              Page {data.pagination.page} of {data.pagination.totalPages} ({data.pagination.total} total)
            </span>
            <div className="flex gap-2">
              <button
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="rounded-lg border border-[#d6cec3] bg-white px-3 py-1.5 text-xs font-semibold text-[#1f2421] hover:bg-[#ebe3d7] disabled:opacity-40 transition cursor-pointer"
              >
                Previous
              </button>
              <button
                disabled={page >= data.pagination.totalPages}
                onClick={() => setPage((p) => p + 1)}
                className="rounded-lg border border-[#d6cec3] bg-white px-3 py-1.5 text-xs font-semibold text-[#1f2421] hover:bg-[#ebe3d7] disabled:opacity-40 transition cursor-pointer"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ============================================================== */}
      {/* 4. BOOKING DETAILS & INVOICE MODAL                             */}
      {/* ============================================================== */}
      <Modal
        isOpen={!!selectedBooking}
        onClose={() => setSelectedBooking(null)}
        maxWidth="max-w-2xl"
      >
        {selectedBooking && (
          <div className="font-sans">
            <div className="flex items-center justify-between border-b border-[#e5ded4] pb-3 mb-4">
              <div>
                <span className="text-xs font-mono font-bold text-[#1e382b]">Booking #{selectedBooking.bookingNumber}</span>
                <h3 className="font-serif text-xl text-[#1f2421] font-normal">Booking Statement & Customer Invoice</h3>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={handlePrint}
                  className="rounded-lg p-2 text-[#7a6f60] hover:bg-[#ebe3d7] transition cursor-pointer"
                  title="Print Invoice"
                >
                  <Printer className="h-4 w-4" />
                </button>
                <button
                  onClick={() => setSelectedBooking(null)}
                  className="text-[#7a6f60] hover:text-[#1f2421] rounded-lg p-1 cursor-pointer"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3.5 rounded-xl bg-white border border-[#e5ded4] p-4 text-xs">
                <div>
                  <span className="text-[#7a6f60] font-medium">Hall Venue</span>
                  <p className="font-bold text-sm text-[#1f2421] mt-0.5">{selectedBooking.hall?.name || "—"}</p>
                </div>
                <div>
                  <span className="text-[#7a6f60] font-medium">Event Date</span>
                  <p className="font-bold text-sm text-[#1f2421] mt-0.5 font-mono">{selectedBooking.eventDate}</p>
                </div>
                <div>
                  <span className="text-[#7a6f60] font-medium">Customer Name</span>
                  <p className="font-bold text-[#1f2421] mt-0.5">{selectedBooking.customerName}</p>
                </div>
                <div>
                  <span className="text-[#7a6f60] font-medium">Phone Number</span>
                  <p className="font-bold text-[#1f2421] font-mono mt-0.5">{selectedBooking.customerPhone}</p>
                </div>
                <div>
                  <span className="text-[#7a6f60] font-medium">Event Type</span>
                  <p className="font-bold text-[#1f2421] mt-0.5">{selectedBooking.eventType}</p>
                </div>
                <div>
                  <span className="text-[#7a6f60] font-medium">Booking Session</span>
                  <p className="font-bold text-[#1f2421] mt-0.5">
                    {selectedBooking.session === "NIGHT" || selectedBooking.notes?.includes("[SESSION:NIGHT]")
                      ? "☾ Night Session"
                      : "☼ Day Session"}
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
              <div className="rounded-xl border border-[#e5ded4] bg-white p-4">
                <h4 className="font-bold text-xs uppercase tracking-wider text-[#7a6f60] mb-3">Financial Statement</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-[#7a6f60] font-medium">Total Agreed Rent</span>
                    <span className="font-bold text-[#1f2421]">
                      PKR {Number(selectedBooking.totalAmount).toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between text-emerald-700">
                    <span className="font-medium">Advance Deposit Paid</span>
                    <span className="font-bold">
                      PKR {Number(selectedBooking.advanceAmount).toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between text-[#c28e36] font-bold border-t border-[#e5ded4] pt-2">
                    <span>Remaining Balance Due</span>
                    <span>
                      PKR {Number(selectedBooking.remainingAmount).toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>

              {selectedBooking.notes && (
                <div className="rounded-xl bg-white border border-[#e5ded4] p-3 text-xs text-[#7a6f60]">
                  <span className="font-bold text-[#1f2421]">Special Notes:</span> {selectedBooking.notes}
                </div>
              )}
            </div>

            <div className="mt-6 flex items-center justify-between border-t border-[#e5ded4] pt-4">
              <div className="flex gap-2">
                {selectedBooking.status === "HOLD" && (
                  <button
                    onClick={() => {
                      if (confirm("Cancel this hold and free the session?")) {
                        cancelMutation.mutate({ id: selectedBooking.id, reason: "Cancelled by owner" });
                      }
                    }}
                    className="rounded-lg border border-rose-200 bg-rose-50/50 px-3 py-1.5 text-xs font-semibold text-rose-700 hover:bg-rose-100 transition cursor-pointer"
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
                    className="rounded-lg border border-rose-200 bg-rose-50/50 px-3 py-1.5 text-xs font-semibold text-rose-700 hover:bg-rose-100 transition cursor-pointer"
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
                    className="rounded-lg bg-[#1e382b] hover:bg-[#162a20] px-4 py-2 text-xs font-semibold text-white transition cursor-pointer"
                  >
                    Confirm Reservation
                  </button>
                )}
                <button
                  onClick={() => setSelectedBooking(null)}
                  className="rounded-lg border border-[#d6cec3] bg-white px-4 py-2 text-xs font-semibold text-[#1f2421] hover:bg-[#ebe3d7] transition cursor-pointer"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* ============================================================== */}
      {/* 5. CREATE BOOKING MODAL                                        */}
      {/* ============================================================== */}
      <Modal
        isOpen={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        maxWidth="max-w-xl"
      >
        <div className="font-sans">
          <div className="flex items-center justify-between border-b border-[#e5ded4] pb-3 mb-4">
            <div>
              <h3 className="font-serif text-xl text-[#1f2421] font-normal">Create New Reservation</h3>
              <p className="text-xs text-[#7a6f60] font-normal">Day & Night independent booking sessions supported</p>
            </div>
            <button
              onClick={() => setCreateModalOpen(false)}
              className="text-[#7a6f60] hover:text-[#1f2421] rounded-lg p-1 cursor-pointer"
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
              <label className="block text-xs font-bold text-[#1f2421]">Select Hall</label>
              <select
                required
                value={bookingForm.hallId}
                onChange={(e) => setBookingForm({ ...bookingForm, hallId: e.target.value })}
                className="mt-1 w-full rounded-lg border border-[#d6cec3] bg-white px-3.5 py-2 text-xs text-[#1f2421] focus:border-[#1e382b] focus:outline-none"
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
              <label className="block text-xs font-bold text-[#1f2421]">Booking Session</label>
              <div className="grid grid-cols-2 gap-2.5 mt-1.5">
                <button
                  type="button"
                  onClick={() => setBookingForm((prev) => ({ ...prev, session: "DAY" }))}
                  className={`flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-semibold transition border cursor-pointer ${
                    bookingForm.session === "DAY"
                      ? "bg-[#1e382b] text-white border-[#1e382b]"
                      : "bg-white text-[#1f2421] border-[#d6cec3] hover:bg-[#faf7f2]"
                  }`}
                >
                  <SunMedium className="h-4 w-4" />
                  <span>☼ Day ({getSessionHoursLabel("DAY", sessionSettings)})</span>
                </button>

                <button
                  type="button"
                  onClick={() => setBookingForm((prev) => ({ ...prev, session: "NIGHT" }))}
                  className={`flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-semibold transition border cursor-pointer ${
                    bookingForm.session === "NIGHT"
                      ? "bg-[#1e382b] text-white border-[#1e382b]"
                      : "bg-white text-[#1f2421] border-[#d6cec3] hover:bg-[#faf7f2]"
                  }`}
                >
                  <Moon className="h-4 w-4" />
                  <span>☾ Night ({getSessionHoursLabel("NIGHT", sessionSettings)})</span>
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-[#1f2421]">Customer Name</label>
                <input
                  type="text"
                  required
                  value={bookingForm.customerName}
                  onChange={(e) => setBookingForm({ ...bookingForm, customerName: e.target.value })}
                  placeholder="Muhammad Bilal"
                  className="mt-1 w-full rounded-lg border border-[#d6cec3] bg-white px-3.5 py-2 text-xs text-[#1f2421] focus:border-[#1e382b] focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-[#1f2421]">Customer Phone</label>
                <input
                  type="tel"
                  required
                  value={bookingForm.customerPhone}
                  onChange={(e) => setBookingForm({ ...bookingForm, customerPhone: e.target.value })}
                  placeholder="0312-3456789"
                  className="mt-1 w-full rounded-lg border border-[#d6cec3] bg-white px-3.5 py-2 text-xs text-[#1f2421] focus:border-[#1e382b] focus:outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-bold text-[#1f2421]">Event Date</label>
                <input
                  type="date"
                  required
                  value={bookingForm.eventDate}
                  onChange={(e) => setBookingForm({ ...bookingForm, eventDate: e.target.value })}
                  className="mt-1 w-full rounded-lg border border-[#d6cec3] bg-white px-3 py-2 text-xs text-[#1f2421] focus:border-[#1e382b] focus:outline-none font-mono"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-[#1f2421]">Event Type</label>
                <select
                  value={bookingForm.eventType}
                  onChange={(e) => setBookingForm({ ...bookingForm, eventType: e.target.value })}
                  className="mt-1 w-full rounded-lg border border-[#d6cec3] bg-white px-3 py-2 text-xs text-[#1f2421] focus:border-[#1e382b] focus:outline-none"
                >
                  <option value="BARAT">Barat</option>
                  <option value="WALIMA">Walima</option>
                  <option value="MEHNDI">Mehndi</option>
                  <option value="OTHER">Other / Corporate</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-[#1f2421]">Booking Type</label>
                <select
                  value={bookingForm.status}
                  onChange={(e) => setBookingForm({ ...bookingForm, status: e.target.value as any })}
                  className="mt-1 w-full rounded-lg border border-[#d6cec3] bg-white px-3 py-2 text-xs text-[#1f2421] focus:border-[#1e382b] focus:outline-none"
                >
                  <option value="HOLD">Temporary Hold (Token)</option>
                  <option value="CONFIRMED">Confirmed Reservation</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-[#1f2421]">Total Rent (PKR)</label>
                <input
                  type="number"
                  required
                  placeholder="0"
                  value={bookingForm.totalAmount === 0 || bookingForm.totalAmount === "" ? "" : bookingForm.totalAmount}
                  onChange={(e) => setBookingForm({ ...bookingForm, totalAmount: e.target.value === "" ? "" : Number(e.target.value) })}
                  className="mt-1 w-full rounded-lg border border-[#d6cec3] bg-white px-3.5 py-2 text-xs text-[#1f2421] focus:border-[#1e382b] focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-[#1f2421]">Advance Paid (PKR)</label>
                <input
                  type="number"
                  placeholder="0"
                  value={bookingForm.advanceAmount === 0 || bookingForm.advanceAmount === "" ? "" : bookingForm.advanceAmount}
                  onChange={(e) => setBookingForm({ ...bookingForm, advanceAmount: e.target.value === "" ? "" : Number(e.target.value) })}
                  className="mt-1 w-full rounded-lg border border-[#d6cec3] bg-white px-3.5 py-2 text-xs text-[#1f2421] focus:border-[#1e382b] focus:outline-none"
                />
              </div>
            </div>

            {bookingForm.status === "HOLD" && (
              <div>
                <label className="block text-xs font-bold text-[#1f2421]">Hold Duration</label>
                <select
                  value={bookingForm.holdHours}
                  onChange={(e) => setBookingForm({ ...bookingForm, holdHours: Number(e.target.value) })}
                  className="mt-1 w-full rounded-lg border border-[#d6cec3] bg-white px-3.5 py-2 text-xs text-[#1f2421] focus:border-[#1e382b] focus:outline-none"
                >
                  <option value={24}>24 Hours</option>
                  <option value={48}>48 Hours</option>
                  <option value={72}>72 Hours</option>
                </select>
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-[#1f2421]">Special Notes</label>
              <textarea
                rows={2}
                value={bookingForm.notes}
                onChange={(e) => setBookingForm({ ...bookingForm, notes: e.target.value })}
                placeholder="Stage decor theme, DJ sound timing, catering details..."
                className="mt-1 w-full rounded-lg border border-[#d6cec3] bg-white p-2.5 text-xs text-[#1f2421] focus:border-[#1e382b] focus:outline-none"
              />
            </div>

            <div className="flex justify-end gap-2.5 pt-3 border-t border-[#e5ded4]">
              <button
                type="button"
                onClick={() => setCreateModalOpen(false)}
                className="rounded-lg border border-[#d6cec3] bg-white px-4 py-2 text-xs font-semibold text-[#1f2421] hover:bg-[#faf7f2] transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={createMutation.isPending}
                className="rounded-lg bg-[#1e382b] hover:bg-[#162a20] px-5 py-2 text-xs font-semibold text-white disabled:opacity-50 active:scale-95 transition cursor-pointer shadow-xs"
              >
                {createMutation.isPending ? "Creating..." : "Save Booking"}
              </button>
            </div>
          </form>
        </div>
      </Modal>
    </div>
  );
}
