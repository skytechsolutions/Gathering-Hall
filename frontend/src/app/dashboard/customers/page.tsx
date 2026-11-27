"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { customerApi, Customer, CustomerLedger } from "@/services/api/customer.api";
import { useAuth } from "@/context/auth-context";
import { format, parseISO } from "date-fns";
import {
  FileText,
  Phone,
  MapPin,
  X,
  Printer,
  Sun,
  Moon,
  Building2,
  CheckCircle2,
  Clock,
} from "lucide-react";

export default function OwnerCustomersPage() {
  const { user, brandSettings } = useAuth();
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);
  const [printModalCustomerId, setPrintModalCustomerId] = useState<string | null>(null);

  // Fetch customers list with aggregated ledger info
  const { data, isLoading } = useQuery({
    queryKey: ["owner-customers", search, page],
    queryFn: async () => {
      const res = await customerApi.getAll({
        search: search.trim() || undefined,
        page,
        limit: 15,
      });
      return res as {
        customers: Customer[];
        pagination: { total: number; page: number; totalPages: number };
      };
    },
  });

  // Active ledger for details modal or print modal
  const activeDetailId = selectedCustomerId || printModalCustomerId;
  const { data: ledgerData, isLoading: ledgerLoading } = useQuery({
    queryKey: ["customer-ledger", activeDetailId],
    queryFn: async () => {
      if (!activeDetailId) return null;
      const res = await customerApi.getLedger(activeDetailId);
      return res as CustomerLedger;
    },
    enabled: !!activeDetailId,
  });

  // Calculate top-level financial metrics from current customers list
  const totalCustomers = data?.pagination?.total || data?.customers?.length || 0;
  const totalBilledAgg =
    data?.customers?.reduce((acc, c) => acc + (c.totalBookingsAmount || 0), 0) || 0;
  const totalPaidAgg =
    data?.customers?.reduce((acc, c) => acc + (c.totalAdvancePaid || 0), 0) || 0;
  const totalRemainingAgg =
    data?.customers?.reduce((acc, c) => acc + (c.totalRemaining || 0), 0) || 0;

  const handleTriggerPrint = () => {
    window.print();
  };

  const activeCustomer = ledgerData?.customer;
  const activeLedger = ledgerData?.ledger || {
    totalBilled: ledgerData?.totalBilled || 0,
    totalPaid: ledgerData?.totalPaid || 0,
    totalRemaining: ledgerData?.remainingBalance || 0,
    bookingsCount: ledgerData?.bookingsCount || 0,
  };

  return (
    <div className="space-y-5 select-none font-sans">
      {/* ============================================================== */}
      {/* 1. TOP HEADER ROW (Matches media_1795762388640_f310d33b)       */}
      {/* ============================================================== */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div>
          <h1 className="font-serif text-2xl sm:text-3xl text-[#1f2421] font-normal tracking-tight">
            Customers & Ledger Statements
          </h1>
          <p className="text-xs text-[#7a6f60] font-normal mt-0.5">
            Complete customer client directory, live account balances, booking history, and printable audit statements
          </p>
        </div>

        <button
          onClick={() => {
            if (data?.customers && data.customers.length > 0) {
              setPrintModalCustomerId(data.customers[0].id);
            }
          }}
          className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 rounded-lg border border-[#d6cec3] bg-white hover:bg-[#faf7f2] px-4 py-2 text-xs font-semibold text-[#1f2421] transition shadow-xs cursor-pointer"
        >
          <span>Print Report</span>
        </button>
      </div>

      {/* ============================================================== */}
      {/* 2. UNIFIED 4-COLUMN KPI CARD (Matches screenshot exactly)      */}
      {/* ============================================================== */}
      <div className="rounded-2xl border border-[#e5ded4] bg-[#faf7f2] p-6 grid grid-cols-2 md:grid-cols-4 divide-y md:divide-y-0 md:divide-x divide-[#e5ded4] shadow-2xs">
        {/* Col 1: Total Clients */}
        <div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-[#7a6f60]">
            TOTAL CLIENTS
          </span>
          <p className="font-serif text-3xl sm:text-4xl text-[#1f2421] font-normal mt-2">
            {totalCustomers}
          </p>
          <p className="text-xs text-[#7a6f60] font-normal mt-1">Registered accounts</p>
        </div>

        {/* Col 2: Total Invoiced */}
        <div className="md:pl-6 pt-4 md:pt-0">
          <span className="text-[10px] font-bold uppercase tracking-wider text-[#7a6f60]">
            TOTAL INVOICED
          </span>
          <p className="font-serif text-3xl sm:text-4xl text-[#1f2421] font-normal mt-2">
            PKR {totalBilledAgg.toLocaleString()}
          </p>
          <p className="text-xs text-[#7a6f60] font-normal mt-1">Active reservations</p>
        </div>

        {/* Col 3: Collected Advance */}
        <div className="md:pl-6 pt-4 md:pt-0">
          <span className="text-[10px] font-bold uppercase tracking-wider text-[#7a6f60]">
            COLLECTED ADVANCE
          </span>
          <p className="font-serif text-3xl sm:text-4xl text-[#1f2421] font-normal mt-2">
            PKR {totalPaidAgg.toLocaleString()}
          </p>
          <p className="text-xs text-[#7a6f60] font-normal mt-1">Verified receipts</p>
        </div>

        {/* Col 4: Receivable Balance */}
        <div className="md:pl-6 pt-4 md:pt-0">
          <span className="text-[10px] font-bold uppercase tracking-wider text-[#7a6f60]">
            RECEIVABLE BALANCE
          </span>
          <p className="font-serif text-3xl sm:text-4xl text-[#c28e36] font-normal mt-2">
            PKR {totalRemainingAgg.toLocaleString()}
          </p>
          <p className="text-xs text-[#7a6f60] font-normal mt-1">Pending collection</p>
        </div>
      </div>

      {/* ============================================================== */}
      {/* 3. SEARCH ROW (Directly on canvas above table)                 */}
      {/* ============================================================== */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
        <div className="relative w-full sm:w-80">
          <input
            type="text"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            placeholder="Search by customer name, phone number, or CNIC..."
            className="w-full rounded-lg border border-[#d6cec3] bg-white/70 py-2 px-3.5 text-xs text-[#1f2421] placeholder-[#7a7368] focus:border-[#1e382b] focus:outline-none transition"
          />
        </div>

        <div className="text-xs text-[#7a6f60] font-normal">
          Showing {data?.customers?.length || totalCustomers} customer records
        </div>
      </div>

      {/* ============================================================== */}
      {/* 4. CUSTOMERS TABLE CARD                                        */}
      {/* ============================================================== */}
      <div className="rounded-2xl border border-[#e5ded4] bg-[#faf7f2] overflow-hidden shadow-2xs">
        {/* Mobile View (< md) */}
        <div className="md:hidden divide-y divide-[#e5ded4]">
          {isLoading ? (
            <div className="py-12 flex justify-center">
              <div className="h-7 w-7 animate-spin rounded-full border-3 border-[#1e382b] border-t-transparent" />
            </div>
          ) : data?.customers && data.customers.length > 0 ? (
            data.customers.map((c) => {
              const billed = c.totalBookingsAmount || 0;
              const paid = c.totalAdvancePaid || 0;
              const remaining = c.totalRemaining || 0;
              const bookingsCount = c.totalBookingsCount ?? c._count?.bookings ?? 0;

              return (
                <div key={c.id} className="p-4 space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-full bg-[#ebe3d7] text-[#1f2421] font-bold text-xs flex items-center justify-center shrink-0 uppercase">
                        {c.name ? c.name.charAt(0) : "C"}
                      </div>
                      <div>
                        <h4 className="font-bold text-xs text-[#1f2421]">{c.name}</h4>
                        <p className="text-[11px] text-[#7a6f60] font-mono">{c.phone}</p>
                      </div>
                    </div>
                    <span className="text-xs text-[#1f2421]">
                      {bookingsCount} {bookingsCount === 1 ? "Event" : "Events"}
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-1.5 rounded-xl bg-white/60 p-2 text-center text-xs border border-[#e5ded4]">
                    <div>
                      <span className="text-[10px] text-[#7a6f60] font-medium">Invoiced</span>
                      <p className="font-semibold text-[#1f2421] text-xs mt-0.5">
                        PKR {billed.toLocaleString()}
                      </p>
                    </div>
                    <div>
                      <span className="text-[10px] text-[#7a6f60] font-medium">Advance</span>
                      <p className="font-semibold text-[#1f2421] text-xs mt-0.5">
                        PKR {paid.toLocaleString()}
                      </p>
                    </div>
                    <div>
                      <span className="text-[10px] text-[#7a6f60] font-medium">Balance</span>
                      <p className="font-semibold text-[#c28e36] text-xs mt-0.5">
                        PKR {remaining.toLocaleString()}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-end gap-3 pt-1">
                    <button
                      onClick={() => setSelectedCustomerId(c.id)}
                      className="rounded-md border border-[#d6cec3] bg-white hover:bg-[#ebe3d7] px-3 py-1 text-xs font-semibold text-[#1f2421] transition cursor-pointer"
                    >
                      Ledger
                    </button>
                    <button
                      onClick={() => setPrintModalCustomerId(c.id)}
                      className="text-xs text-[#1f2421] underline hover:text-[#1e382b] font-medium cursor-pointer"
                    >
                      Print
                    </button>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="py-10 text-center text-xs text-[#7a6f60] font-medium">
              No customer accounts found matching your query.
            </div>
          )}
        </div>

        {/* Desktop Table View (Hidden on mobile) */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left text-xs text-[#1f2421]">
            <thead className="bg-[#faf7f2] text-[11px] font-bold uppercase tracking-wider text-[#7a6f60] border-b border-[#e5ded4] select-none">
              <tr>
                <th className="px-5 py-3.5">Customer & Contact</th>
                <th className="px-5 py-3.5">Bookings</th>
                <th className="px-5 py-3.5 text-right">Total Invoiced</th>
                <th className="px-5 py-3.5 text-right">Advance Paid</th>
                <th className="px-5 py-3.5 text-center">Balance Due</th>
                <th className="px-5 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#e5ded4]">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="px-5 py-12 text-center text-xs text-[#7a6f60]">
                    <div className="flex justify-center">
                      <div className="h-7 w-7 animate-spin rounded-full border-3 border-[#1e382b] border-t-transparent" />
                    </div>
                  </td>
                </tr>
              ) : data?.customers && data.customers.length > 0 ? (
                data.customers.map((c) => {
                  const billed = c.totalBookingsAmount || 0;
                  const paid = c.totalAdvancePaid || 0;
                  const remaining = c.totalRemaining || 0;
                  const bookingsCount = c.totalBookingsCount ?? c._count?.bookings ?? 0;

                  return (
                    <tr key={c.id} className="hover:bg-[#ebe3d7]/20 transition">
                      {/* Customer & Contact */}
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-[#ebe3d7] text-[#1f2421] font-bold text-xs flex items-center justify-center shrink-0 uppercase">
                            {c.name ? c.name.charAt(0) : "C"}
                          </div>
                          <div>
                            <div className="font-bold text-xs text-[#1f2421] leading-tight">
                              {c.name}
                            </div>
                            <div className="text-[11px] text-[#7a6f60] font-mono mt-0.5">
                              {c.phone}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Bookings */}
                      <td className="px-5 py-4 text-xs text-[#1f2421] font-normal">
                        {bookingsCount} {bookingsCount === 1 ? "Event" : "Events"}
                      </td>

                      {/* Total Invoiced */}
                      <td className="px-5 py-4 text-right font-semibold text-[#1f2421]">
                        PKR {billed.toLocaleString()}
                      </td>

                      {/* Advance Paid */}
                      <td className="px-5 py-4 text-right font-semibold text-[#1f2421]">
                        PKR {paid.toLocaleString()}
                      </td>

                      {/* Balance Due */}
                      <td className="px-5 py-4 text-center">
                        {remaining <= 0 ? (
                          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full border border-[#d6cec3] bg-white text-xs font-semibold text-[#1f2421]">
                            ✓ Cleared
                          </span>
                        ) : (
                          <span className="text-xs font-semibold text-[#c28e36]">
                            PKR {remaining.toLocaleString()}
                          </span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="px-5 py-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-3">
                          <button
                            onClick={() => setSelectedCustomerId(c.id)}
                            className="rounded-md border border-[#d6cec3] bg-white hover:bg-[#ebe3d7] px-3 py-1 text-xs font-semibold text-[#1f2421] transition cursor-pointer"
                          >
                            Ledger
                          </button>
                          <button
                            onClick={() => setPrintModalCustomerId(c.id)}
                            className="text-xs text-[#1f2421] underline hover:text-[#1e382b] font-medium cursor-pointer"
                          >
                            Print
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={6} className="px-5 py-10 text-center text-xs text-[#7a6f60] font-medium">
                    No customer accounts found matching your query.
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
              Page {data.pagination.page} of {data.pagination.totalPages} ({data.pagination.total} total clients)
            </span>
            <div className="flex gap-2">
              <button
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(p - 1, 1))}
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
      {/* 5. INTERACTIVE CUSTOMER LEDGER MODAL                           */}
      {/* ============================================================== */}
      {selectedCustomerId && (
        <div
          className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 no-print"
          onClick={() => setSelectedCustomerId(null)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-4xl max-h-[92vh] bg-[#faf7f2] rounded-2xl border border-[#e5ded4] flex flex-col overflow-hidden animate-fadeIn shadow-xl"
          >
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-[#e5ded4] flex items-center justify-between bg-white">
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-xl bg-[#ebe3d7] text-[#1e382b] flex items-center justify-center font-bold text-sm">
                  <FileText className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="font-serif text-lg text-[#1f2421] font-normal leading-tight">
                    Customer Account Ledger
                  </h3>
                  <p className="text-xs text-[#7a6f60] font-normal">
                    Official booking statements and payment audit record
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    const id = selectedCustomerId;
                    setSelectedCustomerId(null);
                    setPrintModalCustomerId(id);
                  }}
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-[#1e382b] hover:bg-[#162a20] text-white text-xs font-semibold transition cursor-pointer shadow-xs"
                >
                  <Printer className="h-3.5 w-3.5" />
                  <span>Print Statement</span>
                </button>
                <button
                  onClick={() => setSelectedCustomerId(null)}
                  className="rounded-lg p-1.5 text-[#7a6f60] hover:text-[#1f2421] hover:bg-[#ebe3d7] transition cursor-pointer"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto space-y-6 flex-1">
              {ledgerLoading ? (
                <div className="py-20 text-center">
                  <div className="h-8 w-8 animate-spin rounded-full border-3 border-[#1e382b] border-t-transparent mx-auto" />
                  <p className="text-xs font-bold text-[#7a6f60] mt-3">Loading customer statement...</p>
                </div>
              ) : activeCustomer ? (
                <>
                  {/* Customer Info Card */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-5 rounded-xl bg-white border border-[#e5ded4]">
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-[#7a6f60]">
                        Customer Name
                      </span>
                      <h4 className="text-base font-bold text-[#1f2421] mt-0.5">
                        {activeCustomer.name}
                      </h4>
                      <div className="flex items-center gap-1.5 text-xs text-[#7a6f60] mt-1">
                        <Phone className="h-3.5 w-3.5 text-[#7a6f60]" />
                        <span className="font-mono">{activeCustomer.phone}</span>
                      </div>
                    </div>

                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-[#7a6f60]">
                        CNIC / National ID
                      </span>
                      <p className="text-sm font-mono font-semibold text-[#1f2421] mt-0.5">
                        {activeCustomer.cnic || "Not provided"}
                      </p>
                      {activeCustomer.address && (
                        <div className="flex items-start gap-1.5 text-xs text-[#7a6f60] mt-1">
                          <MapPin className="h-3.5 w-3.5 text-[#7a6f60] shrink-0 mt-0.5" />
                          <span className="truncate">{activeCustomer.address}</span>
                        </div>
                      )}
                    </div>

                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-[#7a6f60]">
                        Account Balance Status
                      </span>
                      <div className="mt-1">
                        {activeLedger.totalRemaining <= 0 ? (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border border-[#d6cec3] bg-white text-[#1f2421]">
                            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                            <span>CLEARED (0 DUE)</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-800 border border-amber-200">
                            <Clock className="h-3.5 w-3.5 text-amber-600" />
                            <span>PKR {activeLedger.totalRemaining.toLocaleString()} DUE</span>
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Financial Statement Bar */}
                  <div className="grid grid-cols-3 gap-3 p-4 rounded-xl bg-[#1e382b] text-white">
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-white/70">
                        Total Invoiced
                      </span>
                      <p className="font-serif text-xl sm:text-2xl mt-0.5">
                        PKR {activeLedger.totalBilled.toLocaleString()}
                      </p>
                    </div>
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-white/70">
                        Advance Paid
                      </span>
                      <p className="font-serif text-xl sm:text-2xl text-emerald-300 mt-0.5">
                        PKR {activeLedger.totalPaid.toLocaleString()}
                      </p>
                    </div>
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-[#c28e36]">
                        Remaining Payable
                      </span>
                      <p className="font-serif text-xl sm:text-2xl text-[#c28e36] mt-0.5">
                        PKR {activeLedger.totalRemaining.toLocaleString()}
                      </p>
                    </div>
                  </div>

                  {/* Bookings / Event Ledger List */}
                  <div>
                    <h5 className="text-xs font-bold uppercase tracking-wider text-[#7a6f60] mb-2.5">
                      Event Reservations ({ledgerData?.bookings?.length || 0})
                    </h5>

                    <div className="rounded-xl border border-[#e5ded4] bg-white overflow-hidden">
                      <table className="w-full text-left text-xs text-[#1f2421]">
                        <thead className="bg-[#faf7f2] font-bold uppercase text-[10px] text-[#7a6f60] border-b border-[#e5ded4]">
                          <tr>
                            <th className="px-4 py-3">Event Date & Session</th>
                            <th className="px-4 py-3">Hall / Event</th>
                            <th className="px-4 py-3 text-right">Total Price</th>
                            <th className="px-4 py-3 text-right">Advance Paid</th>
                            <th className="px-4 py-3 text-right">Balance Due</th>
                            <th className="px-4 py-3 text-center">Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[#e5ded4]">
                          {ledgerData?.bookings && ledgerData.bookings.length > 0 ? (
                            ledgerData.bookings.map((b: any) => (
                              <tr key={b.id} className="hover:bg-[#ebe3d7]/20">
                                <td className="px-4 py-3">
                                  <div className="font-bold text-[#1f2421]">
                                    {b.eventDate ? format(parseISO(b.eventDate), "dd MMM yyyy") : "—"}
                                  </div>
                                  <div className="flex items-center gap-1 text-[11px] font-medium text-[#7a6f60] mt-0.5">
                                    {b.sessionType === "DAY" ? (
                                      <>
                                        <Sun className="h-3 w-3 text-amber-500" />
                                        <span>Day Session</span>
                                      </>
                                    ) : (
                                      <>
                                        <Moon className="h-3 w-3 text-indigo-500" />
                                        <span>Night Session</span>
                                      </>
                                    )}
                                  </div>
                                </td>

                                <td className="px-4 py-3">
                                  <div className="font-semibold text-[#1f2421]">
                                    {b.hall?.name || brandSettings.hallName || "Main Hall"}
                                  </div>
                                  <div className="text-[11px] text-[#7a6f60]">{b.eventType || "Event"}</div>
                                </td>

                                <td className="px-4 py-3 text-right font-bold text-[#1f2421]">
                                  PKR {Number(b.totalAmount || 0).toLocaleString()}
                                </td>

                                <td className="px-4 py-3 text-right font-semibold text-[#1f2421]">
                                  PKR {Number(b.advanceAmount || 0).toLocaleString()}
                                </td>

                                <td className="px-4 py-3 text-right font-semibold text-[#c28e36]">
                                  PKR {Number(b.remainingAmount || 0).toLocaleString()}
                                </td>

                                <td className="px-4 py-3 text-center">
                                  <span
                                    className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                      b.status === "CONFIRMED"
                                        ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                                        : b.status === "HOLD"
                                        ? "bg-amber-50 text-amber-700 border border-amber-200"
                                        : b.status === "CANCELLED"
                                        ? "bg-rose-50 text-rose-700 border border-rose-200"
                                        : "bg-gray-100 text-gray-700"
                                    }`}
                                  >
                                    {b.status}
                                  </span>
                                </td>
                              </tr>
                            ))
                          ) : (
                            <tr>
                              <td colSpan={6} className="px-4 py-8 text-center text-[#7a6f60]">
                                No booking records recorded for this customer.
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </>
              ) : null}
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-3.5 border-t border-[#e5ded4] bg-white flex items-center justify-between">
              <span className="text-xs text-[#7a6f60] font-normal">
                System statement generated for {activeCustomer?.name || "Customer"}
              </span>
              <button
                onClick={() => setSelectedCustomerId(null)}
                className="px-4 py-2 rounded-lg border border-[#d6cec3] bg-white hover:bg-[#ebe3d7] text-[#1f2421] text-xs font-semibold transition cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* 6. DEDICATED PRINTABLE A4 CUSTOMER REPORT MODAL & SHEET        */}
      {/* ============================================================== */}
      {printModalCustomerId && (
        <div
          className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 no-print overflow-y-auto"
          onClick={() => setPrintModalCustomerId(null)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-4xl bg-white rounded-2xl border border-[#e5ded4] flex flex-col overflow-hidden my-auto animate-fadeIn shadow-2xl"
          >
            {/* Modal Controls Bar (Hidden during actual print) */}
            <div className="px-6 py-4 border-b border-[#e5ded4] bg-[#faf7f2] flex items-center justify-between no-print">
              <div className="flex items-center gap-2">
                <Printer className="h-4 w-4 text-[#1e382b]" />
                <span className="text-sm font-bold text-[#1f2421]">
                  Print Customer Ledger Statement
                </span>
                <span className="text-xs text-[#7a6f60]">| A4 Print Preview</span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleTriggerPrint}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#1e382b] hover:bg-[#162a20] text-white text-xs font-semibold transition cursor-pointer shadow-xs"
                >
                  <Printer className="h-4 w-4" />
                  <span>Print Document</span>
                </button>
                <button
                  onClick={() => setPrintModalCustomerId(null)}
                  className="rounded-lg p-2 text-[#7a6f60] hover:text-[#1f2421] hover:bg-[#ebe3d7] transition cursor-pointer"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            {/* Printable Document Container */}
            <div className="p-6 sm:p-10 bg-[#ebe3d7]/30 overflow-y-auto max-h-[80vh] flex justify-center">
              {ledgerLoading ? (
                <div className="py-20 text-center">
                  <div className="h-8 w-8 animate-spin rounded-full border-3 border-[#1e382b] border-t-transparent mx-auto" />
                  <p className="text-xs font-bold text-[#7a6f60] mt-3">Preparing statement...</p>
                </div>
              ) : (
                /* The exact A4 sheet rendered on paper or PDF */
                <div
                  id="printable-customer-ledger"
                  className="w-full max-w-[210mm] bg-white text-[#1f2421] p-8 sm:p-10 rounded-xl border border-[#e5ded4]"
                >
                  {/* Document Header with Official Branding */}
                  <div className="border-b-2 border-[#1e382b] pb-6 mb-6">
                    <div className="flex items-start justify-between">
                      {/* Left: Hall Logo & Info */}
                      <div className="flex items-center gap-3.5">
                        {brandSettings.logoUrl ? (
                          <img
                            src={brandSettings.logoUrl}
                            alt="Logo"
                            className="h-14 w-14 object-cover rounded-xl border border-[#e5ded4]"
                          />
                        ) : (
                          <div className="h-14 w-14 rounded-xl bg-[#1e382b] text-white flex items-center justify-center font-bold text-2xl">
                            <Building2 className="h-8 w-8" />
                          </div>
                        )}
                        <div>
                          <h2 className="text-2xl font-serif text-[#1f2421] uppercase tracking-tight font-normal">
                            {brandSettings.hallName || "CHAMKANI GATHERING HALL"}
                          </h2>
                          <p className="text-xs font-bold text-[#7a6f60] uppercase tracking-wider mt-0.5">
                            Official Banquet & Event Reservations Management
                          </p>
                          <p className="text-xs text-[#7a6f60] mt-1">
                            Contact: {user?.phone || "+92 300 0000000"} | {user?.email || "info@gatheringhall.com"}
                          </p>
                        </div>
                      </div>

                      {/* Right: Statement Metadata */}
                      <div className="text-right">
                        <span className="inline-block px-3 py-1 rounded-full bg-[#1e382b] text-white text-[10px] font-bold uppercase tracking-widest mb-1.5">
                          CLIENT LEDGER
                        </span>
                        <div className="text-xs font-bold text-[#1f2421]">
                          Ref: STMT-{activeCustomer?.id?.substring(0, 8).toUpperCase() || "0000"}
                        </div>
                        <div className="text-xs text-[#7a6f60] mt-0.5">
                          Issued: {format(new Date(), "dd MMMM yyyy, hh:mm a")}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Customer Information Box */}
                  <div className="grid grid-cols-2 gap-6 p-4 rounded-xl bg-[#faf7f2] border border-[#e5ded4] mb-6 text-xs">
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-[#7a6f60] block mb-1">
                        Client Details / Bill-To
                      </span>
                      <h3 className="text-base font-bold text-[#1f2421] leading-tight">
                        {activeCustomer?.name}
                      </h3>
                      <p className="font-mono font-bold text-[#1f2421] mt-1">
                        Phone: {activeCustomer?.phone}
                      </p>
                      {activeCustomer?.cnic && (
                        <p className="font-mono text-[#7a6f60] mt-0.5">
                          CNIC: {activeCustomer.cnic}
                        </p>
                      )}
                      {activeCustomer?.address && (
                        <p className="text-[#7a6f60] mt-0.5">
                          Address: {activeCustomer.address}
                        </p>
                      )}
                    </div>

                    <div className="text-right">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-[#7a6f60] block mb-1">
                        Ledger Status
                      </span>
                      <div className="mt-1">
                        {activeLedger.totalRemaining <= 0 ? (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                            CLEARED (0 DUE)
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-900 border border-amber-300">
                            PKR {activeLedger.totalRemaining.toLocaleString()} DUE
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-[#7a6f60] mt-2">
                        Total Recorded Bookings: <strong>{activeLedger.bookingsCount}</strong>
                      </p>
                    </div>
                  </div>

                  {/* Audit Ledger Table */}
                  <table className="w-full text-left text-xs mb-6">
                    <thead className="bg-[#faf7f2] font-bold uppercase text-[10px] text-[#7a6f60] border-b border-[#e5ded4]">
                      <tr>
                        <th className="px-3 py-2.5">Date & Session</th>
                        <th className="px-3 py-2.5">Hall Venue</th>
                        <th className="px-3 py-2.5">Event Type</th>
                        <th className="px-3 py-2.5 text-right">Agreed Rent</th>
                        <th className="px-3 py-2.5 text-right">Advance Paid</th>
                        <th className="px-3 py-2.5 text-right">Balance Due</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#e5ded4]">
                      {ledgerData?.bookings && ledgerData.bookings.length > 0 ? (
                        ledgerData.bookings.map((b: any) => (
                          <tr key={b.id}>
                            <td className="px-3 py-2.5">
                              <span className="font-bold text-[#1f2421]">
                                {b.eventDate ? format(parseISO(b.eventDate), "dd MMM yyyy") : "—"}
                              </span>
                              <span className="block text-[10px] text-[#7a6f60]">
                                {b.sessionType === "DAY" ? "Day Session" : "Night Session"}
                              </span>
                            </td>
                            <td className="px-3 py-2.5 font-semibold text-[#1f2421]">
                              {b.hall?.name || brandSettings.hallName || "Main Hall"}
                            </td>
                            <td className="px-3 py-2.5 text-[#7a6f60]">{b.eventType || "Event"}</td>
                            <td className="px-3 py-2.5 text-right font-bold text-[#1f2421]">
                              PKR {Number(b.totalAmount || 0).toLocaleString()}
                            </td>
                            <td className="px-3 py-2.5 text-right font-bold text-emerald-800">
                              PKR {Number(b.advanceAmount || 0).toLocaleString()}
                            </td>
                            <td className="px-3 py-2.5 text-right font-bold text-amber-800">
                              PKR {Number(b.remainingAmount || 0).toLocaleString()}
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={6} className="px-3 py-8 text-center text-[#7a6f60]">
                            No event bookings on record for this customer.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>

                  {/* Financial Balance Summary Footer */}
                  <div className="flex justify-end mb-8">
                    <div className="w-72 rounded-xl bg-[#faf7f2] border border-[#e5ded4] p-4 text-xs space-y-2">
                      <div className="flex justify-between">
                        <span className="text-[#7a6f60]">Gross Invoiced:</span>
                        <span className="font-bold text-[#1f2421]">
                          PKR {activeLedger.totalBilled.toLocaleString()}
                        </span>
                      </div>
                      <div className="flex justify-between text-emerald-800">
                        <span>Advance Paid:</span>
                        <span className="font-bold">
                          PKR {activeLedger.totalPaid.toLocaleString()}
                        </span>
                      </div>
                      <div className="flex justify-between text-[#c28e36] font-bold border-t border-[#e5ded4] pt-2 text-sm">
                        <span>Total Due:</span>
                        <span>PKR {activeLedger.totalRemaining.toLocaleString()}</span>
                      </div>
                    </div>
                  </div>

                  {/* Signatures & Verification */}
                  <div className="grid grid-cols-2 gap-12 pt-8 border-t border-[#e5ded4] text-xs">
                    <div className="text-center">
                      <div className="border-b border-[#d6cec3] pb-8 mb-2" />
                      <span className="font-bold text-[#1f2421] block">Customer Signature</span>
                      <span className="text-[10px] text-[#7a6f60]">Acknowledged & Verified</span>
                    </div>

                    <div className="text-center">
                      <div className="border-b border-[#d6cec3] pb-8 mb-2" />
                      <span className="font-bold text-[#1f2421] block">Authorized Hall Manager</span>
                      <span className="text-[10px] text-[#7a6f60]">Official Stamp & Signature</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
