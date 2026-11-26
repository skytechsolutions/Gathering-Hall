"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { customerApi, Customer, CustomerLedger } from "@/services/api/customer.api";
import { useAuth } from "@/context/auth-context";
import { format, parseISO } from "date-fns";
import {
  Users,
  Search,
  FileText,
  Phone,
  Mail,
  MapPin,
  CalendarCheck2,
  X,
  Printer,
  Sparkles,
  Sun,
  Moon,
  CreditCard,
  Building2,
  ArrowRight,
  Receipt,
  CheckCircle2,
  Clock,
  AlertCircle,
  ShieldCheck,
  DollarSign,
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
    <div className="space-y-5 lg:space-y-6 pb-12">
      {/* ============================================================== */}
      {/* 1. TOP HEADER & TITLE (Matches Dashboard Style)               */}
      {/* ============================================================== */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between bg-white rounded-2xl p-5 sm:p-6 border border-slate-200/80">
        <div>
          <div className="flex items-center gap-2">
            <div className="h-9 w-9 rounded-xl bg-slate-100 border border-slate-200/60 flex items-center justify-center text-[#3b3c44]">
              <Users className="h-5 w-5" />
            </div>
            <h1 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900">
              Customers & Ledger Statements
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 font-medium mt-1">
            Complete customer client directory, live account balances, booking history, and printable audit statements
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              if (data?.customers && data.customers.length > 0) {
                setPrintModalCustomerId(data.customers[0].id);
              }
            }}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold transition cursor-pointer"
          >
            <Printer className="h-4 w-4 text-slate-600" />
            <span>Print Report</span>
          </button>
        </div>
      </div>

      {/* ============================================================== */}
      {/* 2. FINANCIAL KPI CARDS (Live Aggregate Metrics)                */}
      {/* ============================================================== */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Card 1: Total Customers */}
        <div className="rounded-2xl border border-slate-200/80 bg-white p-4 sm:p-5 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500">Total Clients</span>
            <div className="h-8 w-8 rounded-xl bg-slate-100 text-[#3b3c44] flex items-center justify-center">
              <Users className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl sm:text-3xl font-black text-slate-900">{totalCustomers}</div>
            <p className="text-[11px] font-semibold text-slate-400 mt-0.5">Registered accounts</p>
          </div>
        </div>

        {/* Card 2: Total Billed */}
        <div className="rounded-2xl border border-slate-200/80 bg-white p-4 sm:p-5 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500">Total Invoiced</span>
            <div className="h-8 w-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <FileText className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-xl sm:text-2xl font-black text-slate-900 truncate">
              PKR {totalBilledAgg.toLocaleString()}
            </div>
            <p className="text-[11px] font-semibold text-indigo-600 mt-0.5">Active reservations</p>
          </div>
        </div>

        {/* Card 3: Total Paid / Advance */}
        <div className="rounded-2xl border border-slate-200/80 bg-white p-4 sm:p-5 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500">Collected Advance</span>
            <div className="h-8 w-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <CheckCircle2 className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-xl sm:text-2xl font-black text-emerald-600 truncate">
              PKR {totalPaidAgg.toLocaleString()}
            </div>
            <p className="text-[11px] font-semibold text-emerald-700 mt-0.5">Verified receipts</p>
          </div>
        </div>

        {/* Card 4: Remaining Receivable */}
        <div className="rounded-2xl border border-slate-200/80 bg-white p-4 sm:p-5 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500">Receivable Balance</span>
            <div className="h-8 w-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <Clock className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-xl sm:text-2xl font-black text-amber-600 truncate">
              PKR {totalRemainingAgg.toLocaleString()}
            </div>
            <p className="text-[11px] font-semibold text-amber-700 mt-0.5">Pending collection</p>
          </div>
        </div>
      </div>

      {/* ============================================================== */}
      {/* 3. SEARCH BAR & CLIENT DIRECTORY TABLE                         */}
      {/* ============================================================== */}
      <div className="rounded-2xl border border-slate-200/80 bg-white overflow-hidden">
        {/* Search Input Filter */}
        <div className="p-4 sm:p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              placeholder="Search by customer name, phone number, or CNIC..."
              className="w-full rounded-xl border border-slate-200 py-2.5 pl-10 pr-4 text-xs sm:text-sm text-slate-900 placeholder-slate-400 focus:border-[#3b3c44] focus:ring-2 focus:ring-slate-300 focus:outline-none transition"
            />
          </div>

          <div className="text-xs font-bold text-slate-500">
            Showing {data?.customers?.length || 0} customer records
          </div>
        </div>

        {/* Table of Customers */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm text-slate-600">
            <thead className="bg-slate-50/80 text-[11px] font-bold uppercase tracking-wider text-slate-400 border-b border-slate-100 select-none">
              <tr>
                <th className="px-5 py-3.5">Customer & Contact</th>
                <th className="px-5 py-3.5 text-center">Bookings</th>
                <th className="px-5 py-3.5 text-right">Total Invoiced</th>
                <th className="px-5 py-3.5 text-right">Advance Paid</th>
                <th className="px-5 py-3.5 text-right">Balance Due</th>
                <th className="px-5 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="px-5 py-14 text-center text-sm text-slate-500">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <div className="h-8 w-8 animate-spin rounded-full border-3 border-[#3b3c44] border-t-transparent" />
                      <span className="text-xs font-semibold text-slate-400">Loading ledger data...</span>
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
                    <tr key={c.id} className="hover:bg-slate-100/50 transition-colors">
                      {/* Name & Phone */}
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 shrink-0 rounded-xl bg-gradient-to-tr from-[#3b3c44] to-[#25262c] text-white font-black text-sm flex items-center justify-center">
                            {c.name ? c.name.charAt(0).toUpperCase() : "C"}
                          </div>
                          <div>
                            <div className="font-extrabold text-slate-900 text-sm leading-tight">
                              {c.name}
                            </div>
                            <div className="flex items-center gap-2 text-xs text-slate-500 mt-0.5">
                              <span className="font-mono font-medium">{c.phone}</span>
                              {c.cnic && (
                                <>
                                  <span className="text-slate-300">•</span>
                                  <span className="font-mono text-[11px] text-slate-400">{c.cnic}</span>
                                </>
                              )}
                            </div>
                            {c.address && (
                              <p className="text-[11px] text-slate-400 truncate max-w-xs mt-0.5">
                                {c.address}
                              </p>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Bookings Count */}
                      <td className="px-5 py-4 text-center">
                        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-black bg-slate-100 text-[#3b3c44] border border-slate-200/60">
                          {bookingsCount} {bookingsCount === 1 ? "Event" : "Events"}
                        </span>
                      </td>

                      {/* Total Invoiced */}
                      <td className="px-5 py-4 text-right font-black text-slate-900">
                        PKR {billed.toLocaleString()}
                      </td>

                      {/* Advance Paid */}
                      <td className="px-5 py-4 text-right font-extrabold text-emerald-600">
                        PKR {paid.toLocaleString()}
                      </td>

                      {/* Balance Due Badge */}
                      <td className="px-5 py-4 text-right">
                        {remaining <= 0 ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200/60">
                            <CheckCircle2 className="h-3 w-3" />
                            <span>Cleared</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200/70">
                            <span>PKR {remaining.toLocaleString()} Due</span>
                          </span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="px-5 py-4 text-right">
                        <div className="inline-flex items-center gap-1.5">
                          <button
                            onClick={() => setSelectedCustomerId(c.id)}
                            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 px-3 py-1.5 text-xs font-bold text-slate-700 transition cursor-pointer"
                            title="View Customer Ledger Account"
                          >
                            <FileText className="h-3.5 w-3.5 text-[#3b3c44]" />
                            <span>Ledger</span>
                          </button>
                          <button
                            onClick={() => setPrintModalCustomerId(c.id)}
                            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-100/70 hover:bg-slate-200/70 px-3 py-1.5 text-xs font-bold text-[#3b3c44] transition cursor-pointer"
                            title="Print Customer Statement Report"
                          >
                            <Printer className="h-3.5 w-3.5 text-[#3b3c44]" />
                            <span>Print</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={6} className="px-5 py-12 text-center text-sm text-slate-400 font-medium">
                    No customer accounts found matching your query.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {data?.pagination && data.pagination.totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-slate-100 px-5 py-3.5 bg-slate-50/40">
            <span className="text-xs text-slate-500 font-medium">
              Page {data.pagination.page} of {data.pagination.totalPages} ({data.pagination.total} total clients)
            </span>
            <div className="flex gap-1.5">
              <button
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(p - 1, 1))}
                className="px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-white disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
              >
                Previous
              </button>
              <button
                disabled={page >= data.pagination.totalPages}
                onClick={() => setPage((p) => p + 1)}
                className="px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-white disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ============================================================== */}
      {/* 4. ON-SCREEN INTERACTIVE CUSTOMER LEDGER MODAL                 */}
      {/* ============================================================== */}
      {selectedCustomerId && (
        <div
          className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 no-print"
          onClick={() => setSelectedCustomerId(null)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-4xl max-h-[92vh] bg-white rounded-xl border border-slate-100 flex flex-col overflow-hidden animate-fadeIn"
          >
            {/* Modal Header */}
            <div className="px-6 py-4.5 border-b border-slate-100 flex items-center justify-between bg-slate-50/80">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-[#3b3c44] text-white flex items-center justify-center font-black text-sm">
                  <FileText className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-slate-900 leading-tight">
                    Customer Account Ledger
                  </h3>
                  <p className="text-xs text-slate-500 font-medium">
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
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-[#3b3c44] hover:bg-[#2b2c33] text-white text-xs font-bold transition cursor-pointer"
                >
                  <Printer className="h-3.5 w-3.5" />
                  <span>Print Statement</span>
                </button>
                <button
                  onClick={() => setSelectedCustomerId(null)}
                  className="rounded-lg p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition cursor-pointer"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto space-y-6 flex-1">
              {ledgerLoading ? (
                <div className="py-20 text-center">
                  <div className="h-8 w-8 animate-spin rounded-full border-3 border-[#3b3c44] border-t-transparent mx-auto" />
                  <p className="text-xs font-bold text-slate-400 mt-3">Loading customer statement...</p>
                </div>
              ) : activeCustomer ? (
                <>
                  {/* Customer Info Card */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-5 rounded-xl bg-slate-50 border border-slate-200/80">
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                        Customer Name
                      </span>
                      <h4 className="text-base font-black text-slate-900 mt-0.5">
                        {activeCustomer.name}
                      </h4>
                      <div className="flex items-center gap-1.5 text-xs text-slate-600 mt-1">
                        <Phone className="h-3.5 w-3.5 text-slate-400" />
                        <span className="font-mono font-medium">{activeCustomer.phone}</span>
                      </div>
                    </div>

                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                        CNIC / National ID
                      </span>
                      <p className="text-sm font-mono font-bold text-slate-800 mt-0.5">
                        {activeCustomer.cnic || "Not provided"}
                      </p>
                      {activeCustomer.address && (
                        <div className="flex items-start gap-1.5 text-xs text-slate-500 mt-1">
                          <MapPin className="h-3.5 w-3.5 text-slate-400 shrink-0 mt-0.5" />
                          <span className="truncate">{activeCustomer.address}</span>
                        </div>
                      )}
                    </div>

                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                        Account Balance Status
                      </span>
                      <div className="mt-1">
                        {activeLedger.totalRemaining <= 0 ? (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-emerald-100 text-emerald-800 border border-emerald-300">
                            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                            <span>CLEARED (0 DUE)</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-amber-100 text-amber-900 border border-amber-300">
                            <Clock className="h-3.5 w-3.5 text-amber-600" />
                            <span>PKR {activeLedger.totalRemaining.toLocaleString()} DUE</span>
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Financial Statement Bar */}
                  <div className="grid grid-cols-3 gap-3 p-4 rounded-xl bg-gradient-to-r from-[#3b3c44] via-[#2f3037] to-[#1e1f24] text-white">
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-300">
                        Total Invoiced
                      </span>
                      <p className="text-xl font-black mt-0.5">
                        PKR {activeLedger.totalBilled.toLocaleString()}
                      </p>
                    </div>
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-300">
                        Advance Paid
                      </span>
                      <p className="text-xl font-black text-emerald-300 mt-0.5">
                        PKR {activeLedger.totalPaid.toLocaleString()}
                      </p>
                    </div>
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-amber-300">
                        Remaining Payable
                      </span>
                      <p className="text-xl font-black text-amber-300 mt-0.5">
                        PKR {activeLedger.totalRemaining.toLocaleString()}
                      </p>
                    </div>
                  </div>

                  {/* Bookings / Event Ledger List */}
                  <div>
                    <h5 className="text-xs font-black uppercase tracking-wider text-slate-500 mb-2.5">
                      Event Reservations ({ledgerData?.bookings?.length || 0})
                    </h5>

                    <div className="rounded-xl border border-slate-200 overflow-hidden">
                      <table className="w-full text-left text-xs text-slate-600">
                        <thead className="bg-slate-50 font-bold uppercase text-[10px] text-slate-400 border-b border-slate-200">
                          <tr>
                            <th className="px-4 py-3">Event Date & Session</th>
                            <th className="px-4 py-3">Hall / Event</th>
                            <th className="px-4 py-3 text-right">Total Price</th>
                            <th className="px-4 py-3 text-right">Advance Paid</th>
                            <th className="px-4 py-3 text-right">Balance Due</th>
                            <th className="px-4 py-3 text-center">Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {ledgerData?.bookings && ledgerData.bookings.length > 0 ? (
                            ledgerData.bookings.map((b: any) => (
                              <tr key={b.id} className="hover:bg-slate-50/60">
                                <td className="px-4 py-3">
                                  <div className="font-extrabold text-slate-900">
                                    {b.eventDate ? format(parseISO(b.eventDate), "dd MMM yyyy") : "—"}
                                  </div>
                                  <div className="flex items-center gap-1 text-[11px] font-semibold text-slate-500 mt-0.5">
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
                                  <div className="font-bold text-slate-800">
                                    {b.hall?.name || brandSettings.hallName || "Main Hall"}
                                  </div>
                                  <div className="text-[11px] text-slate-400">{b.eventType || "Event"}</div>
                                </td>

                                <td className="px-4 py-3 text-right font-black text-slate-900">
                                  PKR {Number(b.totalAmount || 0).toLocaleString()}
                                </td>

                                <td className="px-4 py-3 text-right font-extrabold text-emerald-600">
                                  PKR {Number(b.advanceAmount || 0).toLocaleString()}
                                </td>

                                <td className="px-4 py-3 text-right font-extrabold text-amber-600">
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
                                        ? "bg-red-50 text-red-700 border border-red-200"
                                        : "bg-slate-100 text-slate-700"
                                    }`}
                                  >
                                    {b.status}
                                  </span>
                                </td>
                              </tr>
                            ))
                          ) : (
                            <tr>
                              <td colSpan={6} className="px-4 py-8 text-center text-slate-400">
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
            <div className="px-6 py-3.5 border-t border-slate-100 bg-slate-50 flex items-center justify-between">
              <span className="text-xs text-slate-400 font-medium">
                System statement generated for {activeCustomer?.name || "Customer"}
              </span>
              <button
                onClick={() => setSelectedCustomerId(null)}
                className="px-4 py-2 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-800 text-xs font-bold transition cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* 5. DEDICATED PRINTABLE A4 CUSTOMER REPORT MODAL & SHEET        */}
      {/* ============================================================== */}
      {printModalCustomerId && (
        <div
          className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 no-print overflow-y-auto"
          onClick={() => setPrintModalCustomerId(null)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-4xl bg-white rounded-xl border border-slate-200 flex flex-col overflow-hidden my-auto animate-fadeIn"
          >
            {/* Modal Controls Bar (Hidden during actual print) */}
            <div className="px-6 py-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between no-print">
              <div className="flex items-center gap-2">
                <Printer className="h-5 w-5 text-[#3b3c44]" />
                <span className="text-sm font-black text-slate-900">
                  Print Customer Ledger Statement
                </span>
                <span className="text-xs text-slate-400">| A4 Print Preview</span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleTriggerPrint}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#3b3c44] hover:bg-[#2b2c33] text-white text-xs font-bold transition cursor-pointer"
                >
                  <Printer className="h-4 w-4" />
                  <span>Print Document</span>
                </button>
                <button
                  onClick={() => setPrintModalCustomerId(null)}
                  className="rounded-lg p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-200 transition cursor-pointer"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            {/* Printable Document Container */}
            <div className="p-6 sm:p-10 bg-slate-100 overflow-y-auto max-h-[80vh] flex justify-center">
              {ledgerLoading ? (
                <div className="py-20 text-center">
                  <div className="h-8 w-8 animate-spin rounded-full border-3 border-[#3b3c44] border-t-transparent mx-auto" />
                  <p className="text-xs font-bold text-slate-400 mt-3">Preparing statement...</p>
                </div>
              ) : (
                /* The exact A4 sheet rendered on paper or PDF */
                <div
                  id="printable-customer-ledger"
                  className="w-full max-w-[210mm] bg-white text-slate-900 p-8 sm:p-10 rounded-xl border border-slate-200"
                >
                  {/* Document Header with Official Branding */}
                  <div className="border-b-2 border-slate-900 pb-6 mb-6">
                    <div className="flex items-start justify-between">
                      {/* Left: Hall Logo & Info */}
                      <div className="flex items-center gap-3.5">
                        {brandSettings.logoUrl ? (
                          <img
                            src={brandSettings.logoUrl}
                            alt="Logo"
                            className="h-14 w-14 object-cover rounded-xl border border-slate-200"
                          />
                        ) : (
                          <div className="h-14 w-14 rounded-xl bg-slate-900 text-white flex items-center justify-center font-black text-2xl">
                            <Building2 className="h-8 w-8" />
                          </div>
                        )}
                        <div>
                          <h2 className="text-2xl font-black text-slate-950 uppercase tracking-tight">
                            {brandSettings.hallName || "CHAMKANI GATHERING HALL"}
                          </h2>
                          <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mt-0.5">
                            Official Banquet & Event Reservations Management
                          </p>
                          <p className="text-xs text-slate-600 mt-1">
                            Contact: {user?.phone || "+92 300 0000000"} | {user?.email || "info@gatheringhall.com"}
                          </p>
                        </div>
                      </div>

                      {/* Right: Statement Metadata */}
                      <div className="text-right">
                        <span className="inline-block px-3 py-1 rounded-full bg-slate-900 text-white text-[10px] font-black uppercase tracking-widest mb-1.5">
                          CLIENT LEDGER
                        </span>
                        <div className="text-xs font-bold text-slate-700">
                          Ref: STMT-{activeCustomer?.id?.substring(0, 8).toUpperCase() || "0000"}
                        </div>
                        <div className="text-xs text-slate-500 mt-0.5">
                          Issued: {format(new Date(), "dd MMMM yyyy, hh:mm a")}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Customer Information Box */}
                  <div className="grid grid-cols-2 gap-6 p-4 rounded-xl bg-slate-50 border border-slate-200 mb-6 text-xs">
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                        Client Details / Bill-To
                      </span>
                      <h3 className="text-base font-black text-slate-900 leading-tight">
                        {activeCustomer?.name}
                      </h3>
                      <p className="font-mono font-bold text-slate-700 mt-1">
                        Phone: {activeCustomer?.phone}
                      </p>
                      {activeCustomer?.cnic && (
                        <p className="font-mono text-slate-600 mt-0.5">
                          CNIC: {activeCustomer.cnic}
                        </p>
                      )}
                      {activeCustomer?.address && (
                        <p className="text-slate-600 mt-0.5">Address: {activeCustomer.address}</p>
                      )}
                    </div>

                    <div className="text-right flex flex-col justify-between">
                      <div>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                          Account Status
                        </span>
                        {activeLedger.totalRemaining <= 0 ? (
                          <span className="inline-block px-3 py-1 rounded-md bg-emerald-600 text-white font-black text-xs">
                            ACCOUNT CLEARED
                          </span>
                        ) : (
                          <span className="inline-block px-3 py-1 rounded-md bg-amber-600 text-white font-black text-xs">
                            BALANCE PAYABLE: PKR {activeLedger.totalRemaining.toLocaleString()}
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-slate-500 font-medium">
                        Total Event Bookings:{" "}
                        <strong className="text-slate-900">
                          {ledgerData?.bookings?.length || 0}
                        </strong>
                      </div>
                    </div>
                  </div>

                  {/* Financial Balance Overview Cards */}
                  <div className="grid grid-cols-3 gap-3 mb-6 text-center">
                    <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                        Total Invoiced
                      </span>
                      <div className="text-lg font-black text-slate-900 mt-1">
                        PKR {activeLedger.totalBilled.toLocaleString()}
                      </div>
                    </div>
                    <div className="p-3.5 rounded-xl border border-emerald-200 bg-emerald-50/50">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800">
                        Advance Received
                      </span>
                      <div className="text-lg font-black text-emerald-700 mt-1">
                        PKR {activeLedger.totalPaid.toLocaleString()}
                      </div>
                    </div>
                    <div className="p-3.5 rounded-xl border border-amber-200 bg-amber-50/50">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-amber-800">
                        Net Outstanding
                      </span>
                      <div className="text-lg font-black text-amber-700 mt-1">
                        PKR {activeLedger.totalRemaining.toLocaleString()}
                      </div>
                    </div>
                  </div>

                  {/* Itemized Bookings Statement Table */}
                  <div className="mb-6">
                    <h4 className="text-xs font-black uppercase tracking-wider text-slate-700 mb-2">
                      Itemized Event Reservations
                    </h4>
                    <table className="w-full text-left text-xs border border-slate-300">
                      <thead className="bg-slate-100 text-[10px] font-bold uppercase text-slate-700 border-b border-slate-300">
                        <tr>
                          <th className="p-2.5 border-r border-slate-300">Date & Session</th>
                          <th className="p-2.5 border-r border-slate-300">Hall & Event</th>
                          <th className="p-2.5 border-r border-slate-300 text-right">Total Price</th>
                          <th className="p-2.5 border-r border-slate-300 text-right">Advance Paid</th>
                          <th className="p-2.5 border-r border-slate-300 text-right">Remaining Due</th>
                          <th className="p-2.5 text-center">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200">
                        {ledgerData?.bookings && ledgerData.bookings.length > 0 ? (
                          ledgerData.bookings.map((b: any, i: number) => (
                            <tr key={b.id || i} className={i % 2 === 0 ? "bg-white" : "bg-slate-50/50"}>
                              <td className="p-2.5 border-r border-slate-200 font-bold">
                                {b.eventDate ? format(parseISO(b.eventDate), "dd MMM yyyy") : "—"}
                                <span className="block text-[10px] text-slate-500 font-normal">
                                  {b.sessionType === "DAY" ? "☀️ Day Session" : "🌙 Night Session"}
                                </span>
                              </td>
                              <td className="p-2.5 border-r border-slate-200">
                                <span className="font-bold text-slate-800">
                                  {b.hall?.name || brandSettings.hallName || "Main Hall"}
                                </span>
                                <span className="block text-[10px] text-slate-500">{b.eventType || "Event"}</span>
                              </td>
                              <td className="p-2.5 border-r border-slate-200 text-right font-black">
                                PKR {Number(b.totalAmount || 0).toLocaleString()}
                              </td>
                              <td className="p-2.5 border-r border-slate-200 text-right font-bold text-emerald-700">
                                PKR {Number(b.advanceAmount || 0).toLocaleString()}
                              </td>
                              <td className="p-2.5 border-r border-slate-200 text-right font-bold text-amber-700">
                                PKR {Number(b.remainingAmount || 0).toLocaleString()}
                              </td>
                              <td className="p-2.5 text-center font-bold text-[10px]">
                                {b.status}
                              </td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan={6} className="p-4 text-center text-slate-400">
                              No recorded reservations.
                            </td>
                          </tr>
                        )}
                      </tbody>
                      <tfoot className="bg-slate-100 font-black border-t-2 border-slate-300 text-xs">
                        <tr>
                          <td colSpan={2} className="p-2.5 text-right uppercase">
                            Grand Totals:
                          </td>
                          <td className="p-2.5 text-right">
                            PKR {activeLedger.totalBilled.toLocaleString()}
                          </td>
                          <td className="p-2.5 text-right text-emerald-700">
                            PKR {activeLedger.totalPaid.toLocaleString()}
                          </td>
                          <td className="p-2.5 text-right text-amber-700">
                            PKR {activeLedger.totalRemaining.toLocaleString()}
                          </td>
                          <td className="p-2.5 text-center">
                            {activeLedger.totalRemaining <= 0 ? "PAID" : "DUE"}
                          </td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>

                  {/* Terms & Legal Notice */}
                  <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50 text-[10px] text-slate-500 leading-relaxed mb-10">
                    <strong>Notice & Verification:</strong> This document serves as the formal customer account ledger generated by {brandSettings.hallName || "Chamkani Gathering Hall"}. Remaining balances are payable as per hall policy prior to the event date. In case of any dispute or query, please present this original slip with booking receipts.
                  </div>

                  {/* Stamp & Signatures */}
                  <div className="grid grid-cols-3 gap-6 pt-6 border-t border-slate-300 text-center text-xs">
                    <div>
                      <div className="h-14 border-b border-dashed border-slate-400" />
                      <span className="font-bold text-slate-700 mt-2 block">Customer Signature</span>
                    </div>
                    <div>
                      <div className="h-14 border-b border-dashed border-slate-400" />
                      <span className="font-bold text-slate-700 mt-2 block">Authorized Manager</span>
                    </div>
                    <div>
                      <div className="h-14 border-b border-dashed border-slate-400" />
                      <span className="font-bold text-slate-700 mt-2 block">Official Hall Stamp</span>
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
