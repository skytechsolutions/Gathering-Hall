"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { customerApi, Customer, CustomerLedger } from "@/services/api/customer.api";
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
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">Customer Accounts & Ledger</h1>
          <p className="text-sm text-gray-500">Internal customer profiles, booking history, and balance statements</p>
        </div>
      </div>

      {/* Search Bar */}
      <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
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
            className="w-full rounded-xl border border-gray-300 py-2 pl-10 pr-4 text-sm text-gray-900 placeholder-gray-400 focus:border-red-600 focus:outline-none"
          />
        </div>
      </div>

      {/* Customers Table */}
      <div className="rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-gray-600">
            <thead className="bg-gray-50 text-xs font-semibold uppercase text-gray-500">
              <tr>
                <th className="px-5 py-3.5">Customer Name</th>
                <th className="px-5 py-3.5">Phone Number</th>
                <th className="px-5 py-3.5">CNIC / ID</th>
                <th className="px-5 py-3.5">Address</th>
                <th className="px-5 py-3.5 text-center">Total Bookings</th>
                <th className="px-5 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="px-5 py-8 text-center text-sm text-gray-500">
                    <div className="flex justify-center">
                      <div className="h-6 w-6 animate-spin rounded-full border-2 border-red-600 border-t-transparent" />
                    </div>
                  </td>
                </tr>
              ) : data?.customers && data.customers.length > 0 ? (
                data.customers.map((c) => (
                  <tr key={c.id} className="hover:bg-gray-50/50">
                    <td className="px-5 py-4 font-bold text-gray-900">{c.name}</td>
                    <td className="px-5 py-4 font-mono text-gray-700">{c.phone}</td>
                    <td className="px-5 py-4 font-mono text-xs text-gray-500">{c.cnic || "—"}</td>
                    <td className="px-5 py-4 text-xs text-gray-500 max-w-xs truncate">{c.address || "—"}</td>
                    <td className="px-5 py-4 text-center font-bold text-gray-900">
                      {c._count?.bookings || 0}
                    </td>
                    <td className="px-5 py-4 text-right">
                      <button
                        onClick={() => setSelectedCustomerId(c.id)}
                        className="inline-flex items-center gap-1.5 rounded-xl border border-gray-200 px-3 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-50 transition"
                      >
                        <FileText className="h-3.5 w-3.5 text-red-600" />
                        View Ledger
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="px-5 py-8 text-center text-sm text-gray-500">
                    No customers found matching your search.
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

      {/* Customer Ledger Drawer / Modal */}
      {selectedCustomerId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-3xl rounded-2xl bg-white p-6 shadow-xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b pb-3 mb-4">
              <div>
                <span className="text-xs font-semibold text-red-600">Customer Statement</span>
                <h3 className="font-bold text-gray-900 text-lg">
                  {ledgerData?.customer ? `${ledgerData.customer.name}'s Ledger` : "Loading Ledger..."}
                </h3>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={handlePrintLedger} className="rounded-lg p-1.5 text-gray-500 hover:bg-gray-100">
                  <Printer className="h-5 w-5" />
                </button>
                <button onClick={() => setSelectedCustomerId(null)} className="text-gray-400 hover:text-gray-600">
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            {ledgerLoading ? (
              <div className="py-12 text-center">
                <div className="inline-block h-6 w-6 animate-spin rounded-full border-2 border-red-600 border-t-transparent" />
              </div>
            ) : ledgerData ? (
              <div className="space-y-6">
                {/* Contact and Overview Info */}
                <div className="grid grid-cols-3 gap-3 rounded-xl bg-gray-50 p-4 text-xs">
                  <div>
                    <span className="text-gray-400">Phone</span>
                    <p className="font-bold text-gray-900 mt-0.5">{ledgerData.customer.phone}</p>
                  </div>
                  <div>
                    <span className="text-gray-400">CNIC / ID</span>
                    <p className="font-bold text-gray-900 mt-0.5">{ledgerData.customer.cnic || "Not provided"}</p>
                  </div>
                  <div>
                    <span className="text-gray-400">Address</span>
                    <p className="font-medium text-gray-800 mt-0.5">{ledgerData.customer.address || "N/A"}</p>
                  </div>
                </div>

                {/* Ledger Financial Summary */}
                <div className="grid grid-cols-3 gap-4">
                  <div className="rounded-xl border border-gray-200 p-4">
                    <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Total Billed</span>
                    <p className="mt-1 text-xl font-bold text-gray-900">
                      PKR {Number(ledgerData.totalBilled).toLocaleString()}
                    </p>
                  </div>

                  <div className="rounded-xl border border-green-200 bg-green-50/40 p-4">
                    <span className="text-xs font-semibold text-green-700 uppercase tracking-wider">Total Paid</span>
                    <p className="mt-1 text-xl font-bold text-green-800">
                      PKR {Number(ledgerData.totalPaid).toLocaleString()}
                    </p>
                  </div>

                  <div className="rounded-xl border border-amber-200 bg-amber-50/40 p-4">
                    <span className="text-xs font-semibold text-amber-700 uppercase tracking-wider">Balance Due</span>
                    <p className="mt-1 text-xl font-bold text-amber-800">
                      PKR {Number(ledgerData.remainingBalance).toLocaleString()}
                    </p>
                  </div>
                </div>

                {/* Booking History Table */}
                <div>
                  <h4 className="font-bold text-sm text-gray-900 mb-3">Booking History & Invoices</h4>
                  <div className="rounded-xl border border-gray-200 overflow-hidden">
                    <table className="w-full text-left text-xs text-gray-600">
                      <thead className="bg-gray-50 font-semibold uppercase text-gray-500">
                        <tr>
                          <th className="px-3 py-2.5">Booking #</th>
                          <th className="px-3 py-2.5">Hall</th>
                          <th className="px-3 py-2.5">Date</th>
                          <th className="px-3 py-2.5">Status</th>
                          <th className="px-3 py-2.5 text-right">Total (PKR)</th>
                          <th className="px-3 py-2.5 text-right">Paid (PKR)</th>
                          <th className="px-3 py-2.5 text-right">Balance (PKR)</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {ledgerData.bookings && ledgerData.bookings.length > 0 ? (
                          ledgerData.bookings.map((b) => (
                            <tr key={b.id}>
                              <td className="px-3 py-2.5 font-mono font-medium text-gray-900">{b.bookingNumber}</td>
                              <td className="px-3 py-2.5 font-medium text-gray-900">{b.hall?.name || "—"}</td>
                              <td className="px-3 py-2.5">{b.eventDate}</td>
                              <td className="px-3 py-2.5">
                                <span
                                  className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                                    b.status === "CONFIRMED"
                                      ? "bg-green-100 text-green-800"
                                      : b.status === "HOLD"
                                      ? "bg-yellow-100 text-yellow-800"
                                      : "bg-red-100 text-red-800"
                                  }`}
                                >
                                  {b.status}
                                </span>
                              </td>
                              <td className="px-3 py-2.5 text-right font-medium">
                                PKR {Number(b.totalAmount).toLocaleString()}
                              </td>
                              <td className="px-3 py-2.5 text-right text-green-700 font-medium">
                                PKR {Number(b.advanceAmount).toLocaleString()}
                              </td>
                              <td className="px-3 py-2.5 text-right text-amber-700 font-bold">
                                PKR {Number(b.remainingAmount).toLocaleString()}
                              </td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan={7} className="px-3 py-6 text-center text-gray-400">
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

            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setSelectedCustomerId(null)}
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
