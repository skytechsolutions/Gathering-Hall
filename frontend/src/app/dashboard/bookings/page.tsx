"use client";

import { useState, useMemo, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { bookingApi, Booking } from "@/services/api/booking.api";
import { paymentApi, Payment } from "@/services/api/payment.api";
import { hallApi } from "@/services/api/hall.api";
import { Modal } from "@/components/ui/modal";
import { useAuth, getSessionHoursLabel } from "@/context/auth-context";
import Link from "next/link";
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
  CreditCard,
  Banknote,
  Landmark,
  Check,
  ArrowRight,
  Download,
  Receipt,
  RotateCcw,
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

  // Installment Payment States (Media 1795765706889_e359621c)
  const [actionMenuBookingId, setActionMenuBookingId] = useState<string | null>(null);
  const [receivePaymentBooking, setReceivePaymentBooking] = useState<Booking | null>(null);
  const [paymentHistoryBooking, setPaymentHistoryBooking] = useState<Booking | null>(null);
  const [receiptPayment, setReceiptPayment] = useState<{
    payment?: any;
    booking: Booking;
  } | null>(null);
  const [paymentError, setPaymentError] = useState<string | null>(null);

  const [installmentForm, setInstallmentForm] = useState<{
    amount: number | "";
    method: "CASH" | "BANK_TRANSFER" | "JAZZCASH" | "EASYPAISA";
    date: string;
    reference: string;
    notes: string;
  }>({
    amount: "",
    method: "CASH",
    date: new Date().toISOString().slice(0, 10),
    reference: "",
    notes: "",
  });

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

  // Close action menus when clicking outside
  useEffect(() => {
    const handleClickOutside = () => setActionMenuBookingId(null);
    window.addEventListener("click", handleClickOutside);
    return () => window.removeEventListener("click", handleClickOutside);
  }, []);

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

  // Invalidate all related financial & booking queries
  const invalidateAllBookingData = () => {
    queryClient.invalidateQueries({ queryKey: ["owner-bookings"] });
    queryClient.invalidateQueries({ queryKey: ["owner-payments"] });
    queryClient.invalidateQueries({ queryKey: ["owner-overview"] });
    queryClient.invalidateQueries({ queryKey: ["hall-availability"] });
    queryClient.invalidateQueries({ queryKey: ["owner-customers"] });
    queryClient.invalidateQueries({ queryKey: ["customer-ledger"] });
  };

  // Mutations
  const createMutation = useMutation({
    mutationFn: (formData: any) => bookingApi.create(formData),
    onSuccess: () => {
      invalidateAllBookingData();
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
      invalidateAllBookingData();
      setSelectedBooking(null);
    },
  });

  const cancelMutation = useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) =>
      bookingApi.cancel(id, reason),
    onSuccess: () => {
      invalidateAllBookingData();
      setSelectedBooking(null);
    },
  });

  // Add Installment Payment Mutation
  const addInstallmentMutation = useMutation({
    mutationFn: (formData: {
      bookingId: string;
      amount: number;
      paymentMethod: "CASH" | "BANK_TRANSFER" | "JAZZCASH" | "EASYPAISA";
      paymentDate: string;
      transactionReference?: string;
      notes?: string;
    }) => paymentApi.addPayment(formData),
    onSuccess: (res: any) => {
      invalidateAllBookingData();
      const currentBooking = receivePaymentBooking;
      setReceivePaymentBooking(null);
      setPaymentError(null);

      // Open printable receipt immediately for convenient downloading/printing
      if (currentBooking) {
        setReceiptPayment({
          payment: res?.payment,
          booking: {
            ...currentBooking,
            advanceAmount: Number(currentBooking.advanceAmount || 0) + (Number(installmentForm.amount) || 0),
            remainingAmount: Math.max(0, Number(currentBooking.remainingAmount || 0) - (Number(installmentForm.amount) || 0)),
          },
        });
      }
    },
    onError: (err: any) => {
      setPaymentError(err.message || "Failed to record payment.");
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

  const handleOpenReceivePayment = (booking: Booking) => {
    setReceivePaymentBooking(booking);
    setPaymentError(null);
    // Suggest remaining balance or 50,000 as default
    const rem = Number(booking.remainingAmount || 0);
    const suggested = rem > 0 ? Math.min(rem, 50000) : 0;
    setInstallmentForm({
      amount: suggested > 0 ? suggested : "",
      method: "CASH",
      date: new Date().toISOString().slice(0, 10),
      reference: "",
      notes: "",
    });
  };

  const handleInstallmentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!receivePaymentBooking) return;

    const amt = Number(installmentForm.amount) || 0;
    if (amt <= 0) {
      setPaymentError("Please enter a valid installment payment amount.");
      return;
    }

    const rem = Number(receivePaymentBooking.remainingAmount || 0);
    if (amt > rem) {
      setPaymentError(`Overpayment: Amount cannot exceed remaining balance of PKR ${rem.toLocaleString()}`);
      return;
    }

    setPaymentError(null);
    addInstallmentMutation.mutate({
      bookingId: receivePaymentBooking.id,
      amount: amt,
      paymentMethod: installmentForm.method,
      paymentDate: installmentForm.date,
      transactionReference: installmentForm.reference.trim() || undefined,
      notes: installmentForm.notes.trim() || undefined,
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
      <div className="rounded-2xl border border-[#e5ded4] bg-[#faf7f2] overflow-visible shadow-2xs">
        {/* Mobile View (< md) */}
        <div className="md:hidden divide-y divide-[#e5ded4]">
          {isLoading ? (
            <div className="py-12 flex justify-center">
              <div className="h-7 w-7 animate-spin rounded-full border-3 border-[#1e382b] border-t-transparent" />
            </div>
          ) : data?.bookings && data.bookings.length > 0 ? (
            data.bookings.map((b) => {
              const isNight = b.session === "NIGHT" || b.notes?.includes("[SESSION:NIGHT]");
              const tot = Number(b.totalAmount || 0);
              const adv = Number(b.advanceAmount || 0);
              const rem = Number(b.remainingAmount || 0);
              const isFullyPaid = rem <= 0 && tot > 0;
              const isPartiallyPaid = adv > 0 && rem > 0;

              return (
                <div key={b.id} className="p-4 space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-mono font-bold text-xs text-[#1f2421]">
                      {b.bookingNumber}
                    </span>
                    <div className="flex items-center gap-2">
                      {/* Payment Status Pill */}
                      {isFullyPaid ? (
                        <span className="inline-flex items-center gap-1.5 rounded-full border border-[#cce5d6] bg-[#eaf5ef] px-2.5 py-0.5 text-[10px] font-semibold text-[#1e382b]">
                          <span className="h-1.5 w-1.5 rounded-full bg-[#1b5e20]" />
                          Fully Paid
                        </span>
                      ) : isPartiallyPaid ? (
                        <span className="inline-flex items-center gap-1.5 rounded-full border border-[#f4dfb6] bg-[#fef8ed] px-2.5 py-0.5 text-[10px] font-semibold text-[#8a5d12]">
                          <span className="h-1.5 w-1.5 rounded-full bg-[#c28e36]" />
                          Partially Paid
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 rounded-full border border-[#fad0d0] bg-[#fdf2f2] px-2.5 py-0.5 text-[10px] font-semibold text-[#991b1b]">
                          <span className="h-1.5 w-1.5 rounded-full bg-[#dc2626]" />
                          Unpaid
                        </span>
                      )}

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
                        PKR {tot.toLocaleString()}
                      </p>
                    </div>
                    <div>
                      <span className="text-[10px] text-[#7a6f60] font-medium">Advance</span>
                      <p className="font-semibold text-[#1f2421] text-xs mt-0.5">
                        PKR {adv.toLocaleString()}
                      </p>
                    </div>
                    <div>
                      <span className="text-[10px] text-[#7a6f60] font-medium">Remaining</span>
                      <p className="font-semibold text-[#c28e36] text-xs mt-0.5">
                        PKR {rem.toLocaleString()}
                      </p>
                    </div>
                  </div>

                  {/* Actions Bar for Mobile */}
                  <div className="flex items-center justify-between gap-2 pt-1 border-t border-[#e5ded4]/60">
                    <button
                      onClick={() => handleOpenReceivePayment(b)}
                      disabled={isFullyPaid}
                      className="flex-1 inline-flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-lg bg-[#eaf5ef] hover:bg-[#d6ede0] text-xs font-semibold text-[#1e382b] transition cursor-pointer disabled:opacity-40"
                    >
                      <CreditCard className="h-3.5 w-3.5" />
                      <span>{isFullyPaid ? "Paid in Full" : "Receive Pay"}</span>
                    </button>

                    <button
                      onClick={() => setPaymentHistoryBooking(b)}
                      className="inline-flex items-center justify-center gap-1 py-1.5 px-2.5 rounded-lg border border-[#d6cec3] bg-white hover:bg-[#ebe3d7] text-xs font-semibold text-[#1f2421] transition cursor-pointer"
                    >
                      <Clock className="h-3.5 w-3.5 text-[#7a6f60]" />
                      <span>History</span>
                    </button>

                    <button
                      onClick={() => setSelectedBooking(b)}
                      className="inline-flex items-center justify-center gap-1 py-1.5 px-2.5 rounded-lg border border-[#d6cec3] bg-white hover:bg-[#ebe3d7] text-xs font-semibold text-[#1f2421] transition cursor-pointer"
                    >
                      <Eye className="h-3.5 w-3.5 text-[#7a6f60]" />
                      <span>Details</span>
                    </button>
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

        {/* Desktop Table View (Matches media_1795765706889_e359621c) */}
        <div className="hidden md:block overflow-x-visible">
          <table className="w-full text-left text-xs text-[#1f2421]">
            <thead className="bg-[#faf7f2] text-[11px] font-bold uppercase tracking-wider text-[#7a6f60] border-b border-[#e5ded4] select-none">
              <tr>
                <th className="px-4 py-3.5 font-bold">Booking #</th>
                <th className="px-4 py-3.5 font-bold">Hall</th>
                <th className="px-4 py-3.5 font-bold">Customer</th>
                <th className="px-4 py-3.5 font-bold">Session</th>
                <th className="px-4 py-3.5 font-bold">Event Date</th>
                <th className="px-4 py-3.5 font-bold">Status</th>
                <th className="px-4 py-3.5 font-bold">Total (PKR)</th>
                <th className="px-4 py-3.5 font-bold">Advance</th>
                <th className="px-4 py-3.5 font-bold">Remaining</th>
                <th className="px-4 py-3.5 font-bold text-center">Payment Status</th>
                <th className="px-4 py-3.5 font-bold text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#e5ded4]">
              {isLoading ? (
                <tr>
                  <td colSpan={11} className="px-5 py-12 text-center text-xs text-[#7a6f60]">
                    <div className="flex justify-center">
                      <div className="h-7 w-7 animate-spin rounded-full border-3 border-[#1e382b] border-t-transparent" />
                    </div>
                  </td>
                </tr>
              ) : data?.bookings && data.bookings.length > 0 ? (
                data.bookings.map((b) => {
                  const isNight = b.session === "NIGHT" || b.notes?.includes("[SESSION:NIGHT]");
                  const tot = Number(b.totalAmount || 0);
                  const adv = Number(b.advanceAmount || 0);
                  const rem = Number(b.remainingAmount || 0);
                  const isFullyPaid = rem <= 0 && tot > 0;
                  const isPartiallyPaid = adv > 0 && rem > 0;

                  return (
                    <tr key={b.id} className="hover:bg-[#ebe3d7]/20 transition relative">
                      {/* Booking # */}
                      <td className="px-4 py-4 font-mono font-bold text-[#1f2421] whitespace-nowrap">
                        {b.bookingNumber}
                      </td>

                      {/* Hall */}
                      <td className="px-4 py-4 font-semibold text-[#1f2421] leading-tight max-w-[120px]">
                        {b.hall?.name || "—"}
                      </td>

                      {/* Customer */}
                      <td className="px-4 py-4">
                        <div className="font-semibold text-[#1f2421]">{b.customerName}</div>
                        <div className="text-[11px] text-[#7a6f60] font-mono">{b.customerPhone}</div>
                      </td>

                      {/* Session */}
                      <td className="px-4 py-4 font-medium text-[#1f2421] whitespace-nowrap">
                        {isNight ? "☾ Night" : "☼ Day"}
                      </td>

                      {/* Event Date */}
                      <td className="px-4 py-4 font-mono text-[#1f2421] whitespace-nowrap">
                        {b.eventDate}
                      </td>

                      {/* Status */}
                      <td className="px-4 py-4 whitespace-nowrap">
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
                      <td className="px-4 py-4 font-semibold text-[#1f2421] whitespace-nowrap">
                        PKR {tot.toLocaleString()}
                      </td>

                      {/* Advance */}
                      <td className="px-4 py-4 font-semibold text-[#1f2421] whitespace-nowrap">
                        PKR {adv.toLocaleString()}
                      </td>

                      {/* Remaining */}
                      <td className="px-4 py-4 font-semibold text-[#c28e36] whitespace-nowrap">
                        PKR {rem.toLocaleString()}
                      </td>

                      {/* Payment Status Column (Clean, luxury bespoke aesthetic) */}
                      <td className="px-4 py-4 text-center whitespace-nowrap">
                        {isFullyPaid ? (
                          <span className="inline-flex items-center gap-1.5 rounded-full border border-[#cce5d6] bg-[#eaf5ef] px-2.5 py-0.5 text-[11px] font-semibold text-[#1e382b]">
                            <span className="h-1.5 w-1.5 rounded-full bg-[#1b5e20]" />
                            Fully Paid
                          </span>
                        ) : isPartiallyPaid ? (
                          <span className="inline-flex items-center gap-1.5 rounded-full border border-[#f4dfb6] bg-[#fef8ed] px-2.5 py-0.5 text-[11px] font-semibold text-[#8a5d12]">
                            <span className="h-1.5 w-1.5 rounded-full bg-[#c28e36]" />
                            Partially Paid
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 rounded-full border border-[#fad0d0] bg-[#fdf2f2] px-2.5 py-0.5 text-[11px] font-semibold text-[#991b1b]">
                            <span className="h-1.5 w-1.5 rounded-full bg-[#dc2626]" />
                            Unpaid
                          </span>
                        )}
                      </td>

                      {/* 3-Dot Actions Column (Exact match to screenshot) */}
                      <td className="px-4 py-4 text-center whitespace-nowrap relative">
                        <div className="relative inline-block text-left">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setActionMenuBookingId(actionMenuBookingId === b.id ? null : b.id);
                            }}
                            className="inline-flex items-center justify-center rounded-lg bg-[#1e382b] hover:bg-[#162a20] text-white px-2.5 py-1 text-xs font-bold tracking-widest transition cursor-pointer active:scale-95"
                            title="Actions menu"
                          >
                            •••
                          </button>

                          {/* Dropdown Menu (Matches media_1795765706889_e359621c item 2) */}
                          {actionMenuBookingId === b.id && (
                            <div
                              onClick={(e) => e.stopPropagation()}
                              className="absolute right-0 top-full mt-1.5 w-48 rounded-xl border border-[#e5ded4] bg-white p-1.5 shadow-xl z-50 text-left animate-in fade-in zoom-in-95 duration-100"
                            >
                              {/* 1. View Details */}
                              <button
                                type="button"
                                onClick={() => {
                                  setSelectedBooking(b);
                                  setActionMenuBookingId(null);
                                }}
                                className="w-full flex items-center gap-2.5 rounded-lg px-3 py-2 text-xs font-medium text-[#1f2421] hover:bg-[#faf7f2] transition cursor-pointer"
                              >
                                <Eye className="h-3.5 w-3.5 text-[#7a6f60]" />
                                <span>View Details</span>
                              </button>

                              {/* 2. Receive Payment (Highlighted in soft green) */}
                              <button
                                type="button"
                                onClick={() => {
                                  handleOpenReceivePayment(b);
                                  setActionMenuBookingId(null);
                                }}
                                className="w-full flex items-center gap-2.5 rounded-lg bg-[#eaf5ef] px-3 py-2 text-xs font-semibold text-[#1e382b] hover:bg-[#d6ede0] transition cursor-pointer my-0.5"
                              >
                                <CreditCard className="h-3.5 w-3.5 text-[#1e382b]" />
                                <span>Receive Payment</span>
                              </button>

                              {/* 3. Payment History */}
                              <button
                                type="button"
                                onClick={() => {
                                  setPaymentHistoryBooking(b);
                                  setActionMenuBookingId(null);
                                }}
                                className="w-full flex items-center gap-2.5 rounded-lg px-3 py-2 text-xs font-medium text-[#1f2421] hover:bg-[#faf7f2] transition cursor-pointer"
                              >
                                <Clock className="h-3.5 w-3.5 text-[#7a6f60]" />
                                <span>Payment History</span>
                              </button>

                              {/* 4. Download Receipt */}
                              <button
                                type="button"
                                onClick={() => {
                                  setReceiptPayment({ booking: b });
                                  setActionMenuBookingId(null);
                                }}
                                className="w-full flex items-center gap-2.5 rounded-lg px-3 py-2 text-xs font-medium text-[#1f2421] hover:bg-[#faf7f2] transition cursor-pointer"
                              >
                                <Download className="h-3.5 w-3.5 text-[#7a6f60]" />
                                <span>Download Receipt</span>
                              </button>
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={11} className="px-5 py-10 text-center text-xs text-[#7a6f60] font-medium">
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
      {/* 4. RECEIVE NEW PAYMENT MODAL (Matches media_1795765706889_e359621c item 3/4) */}
      {/* ============================================================== */}
      <Modal
        isOpen={!!receivePaymentBooking}
        onClose={() => setReceivePaymentBooking(null)}
        maxWidth="max-w-lg"
      >
        {receivePaymentBooking && (
          <div className="font-sans">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-[#e5ded4] pb-3 mb-4">
              <div className="flex items-center gap-2.5">
                <div className="rounded-lg bg-[#eaf5ef] p-2 text-[#1e382b]">
                  <CreditCard className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-serif text-xl text-[#1f2421] font-semibold leading-tight">
                    Receive New Payment
                  </h3>
                  <p className="text-xs text-[#7a6f60] font-mono mt-0.5">
                    Booking: {receivePaymentBooking.bookingNumber}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setReceivePaymentBooking(null)}
                className="text-[#7a6f60] hover:text-[#1f2421] rounded-lg p-1.5 cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Error Message */}
            {paymentError && (
              <div className="mb-4 flex items-center gap-2 rounded-xl bg-rose-50 p-3 text-xs text-rose-700 border border-rose-200">
                <AlertCircle className="h-4 w-4 shrink-0 text-rose-600" />
                <span>{paymentError}</span>
              </div>
            )}

            {/* 3-Box Summary Banner (Exact match to screenshot) */}
            <div className="rounded-xl border border-[#cfe6d8] bg-[#edf6f1] p-3 grid grid-cols-3 divide-x divide-[#bad8c6] text-center mb-4">
              <div className="px-1 sm:px-2">
                <span className="text-[11px] text-[#556b5d] font-semibold block">Total Amount</span>
                <span className="font-bold text-xs sm:text-sm text-[#1e382b]">
                  PKR {Number(receivePaymentBooking.totalAmount || 0).toLocaleString()}
                </span>
              </div>
              <div className="px-1 sm:px-2">
                <span className="text-[11px] text-[#556b5d] font-semibold block">Already Paid</span>
                <span className="font-bold text-xs sm:text-sm text-[#1e382b]">
                  PKR {Number(receivePaymentBooking.advanceAmount || 0).toLocaleString()}
                </span>
              </div>
              <div className="px-1 sm:px-2">
                <span className="text-[11px] text-[#556b5d] font-semibold block">Remaining Balance</span>
                <span className="font-bold text-xs sm:text-sm text-[#1e382b]">
                  PKR {Number(receivePaymentBooking.remainingAmount || 0).toLocaleString()}
                </span>
              </div>
            </div>

            {/* Payment Form */}
            <form onSubmit={handleInstallmentSubmit} className="space-y-4">
              {/* Payment Amount with PKR badge */}
              <div>
                <label className="block text-xs font-bold text-[#1f2421] mb-1.5">
                  Payment Amount
                </label>
                <div className="flex rounded-xl overflow-hidden border border-[#d6cec3] focus-within:border-[#1e382b] focus-within:ring-1 focus-within:ring-[#1e382b]/30 bg-white">
                  <span className="inline-flex items-center justify-center px-4 bg-[#1e382b] text-white font-bold text-xs tracking-wider">
                    PKR
                  </span>
                  <input
                    type="number"
                    required
                    min={1}
                    max={Number(receivePaymentBooking.remainingAmount || 0)}
                    value={installmentForm.amount === "" ? "" : installmentForm.amount}
                    onChange={(e) =>
                      setInstallmentForm({
                        ...installmentForm,
                        amount: e.target.value === "" ? "" : Number(e.target.value),
                      })
                    }
                    placeholder="50,000"
                    className="w-full px-3.5 py-2.5 text-base font-bold text-[#1f2421] focus:outline-none bg-transparent"
                  />
                </div>
              </div>

              {/* Payment Method Cards (Exact 4 Cards from screenshot) */}
              <div>
                <label className="block text-xs font-bold text-[#1f2421] mb-1.5">
                  Payment Method
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  {/* Cash */}
                  <button
                    type="button"
                    onClick={() => setInstallmentForm({ ...installmentForm, method: "CASH" })}
                    className={`relative flex flex-col items-center justify-center p-3 rounded-xl border transition cursor-pointer ${
                      installmentForm.method === "CASH"
                        ? "border-2 border-emerald-600 bg-emerald-50/50 shadow-2xs"
                        : "border-[#d6cec3] bg-white hover:bg-[#faf7f2]"
                    }`}
                  >
                    {installmentForm.method === "CASH" && (
                      <span className="absolute top-1.5 right-1.5 w-4 h-4 rounded-full bg-emerald-600 text-white flex items-center justify-center">
                        <Check className="h-2.5 w-2.5 stroke-[3]" />
                      </span>
                    )}
                    <Banknote className="h-5 w-5 text-emerald-700 mb-1" />
                    <span className="text-xs font-semibold text-[#1f2421]">Cash</span>
                  </button>

                  {/* Bank Transfer */}
                  <button
                    type="button"
                    onClick={() => setInstallmentForm({ ...installmentForm, method: "BANK_TRANSFER" })}
                    className={`relative flex flex-col items-center justify-center p-3 rounded-xl border transition cursor-pointer ${
                      installmentForm.method === "BANK_TRANSFER"
                        ? "border-2 border-emerald-600 bg-emerald-50/50 shadow-2xs"
                        : "border-[#d6cec3] bg-white hover:bg-[#faf7f2]"
                    }`}
                  >
                    {installmentForm.method === "BANK_TRANSFER" && (
                      <span className="absolute top-1.5 right-1.5 w-4 h-4 rounded-full bg-emerald-600 text-white flex items-center justify-center">
                        <Check className="h-2.5 w-2.5 stroke-[3]" />
                      </span>
                    )}
                    <Landmark className="h-5 w-5 text-slate-700 mb-1" />
                    <span className="text-xs font-semibold text-[#1f2421]">Bank Transfer</span>
                  </button>

                  {/* JazzCash */}
                  <button
                    type="button"
                    onClick={() => setInstallmentForm({ ...installmentForm, method: "JAZZCASH" })}
                    className={`relative flex flex-col items-center justify-center p-3 rounded-xl border transition cursor-pointer ${
                      installmentForm.method === "JAZZCASH"
                        ? "border-2 border-emerald-600 bg-emerald-50/50 shadow-2xs"
                        : "border-[#d6cec3] bg-white hover:bg-[#faf7f2]"
                    }`}
                  >
                    {installmentForm.method === "JAZZCASH" && (
                      <span className="absolute top-1.5 right-1.5 w-4 h-4 rounded-full bg-emerald-600 text-white flex items-center justify-center">
                        <Check className="h-2.5 w-2.5 stroke-[3]" />
                      </span>
                    )}
                    <div className="h-5 w-5 rounded-full bg-[#b71c1c] flex items-center justify-center text-[10px] font-bold text-white mb-1">
                      J
                    </div>
                    <span className="text-xs font-semibold text-[#1f2421]">JazzCash</span>
                  </button>

                  {/* EasyPaisa */}
                  <button
                    type="button"
                    onClick={() => setInstallmentForm({ ...installmentForm, method: "EASYPAISA" })}
                    className={`relative flex flex-col items-center justify-center p-3 rounded-xl border transition cursor-pointer ${
                      installmentForm.method === "EASYPAISA"
                        ? "border-2 border-emerald-600 bg-emerald-50/50 shadow-2xs"
                        : "border-[#d6cec3] bg-white hover:bg-[#faf7f2]"
                    }`}
                  >
                    {installmentForm.method === "EASYPAISA" && (
                      <span className="absolute top-1.5 right-1.5 w-4 h-4 rounded-full bg-emerald-600 text-white flex items-center justify-center">
                        <Check className="h-2.5 w-2.5 stroke-[3]" />
                      </span>
                    )}
                    <div className="h-5 w-5 rounded-full bg-[#008744] flex items-center justify-center text-[11px] font-bold text-white mb-1">
                      e
                    </div>
                    <span className="text-xs font-semibold text-[#1f2421]">EasyPaisa</span>
                  </button>
                </div>
              </div>

              {/* Payment Date */}
              <div>
                <label className="block text-xs font-bold text-[#1f2421] mb-1.5">
                  Payment Date
                </label>
                <input
                  type="date"
                  required
                  value={installmentForm.date}
                  onChange={(e) => setInstallmentForm({ ...installmentForm, date: e.target.value })}
                  className="w-full rounded-xl border border-[#d6cec3] bg-white px-3.5 py-2.5 text-xs text-[#1f2421] font-mono focus:border-[#1e382b] focus:outline-none"
                />
              </div>

              {/* Transaction Reference (Optional) */}
              <div>
                <label className="block text-xs font-bold text-[#1f2421] mb-1.5">
                  Transaction Reference (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Bank Ref / Transaction ID"
                  value={installmentForm.reference}
                  onChange={(e) => setInstallmentForm({ ...installmentForm, reference: e.target.value })}
                  className="w-full rounded-xl border border-[#d6cec3] bg-white px-3.5 py-2.5 text-xs text-[#1f2421] focus:border-[#1e382b] focus:outline-none"
                />
              </div>

              {/* Notes (Optional) */}
              <div>
                <label className="block text-xs font-bold text-[#1f2421] mb-1.5">
                  Notes (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Second installment received."
                  value={installmentForm.notes}
                  onChange={(e) => setInstallmentForm({ ...installmentForm, notes: e.target.value })}
                  className="w-full rounded-xl border border-[#d6cec3] bg-white px-3.5 py-2.5 text-xs text-[#1f2421] focus:border-[#1e382b] focus:outline-none"
                />
              </div>

              {/* Confirm Payment Button (Exact match to screenshot) */}
              <button
                type="submit"
                disabled={addInstallmentMutation.isPending}
                className="w-full mt-2 rounded-xl bg-[#1e382b] hover:bg-[#162a20] py-3 text-sm font-semibold text-white shadow-xs transition active:scale-[0.99] flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                <Check className="h-4 w-4 stroke-[3]" />
                <span>
                  {addInstallmentMutation.isPending ? "Recording Installment..." : "Confirm Payment"}
                </span>
              </button>
            </form>
          </div>
        )}
      </Modal>

      {/* ============================================================== */}
      {/* 5. PAYMENT SUMMARY & PAYMENT HISTORY MODAL (Matches Card 5 & 6) */}
      {/* ============================================================== */}
      <Modal
        isOpen={!!paymentHistoryBooking}
        onClose={() => setPaymentHistoryBooking(null)}
        maxWidth="max-w-2xl"
      >
        {paymentHistoryBooking && (
          <div className="font-sans space-y-5">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-[#e5ded4] pb-3">
              <div>
                <span className="text-xs font-mono font-bold text-[#1e382b]">
                  Booking #{paymentHistoryBooking.bookingNumber}
                </span>
                <h3 className="font-serif text-xl text-[#1f2421] font-semibold">
                  Payment Summary & Installment History
                </h3>
                <p className="text-xs text-[#7a6f60] mt-0.5">
                  {paymentHistoryBooking.customerName} • {paymentHistoryBooking.hall?.name}
                </p>
              </div>
              <button
                onClick={() => setPaymentHistoryBooking(null)}
                className="text-[#7a6f60] hover:text-[#1f2421] rounded-lg p-1.5 cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* CARD 5: Payment Summary (Exact visual match to screenshot item 5) */}
            <div className="rounded-2xl border border-[#e5ded4] bg-white p-5 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-[#16a34a] text-white flex items-center justify-center">
                    <Check className="h-4 w-4 stroke-[3]" />
                  </div>
                  <h4 className="font-serif text-lg font-bold text-[#1f2421]">Payment Summary</h4>
                </div>
                <button
                  onClick={() => {
                    const b = paymentHistoryBooking;
                    setPaymentHistoryBooking(null);
                    handleOpenReceivePayment(b);
                  }}
                  disabled={Number(paymentHistoryBooking.remainingAmount || 0) <= 0}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-[#1e382b] hover:bg-[#162a20] px-3 py-1.5 text-xs font-semibold text-white transition cursor-pointer disabled:opacity-40"
                >
                  <Plus className="h-3.5 w-3.5" />
                  <span>Receive Installment</span>
                </button>
              </div>

              {/* Financial Lines */}
              <div className="space-y-2 text-sm divide-y divide-[#f0eae1] pt-1">
                <div className="flex justify-between py-1">
                  <span className="text-[#7a6f60] font-medium">Total Amount</span>
                  <span className="font-bold text-[#1f2421]">
                    PKR {Number(paymentHistoryBooking.totalAmount || 0).toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between py-1 text-emerald-800">
                  <span className="font-medium">Total Paid</span>
                  <span className="font-bold">
                    PKR {Number(paymentHistoryBooking.advanceAmount || 0).toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between py-1 text-[#c28e36]">
                  <span className="font-bold">Remaining</span>
                  <span className="font-bold text-base">
                    PKR {Number(paymentHistoryBooking.remainingAmount || 0).toLocaleString()}
                  </span>
                </div>
              </div>

              {/* Status Banner */}
              {Number(paymentHistoryBooking.remainingAmount || 0) <= 0 ? (
                <div className="rounded-xl bg-[#eaf5ef] border border-[#cce5d6] py-2.5 text-center text-sm font-semibold text-[#1e382b] flex items-center justify-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-[#1b5e20]" />
                  <span>Fully Paid</span>
                </div>
              ) : Number(paymentHistoryBooking.advanceAmount || 0) > 0 ? (
                <div className="rounded-xl bg-[#fef8ed] border border-[#f4dfb6] py-2.5 text-center text-sm font-semibold text-[#8a5d12] flex items-center justify-center gap-2">
                  <Clock className="h-4 w-4 text-[#c28e36]" />
                  <span>Partially Paid</span>
                </div>
              ) : (
                <div className="rounded-xl bg-[#fdf2f2] border border-[#fad0d0] py-2.5 text-center text-sm font-semibold text-[#991b1b] flex items-center justify-center gap-2">
                  <AlertCircle className="h-4 w-4 text-[#dc2626]" />
                  <span>Unpaid</span>
                </div>
              )}

              {/* Percentage Progress Bar */}
              {(() => {
                const tot = Number(paymentHistoryBooking.totalAmount) || 1;
                const paid = Number(paymentHistoryBooking.advanceAmount) || 0;
                const pct = Math.min(100, Math.round((paid / tot) * 100));
                return (
                  <div className="space-y-1.5 pt-1">
                    <div className="w-full bg-[#e5ded4] rounded-full h-2.5 overflow-hidden">
                      <div
                        className="bg-[#16a34a] h-2.5 rounded-full transition-all duration-500"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <p className="text-center text-xs font-bold text-[#1e382b]">
                      {pct}% Payment Completed
                    </p>
                  </div>
                );
              })()}
            </div>

            {/* CARD 6: Payment History Table (Exact visual match to screenshot item 6) */}
            <div className="rounded-2xl border border-[#e5ded4] bg-white p-5 shadow-xs space-y-3">
              <div className="flex items-center justify-between border-b border-[#e5ded4] pb-2.5">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-[#1e382b]" />
                  <h4 className="font-serif text-base font-bold text-[#1f2421]">Payment History</h4>
                </div>
                <Link
                  href="/dashboard/payments"
                  className="text-xs font-semibold text-[#1e382b] hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <span>View All</span>
                  <ArrowRight className="h-3 w-3" />
                </Link>
              </div>

              {/* Transactions Table */}
              {paymentHistoryBooking.payments && paymentHistoryBooking.payments.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs text-[#1f2421]">
                    <thead className="bg-[#faf7f2] text-[11px] font-bold uppercase text-[#7a6f60] border-b border-[#e5ded4]">
                      <tr>
                        <th className="py-2 px-3">#</th>
                        <th className="py-2 px-3">Date</th>
                        <th className="py-2 px-3">Amount</th>
                        <th className="py-2 px-3">Method</th>
                        <th className="py-2 px-3">Reference</th>
                        <th className="py-2 px-3 text-right">Receipt</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#e5ded4]">
                      {paymentHistoryBooking.payments.map((p: any, idx: number) => {
                        const countRev = paymentHistoryBooking.payments!.length - idx;
                        const numStr = `#${String(countRev).padStart(3, "0")}`;
                        const pDate = p.paymentDate
                          ? new Date(p.paymentDate).toLocaleDateString("en-GB", {
                              day: "2-digit",
                              month: "short",
                              year: "numeric",
                            })
                          : new Date(p.createdAt).toLocaleDateString("en-GB", {
                              day: "2-digit",
                              month: "short",
                              year: "numeric",
                            });

                        let methodDisplay = p.method || "Cash";
                        if (p.transactionReference?.includes("JazzCash")) methodDisplay = "JazzCash";
                        else if (p.transactionReference?.includes("EasyPaisa")) methodDisplay = "EasyPaisa";
                        else if (methodDisplay === "BANK_TRANSFER") methodDisplay = "Bank Transfer";
                        else if (methodDisplay === "CASH") methodDisplay = "Cash";

                        return (
                          <tr key={p.id} className="hover:bg-[#faf7f2] transition">
                            <td className="py-2.5 px-3 font-mono font-bold text-[#7a6f60]">
                              {numStr}
                            </td>
                            <td className="py-2.5 px-3 font-mono">{pDate}</td>
                            <td className="py-2.5 px-3 font-bold text-[#1e382b]">
                              PKR {Number(p.amount).toLocaleString()}
                            </td>
                            <td className="py-2.5 px-3">
                              <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-[#faf7f2] border border-[#e5ded4] text-[11px] font-medium">
                                {methodDisplay}
                              </span>
                            </td>
                            <td className="py-2.5 px-3 text-[#7a6f60] font-mono text-[11px]">
                              {p.transactionReference || "-"}
                            </td>
                            <td className="py-2.5 px-3 text-right">
                              <button
                                onClick={() => {
                                  setReceiptPayment({
                                    payment: p,
                                    booking: paymentHistoryBooking,
                                  });
                                }}
                                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md border border-[#d6cec3] bg-white hover:bg-[#faf7f2] text-[11px] font-semibold text-[#1e382b] transition cursor-pointer"
                                title="Print installment receipt"
                              >
                                <Printer className="h-3 w-3" />
                                <span>Receipt</span>
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="py-8 text-center text-xs text-[#7a6f60]">
                  <p>No separate installment records found for this booking yet.</p>
                  {Number(paymentHistoryBooking.remainingAmount || 0) > 0 && (
                    <button
                      onClick={() => {
                        const b = paymentHistoryBooking;
                        setPaymentHistoryBooking(null);
                        handleOpenReceivePayment(b);
                      }}
                      className="mt-2.5 inline-flex items-center gap-1.5 rounded-lg bg-[#1e382b] text-white px-3 py-1.5 text-xs font-semibold cursor-pointer"
                    >
                      <Plus className="h-3.5 w-3.5" />
                      <span>Receive First Installment</span>
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </Modal>

      {/* ============================================================== */}
      {/* 6. DOWNLOAD / PRINT OFFICIAL RECEIPT VOUCHER MODAL             */}
      {/* ============================================================== */}
      <Modal
        isOpen={!!receiptPayment}
        onClose={() => setReceiptPayment(null)}
        maxWidth="max-w-xl"
      >
        {receiptPayment && (
          <div className="font-sans">
            {/* Top Bar with Print & Close */}
            <div className="flex items-center justify-between border-b border-[#e5ded4] pb-3 mb-4 print:hidden">
              <div className="flex items-center gap-2">
                <Receipt className="h-5 w-5 text-[#1e382b]" />
                <h3 className="font-serif text-xl text-[#1f2421] font-semibold">
                  Official Payment Voucher
                </h3>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handlePrint}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-[#1e382b] hover:bg-[#162a20] px-3.5 py-1.5 text-xs font-semibold text-white transition cursor-pointer shadow-xs"
                >
                  <Printer className="h-4 w-4" />
                  <span>Print Voucher</span>
                </button>
                <button
                  type="button"
                  onClick={() => setReceiptPayment(null)}
                  className="text-[#7a6f60] hover:text-[#1f2421] rounded-lg p-1.5 cursor-pointer"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            {/* Printable Voucher Slip (A4 / Thermal voucher ready) */}
            <div className="rounded-2xl border border-[#d6cec3] bg-white p-6 space-y-5 text-xs text-[#1f2421] shadow-2xs">
              {/* Slip Header */}
              <div className="flex items-start justify-between border-b border-[#e5ded4] pb-4">
                <div>
                  <h2 className="font-serif text-2xl font-bold text-[#1e382b] tracking-tight">
                    {receiptPayment.booking.hall?.name || "Wedding & Banquet Hall"}
                  </h2>
                  <p className="text-xs text-[#7a6f60] mt-0.5">
                    {receiptPayment.booking.hall?.city || "Authorized Event Venue"}
                  </p>
                  <p className="text-[11px] text-[#7a6f60] font-mono mt-0.5">
                    Official Hall Management Receipt
                  </p>
                </div>
                <div className="text-right">
                  <span className="inline-block rounded-md bg-[#eaf5ef] px-2.5 py-1 text-xs font-bold font-mono text-[#1e382b]">
                    {receiptPayment.payment?.id
                      ? `REC-${receiptPayment.payment.id.slice(0, 8).toUpperCase()}`
                      : `REC-${receiptPayment.booking.bookingNumber}`}
                  </span>
                  <p className="text-[11px] text-[#7a6f60] font-mono mt-1">
                    Date:{" "}
                    {receiptPayment.payment?.paymentDate
                      ? new Date(receiptPayment.payment.paymentDate).toLocaleDateString("en-GB", {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                        })
                      : new Date().toLocaleDateString("en-GB", {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                        })}
                  </p>
                </div>
              </div>

              {/* Customer & Event Details */}
              <div className="grid grid-cols-2 gap-3 rounded-xl bg-[#faf7f2] p-3.5 border border-[#e5ded4]">
                <div>
                  <span className="text-[10px] text-[#7a6f60] uppercase font-bold tracking-wider">
                    Customer Name
                  </span>
                  <p className="font-bold text-sm text-[#1f2421] mt-0.5">
                    {receiptPayment.booking.customerName}
                  </p>
                  <p className="text-xs text-[#7a6f60] font-mono">
                    {receiptPayment.booking.customerPhone}
                  </p>
                </div>
                <div>
                  <span className="text-[10px] text-[#7a6f60] uppercase font-bold tracking-wider">
                    Booking Reference
                  </span>
                  <p className="font-mono font-bold text-sm text-[#1e382b] mt-0.5">
                    {receiptPayment.booking.bookingNumber}
                  </p>
                  <p className="text-xs text-[#7a6f60]">
                    Event: {receiptPayment.booking.eventDate} (
                    {receiptPayment.booking.session === "NIGHT" ? "Night" : "Day"})
                  </p>
                </div>
              </div>

              {/* Installment Amount Received (Highlighted Banner) */}
              <div className="rounded-xl border border-emerald-300 bg-emerald-50/70 p-4 text-center">
                <span className="text-xs text-emerald-800 font-semibold uppercase tracking-wider block">
                  {receiptPayment.payment ? "Installment Received" : "Total Advance Received"}
                </span>
                <span className="text-2xl font-serif font-bold text-emerald-900 block mt-1">
                  PKR{" "}
                  {Number(
                    receiptPayment.payment
                      ? receiptPayment.payment.amount
                      : receiptPayment.booking.advanceAmount
                  ).toLocaleString()}
                </span>
                <p className="text-xs text-emerald-700 mt-1">
                  Payment Method:{" "}
                  <strong className="uppercase">
                    {receiptPayment.payment?.method || receiptPayment.payment?.paymentMethod || "CASH"}
                  </strong>
                  {receiptPayment.payment?.transactionReference && (
                    <span className="ml-2 font-mono">
                      (Ref: {receiptPayment.payment.transactionReference})
                    </span>
                  )}
                </p>
              </div>

              {/* Cumulative Financial Summary */}
              <div className="rounded-xl border border-[#e5ded4] bg-white p-3.5 space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-[#7a6f60]">Total Agreed Hall Rent:</span>
                  <span className="font-bold text-[#1f2421]">
                    PKR {Number(receiptPayment.booking.totalAmount).toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between text-emerald-800">
                  <span>Total Received to Date:</span>
                  <span className="font-bold">
                    PKR {Number(receiptPayment.booking.advanceAmount).toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between text-[#c28e36] font-bold border-t border-[#e5ded4] pt-2 text-sm">
                  <span>Remaining Balance Due:</span>
                  <span>
                    PKR {Number(receiptPayment.booking.remainingAmount).toLocaleString()}
                  </span>
                </div>
              </div>

              {/* Signatures */}
              <div className="grid grid-cols-2 gap-8 pt-6 border-t border-[#e5ded4] text-center text-xs text-[#7a6f60]">
                <div>
                  <div className="border-b border-[#d6cec3] pb-6 mb-1" />
                  <p className="font-semibold text-[#1f2421]">Authorized Hall Signatory</p>
                  <p className="text-[10px] text-[#7a6f60]">Management Stamp & Sign</p>
                </div>
                <div>
                  <div className="border-b border-[#d6cec3] pb-6 mb-1" />
                  <p className="font-semibold text-[#1f2421]">Customer Signature</p>
                  <p className="text-[10px] text-[#7a6f60]">Acknowledgment of Payment</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* ============================================================== */}
      {/* 7. BOOKING DETAILS & INVOICE MODAL                             */}
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
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-bold text-xs uppercase tracking-wider text-[#7a6f60]">Financial Statement</h4>
                  <button
                    onClick={() => {
                      const b = selectedBooking;
                      setSelectedBooking(null);
                      handleOpenReceivePayment(b);
                    }}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-[#eaf5ef] hover:bg-[#d6ede0] px-3 py-1 text-xs font-semibold text-[#1e382b] transition cursor-pointer"
                  >
                    <CreditCard className="h-3.5 w-3.5" />
                    <span>Receive Payment</span>
                  </button>
                </div>
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
      {/* 8. CREATE BOOKING MODAL                                        */}
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
