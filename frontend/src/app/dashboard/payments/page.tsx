"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { paymentApi, Payment } from "@/services/api/payment.api";
import { bookingApi } from "@/services/api/booking.api";
import {
  CreditCard,
  Plus,
  Search,
  Printer,
  CheckCircle2,
  DollarSign,
  AlertCircle,
  X,
  FileCheck,
} from "lucide-react";

export default function OwnerPaymentsPage() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  const [paymentForm, setPaymentForm] = useState({
    bookingId: "",
    amount: 10000,
    paymentMethod: "CASH" as "CASH" | "BANK_TRANSFER" | "ONLINE" | "CHEQUE",
    reference: "",
    notes: "",
  });

  // Fetch payments
  const { data, isLoading } = useQuery({
    queryKey: ["owner-payments", page],
    queryFn: async () => {
      const res = await paymentApi.getAll({ page, limit: 10 });
      return res as { payments: Payment[]; pagination: { total: number; page: number; totalPages: number } };
    },
  });

  // Fetch active bookings for payment dropdown
  const { data: bookingsData } = useQuery({
    queryKey: ["owner-active-bookings-for-payments"],
    queryFn: async () => {
      const res = await bookingApi.getAll({ status: "CONFIRMED", limit: 50 });
      return (res as any)?.bookings || [];
    },
  });

  const selectedBookingDetails = bookingsData?.find((b: any) => b.id === paymentForm.bookingId);

  // Add payment mutation
  const addPaymentMutation = useMutation({
    mutationFn: (formData: any) => paymentApi.addPayment(formData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["owner-payments"] });
      queryClient.invalidateQueries({ queryKey: ["owner-overview"] });
      queryClient.invalidateQueries({ queryKey: ["owner-bookings"] });
      setCreateModalOpen(false);
      setFormError(null);
    },
    onError: (err: any) => {
      setFormError(err.message || "Failed to record payment.");
    },
  });

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!paymentForm.bookingId) {
      setFormError("Please select a booking.");
      return;
    }
    if (selectedBookingDetails && paymentForm.amount > Number(selectedBookingDetails.remainingAmount)) {
      setFormError(
        `Overpayment error: Amount cannot exceed remaining balance of PKR ${Number(
          selectedBookingDetails.remainingAmount
        ).toLocaleString()}`
      );
      return;
    }

    setFormError(null);
    addPaymentMutation.mutate({
      ...paymentForm,
      amount: Number(paymentForm.amount),
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
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">Payments & Receipts</h1>
          <p className="text-sm text-gray-500">Record installments, track cash receipts, and manage billing</p>
        </div>
        <button
          onClick={() => {
            setFormError(null);
            setCreateModalOpen(true);
          }}
          className="inline-flex items-center gap-2 rounded-xl bg-red-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-red-700 transition"
        >
          <Plus className="h-4 w-4" />
          Record Payment
        </button>
      </div>

      {/* Payments Table */}
      <div className="rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-gray-600">
            <thead className="bg-gray-50 text-xs font-semibold uppercase text-gray-500">
              <tr>
                <th className="px-5 py-3.5">Receipt #</th>
                <th className="px-5 py-3.5">Booking #</th>
                <th className="px-5 py-3.5">Customer</th>
                <th className="px-5 py-3.5">Method</th>
                <th className="px-5 py-3.5">Date</th>
                <th className="px-5 py-3.5 text-right">Amount Paid</th>
                <th className="px-5 py-3.5 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="px-5 py-8 text-center text-sm text-gray-500">
                    <div className="flex justify-center">
                      <div className="h-6 w-6 animate-spin rounded-full border-2 border-red-600 border-t-transparent" />
                    </div>
                  </td>
                </tr>
              ) : data?.payments && data.payments.length > 0 ? (
                data.payments.map((p) => (
                  <tr key={p.id} className="hover:bg-gray-50/50">
                    <td className="px-5 py-4 font-mono font-bold text-gray-900">{p.receiptNumber}</td>
                    <td className="px-5 py-4 font-mono text-xs text-gray-600">
                      {p.booking?.bookingNumber || "—"}
                    </td>
                    <td className="px-5 py-4">
                      <p className="font-semibold text-gray-900">{p.booking?.customerName || "Customer"}</p>
                      <p className="text-xs text-gray-400">{p.booking?.hall?.name || ""}</p>
                    </td>
                    <td className="px-5 py-4">
                      <span className="rounded-lg bg-gray-100 px-2 py-0.5 text-xs font-semibold text-gray-700">
                        {p.paymentMethod}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-xs text-gray-500">
                      {new Date(p.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-5 py-4 text-right font-bold text-green-700">
                      PKR {Number(p.amount).toLocaleString()}
                    </td>
                    <td className="px-5 py-4 text-right">
                      <button
                        onClick={() => setSelectedPayment(p)}
                        className="rounded-lg p-1.5 text-gray-500 hover:bg-gray-100"
                        title="Print Receipt"
                      >
                        <Printer className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="px-5 py-8 text-center text-sm text-gray-500">
                    No payment records recorded yet.
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

      {/* Record Payment Modal */}
      {createModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
            <div className="flex items-center justify-between border-b pb-3 mb-4">
              <h3 className="font-bold text-gray-900 text-lg">Record Customer Payment</h3>
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
                <label className="block text-xs font-semibold text-gray-700">Select Booking</label>
                <select
                  required
                  value={paymentForm.bookingId}
                  onChange={(e) => setPaymentForm({ ...paymentForm, bookingId: e.target.value })}
                  className="mt-1 w-full rounded-xl border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-red-600 focus:outline-none"
                >
                  <option value="">-- Select Active Booking --</option>
                  {bookingsData?.map((b: any) => (
                    <option key={b.id} value={b.id}>
                      {b.bookingNumber} - {b.customerName} ({b.eventDate}) [Bal: PKR{" "}
                      {Number(b.remainingAmount).toLocaleString()}]
                    </option>
                  ))}
                </select>
              </div>

              {selectedBookingDetails && (
                <div className="rounded-xl bg-gray-50 p-3 text-xs space-y-1">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Total Booking:</span>
                    <span className="font-bold">
                      PKR {Number(selectedBookingDetails.totalAmount).toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between text-green-700">
                    <span>Already Paid:</span>
                    <span className="font-bold">
                      PKR {Number(selectedBookingDetails.advanceAmount).toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between text-amber-700 font-bold border-t pt-1">
                    <span>Remaining Due:</span>
                    <span>PKR {Number(selectedBookingDetails.remainingAmount).toLocaleString()}</span>
                  </div>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-gray-700">Amount Paid (PKR)</label>
                <input
                  type="number"
                  required
                  min={1}
                  value={paymentForm.amount}
                  onChange={(e) => setPaymentForm({ ...paymentForm, amount: Number(e.target.value) })}
                  className="mt-1 w-full rounded-xl border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-red-600 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700">Payment Method</label>
                <select
                  value={paymentForm.paymentMethod}
                  onChange={(e) => setPaymentForm({ ...paymentForm, paymentMethod: e.target.value as any })}
                  className="mt-1 w-full rounded-xl border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-red-600 focus:outline-none"
                >
                  <option value="CASH">Cash</option>
                  <option value="BANK_TRANSFER">Bank Transfer</option>
                  <option value="ONLINE">Online / EasyPaisa / JazzCash</option>
                  <option value="CHEQUE">Bank Cheque</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700">Reference / Cheque # (Optional)</label>
                <input
                  type="text"
                  value={paymentForm.reference}
                  onChange={(e) => setPaymentForm({ ...paymentForm, reference: e.target.value })}
                  placeholder="e.g. Bank slip or transaction ID"
                  className="mt-1 w-full rounded-xl border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-red-600 focus:outline-none"
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
                  disabled={addPaymentMutation.isPending}
                  className="rounded-xl bg-red-600 px-4 py-2 text-xs font-semibold text-white hover:bg-red-700 disabled:opacity-50"
                >
                  {addPaymentMutation.isPending ? "Recording..." : "Record Payment"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Receipt Modal */}
      {selectedPayment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
            <div className="flex items-center justify-between border-b pb-3 mb-4">
              <div>
                <span className="text-xs font-semibold text-green-700">Payment Receipt</span>
                <h3 className="font-bold text-gray-900 text-lg">Receipt #{selectedPayment.receiptNumber}</h3>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={handlePrint} className="rounded-lg p-1.5 text-gray-500 hover:bg-gray-100">
                  <Printer className="h-5 w-5" />
                </button>
                <button onClick={() => setSelectedPayment(null)} className="text-gray-400 hover:text-gray-600">
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            <div className="space-y-3 text-xs">
              <div className="rounded-xl bg-gray-50 p-4 space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-400">Customer:</span>
                  <span className="font-bold text-gray-900">{selectedPayment.booking?.customerName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Booking Number:</span>
                  <span className="font-mono font-bold text-gray-900">
                    {selectedPayment.booking?.bookingNumber}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Hall:</span>
                  <span className="font-semibold text-gray-800">{selectedPayment.booking?.hall?.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Payment Date:</span>
                  <span className="font-medium text-gray-800">
                    {new Date(selectedPayment.createdAt).toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Method:</span>
                  <span className="font-bold text-gray-800">{selectedPayment.paymentMethod}</span>
                </div>
                {selectedPayment.reference && (
                  <div className="flex justify-between">
                    <span className="text-gray-400">Reference:</span>
                    <span className="font-mono text-gray-800">{selectedPayment.reference}</span>
                  </div>
                )}
                <div className="border-t pt-2 flex justify-between text-sm">
                  <span className="font-bold text-gray-900">Amount Paid:</span>
                  <span className="font-extrabold text-green-700">
                    PKR {Number(selectedPayment.amount).toLocaleString()}
                  </span>
                </div>
              </div>
            </div>

            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setSelectedPayment(null)}
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
