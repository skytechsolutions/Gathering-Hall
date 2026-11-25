"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { customerApi, Customer, CustomerLedger } from "@/services/api/customer.api";
import { Modal } from "@/components/ui/modal";
import {
  Users,
  Search,
  Eye,
  CreditCard,
  FileText,
  Phone,
  Mail,
  MapPin,
  CalendarCheck2,
  X,
  Printer,
  Sparkles,
  SunMedium,
  Moon,
} from "lucide-react";

export default function OwnerCustomersPage() {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);

  // Fetch customers
  const { data, isLoading } = useQuery({
    queryKey: ["owner-customers", search, page],
    queryFn: async () => {
      const res = await customerApi.getAll({
        search: search.trim() || undefined,
        page,
        limit: 10,
      });
      return res as { customers: Customer[]; pagination: { total: number; page: number; totalPages: number } };
    },
  });

  // Fetch Customer Ledger
  const { data: ledgerData, isLoading: ledgerLoading } = useQuery({
    queryKey: ["customer-ledger", selectedCustomerId],
    queryFn: async () => {
      if (!selectedCustomerId) return null;
      const res = await customerApi.getLedger(selectedCustomerId);
      return res as CustomerLedger;
    },
    enabled: !!selectedCustomerId,
  });

  const handlePrintLedger = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between bg-white rounded-3xl p-6 border border-gray-100 shadow-[0_4px_25px_rgba(0,0,0,0.03)]">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-gray-900">
            Customer Accounts & Ledger
          </h1>
          <p className="text-xs sm:text-sm text-gray-500 font-medium mt-1">
            Customer profiles, booking history statements, and balance accounts
          </p>
        </div>
      </div>

      {/* Search Bar */}
      <div className="rounded-3xl border border-gray-100 bg-white p-4 sm:p-5 shadow-[0_4px_25px_rgba(0,0,0,0.02)]">
        <div className="relative max-w-md">
          <Search className="absolute left-3.5 top-3 h-4 w-4 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            placeholder="Search customers by name, phone, or CNIC..."
            className="w-full rounded-2xl border border-gray-200 py-2.5 pl-10 pr-4 text-sm text-gray-900 placeholder-gray-400 focus:border-blue-600 focus:ring-2 focus:ring-blue-100 focus:outline-none"
          />
        </div>
      </div>

      {/* Customers Table */}
      <div className="rounded-3xl border border-gray-100 bg-white shadow-[0_4px_25px_rgba(0,0,0,0.02)] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-gray-600">
            <thead className="bg-gray-50/70 text-xs font-bold uppercase text-gray-400 border-b border-gray-100">
              <tr>
                <th className="px-5 py-3.5">Customer Name</th>
                <th className="px-5 py-3.5">Phone Number</th>
                <th className="px-5 py-3.5">CNIC / ID</th>
                <th className="px-5 py-3.5">Address</th>
                <th className="px-5 py-3.5 text-center">Total Bookings</th>
                <th className="px-5 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100/80">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="px-5 py-12 text-center text-sm text-gray-500">
                    <div className="flex justify-center">
                      <div className="h-7 w-7 animate-spin rounded-full border-3 border-blue-600 border-t-transparent" />
                    </div>
                  </td>
                </tr>
              ) : data?.customers && data.customers.length > 0 ? (
                data.customers.map((c) => (
                  <tr key={c.id} className="hover:bg-blue-50/20 transition">
                    <td className="px-5 py-4 font-bold text-gray-900">{c.name}</td>
                    <td className="px-5 py-4 font-mono font-medium text-gray-700">{c.phone}</td>
                    <td className="px-5 py-4 font-mono text-xs text-gray-500">{c.cnic || "—"}</td>
                    <td className="px-5 py-4 text-xs text-gray-500 max-w-xs truncate">{c.address || "—"}</td>
                    <td className="px-5 py-4 text-center font-black text-gray-900">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200/50">
                        {c._count?.bookings || 0}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-right">
                      <button
                        onClick={() => setSelectedCustomerId(c.id)}
                        className="inline-flex items-center gap-1.5 rounded-2xl border border-gray-200 bg-white px-3.5 py-1.5 text-xs font-bold text-gray-700 hover:bg-gray-50 hover:border-gray-300 transition"
                      >
                        <FileText className="h-3.5 w-3.5 text-blue-600" />
                        View Ledger
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="px-5 py-10 text-center text-sm text-gray-400 font-medium">
                    No customers found matching your search.
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

      {/* Customer Ledger Drawer / Modal */}
      <Modal
        isOpen={!!selectedCustomerId}
        onClose={() => setSelectedCustomerId(null)}
        maxWidth="max-w-3xl"
      >
        <div>
          <div className="flex items-center justify-between border-b border-gray-100 pb-3 mb-4">
            <div>
              <span className="text-xs font-bold text-blue-600">Customer Statement</span>
              <h3 className="font-extrabold text-gray-900 text-lg">
                {ledgerData?.customer ? `${ledgerData.customer.name}'s Ledger` : "Loading Ledger..."}
              </h3>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handlePrintLedger}
                className="rounded-xl p-2 text-gray-500 hover:bg-gray-100 transition"
                title="Print Statement"
              >
                <Printer className="h-5 w-5" />
              </button>
              <button
                onClick={() => setSelectedCustomerId(null)}
                className="text-gray-400 hover:text-gray-600 rounded-lg p-1"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>

          {ledgerLoading ? (
            <div className="py-16 text-center">
              <div className="inline-block h-8 w-8 animate-spin rounded-full border-3 border-blue-600 border-t-transparent" />
            </div>
          ) : ledgerData ? (
            <div className="space-y-6">
              {/* Contact and Overview Info */}
              <div className="grid grid-cols-3 gap-3 rounded-2xl bg-gray-50/80 border border-gray-100 p-4 text-xs">
                <div>
                  <span className="text-gray-400 font-medium">Phone</span>
                  <p className="font-bold text-gray-900 font-mono mt-0.5">{ledgerData.customer.phone}</p>
                </div>
                <div>
                  <span className="text-gray-400 font-medium">CNIC / ID</span>
                  <p className="font-bold text-gray-900 font-mono mt-0.5">{ledgerData.customer.cnic || "Not provided"}</p>
                </div>
                <div>
                  <span className="text-gray-400 font-medium">Address</span>
                  <p className="font-semibold text-gray-800 mt-0.5">{ledgerData.customer.address || "N/A"}</p>
                </div>
              </div>

              {/* Ledger Financial Summary */}
              <div className="grid grid-cols-3 gap-3 sm:gap-4">
                <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-xs">
                  <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Total Billed</span>
                  <p className="mt-1.5 text-xl font-black text-gray-900">
                    PKR {Number(ledgerData.totalBilled).toLocaleString()}
                  </p>
                </div>

                <div className="rounded-2xl border border-emerald-100 bg-emerald-50/40 p-4 shadow-xs">
                  <span className="text-[11px] font-bold text-emerald-800 uppercase tracking-wider">Total Paid</span>
                  <p className="mt-1.5 text-xl font-black text-emerald-800">
                    PKR {Number(ledgerData.totalPaid).toLocaleString()}
                  </p>
                </div>

                <div className="rounded-2xl border border-amber-100 bg-amber-50/40 p-4 shadow-xs">
                  <span className="text-[11px] font-bold text-amber-800 uppercase tracking-wider">Balance Due</span>
                  <p className="mt-1.5 text-xl font-black text-amber-800">
                    PKR {Number(ledgerData.remainingBalance).toLocaleString()}
                  </p>
                </div>
              </div>

              {/* Booking History Table */}
              <div>
                <h4 className="font-extrabold text-sm text-gray-900 mb-3">Booking History & Invoices</h4>
                <div className="rounded-2xl border border-gray-100 overflow-hidden shadow-xs">
                  <table className="w-full text-left text-xs text-gray-600">
                    <thead className="bg-gray-50/70 font-bold uppercase text-gray-400 border-b border-gray-100">
                      <tr>
                        <th className="px-3.5 py-3">Booking #</th>
                        <th className="px-3.5 py-3">Hall</th>
                        <th className="px-3.5 py-3">Date</th>
                        <th className="px-3.5 py-3">Status</th>
                        <th className="px-3.5 py-3 text-right">Total</th>
                        <th className="px-3.5 py-3 text-right">Paid</th>
                        <th className="px-3.5 py-3 text-right">Balance</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100/80">
                      {ledgerData.bookings && ledgerData.bookings.length > 0 ? (
                        ledgerData.bookings.map((b) => (
                          <tr key={b.id} className="hover:bg-gray-50/50">
                            <td className="px-3.5 py-3 font-mono font-bold text-blue-600">{b.bookingNumber}</td>
                            <td className="px-3.5 py-3 font-semibold text-gray-900">{b.hall?.name || "—"}</td>
                            <td className="px-3.5 py-3 font-medium text-gray-700">{b.eventDate}</td>
                            <td className="px-3.5 py-3">
                              <span
                                className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-bold ${
                                  b.status === "CONFIRMED"
                                    ? "bg-emerald-50 text-emerald-700 border border-emerald-200/60"
                                    : b.status === "HOLD"
                                    ? "bg-amber-50 text-amber-700 border border-amber-200/60"
                                    : "bg-rose-50 text-rose-700 border border-rose-200/60"
                                }`}
                              >
                                {b.status}
                              </span>
                            </td>
                            <td className="px-3.5 py-3 text-right font-black text-gray-900">
                              PKR {Number(b.totalAmount).toLocaleString()}
                            </td>
                            <td className="px-3.5 py-3 text-right text-emerald-700 font-bold">
                              PKR {Number(b.advanceAmount).toLocaleString()}
                            </td>
                            <td className="px-3.5 py-3 text-right text-amber-700 font-bold">
                              PKR {Number(b.remainingAmount).toLocaleString()}
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={7} className="px-3 py-6 text-center text-gray-400 font-medium">
                            No bookings found for this customer.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          ) : null}

          <div className="mt-6 flex justify-end border-t border-gray-100 pt-3">
            <button
              onClick={() => setSelectedCustomerId(null)}
              className="rounded-2xl bg-gray-100 px-4 py-2 text-xs font-bold text-gray-700 hover:bg-gray-200 transition"
            >
              Close
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
