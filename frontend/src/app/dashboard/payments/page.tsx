"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { paymentApi, Payment } from "@/services/api/payment.api";
import { bookingApi } from "@/services/api/booking.api";
import { Modal } from "@/components/ui/modal";
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
  Receipt,
  Sparkles,
} from "lucide-react";

export default function OwnerPaymentsPage() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  const [paymentForm, setPaymentForm] = useState<{
    bookingId: string;
    amount: number | "";
    paymentMethod: "CASH" | "BANK_TRANSFER" | "ONLINE" | "CHEQUE";
    reference: string;
    notes: string;
  }>({
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
    const payAmt = Number(paymentForm.amount) || 0;
    if (payAmt <= 0) {
      setFormError("Please enter a valid payment amount.");
      return;
    }
    if (selectedBookingDetails && payAmt > Number(selectedBookingDetails.remainingAmount)) {
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
      amount: payAmt,
    });
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between bg-white rounded-2xl p-6 border border-gray-100">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-gray-900">Payments & Receipts</h1>
          <p className="text-xs sm:text-sm text-gray-500 font-medium mt-1">
            Record customer installments, print official receipts, and manage billing accounts
          </p>
        </div>
        <button
          onClick={() => {
            setFormError(null);
            setCreateModalOpen(true);
          }}
          className="inline-flex items-center gap-2 rounded-xl bg-[#3b3c44] px-4 py-2.5 text-xs sm:text-sm font-bold text-white hover:bg-[#2b2c33] active:scale-95 transition"
        >
          <Plus className="h-4 w-4" />
          Record Payment
        </button>
      </div>

      {/* Payments Table */}
      <div className="rounded-2xl border border-slate-200/80 bg-white overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-gray-600">
            <thead className="bg-gray-50/70 text-xs font-bold uppercase text-gray-400 border-b border-gray-100">
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
            <tbody className="divide-y divide-gray-100/80">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="px-5 py-12 text-center text-sm text-gray-500">
                    <div className="flex justify-center">
                      <div className="h-7 w-7 animate-spin rounded-full border-3 border-[#3b3c44] border-t-transparent" />
                    </div>
                  </td>
                </tr>
              ) : data?.payments && data.payments.length > 0 ? (
                data.payments.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-100/50 transition">
                    <td className="px-5 py-4 font-mono font-black text-[#3b3c44]">{p.receiptNumber}</td>
                    <td className="px-5 py-4 font-mono text-xs font-semibold text-gray-600">
                      {p.booking?.bookingNumber || "—"}
                    </td>
                    <td className="px-5 py-4">
                      <p className="font-bold text-gray-900">{p.booking?.customerName || "Customer"}</p>
                      <p className="text-xs text-gray-400 font-medium">{p.booking?.hall?.name || ""}</p>
                    </td>
                    <td className="px-5 py-4">
                      <span className="rounded-xl bg-gray-100/90 border border-gray-200/50 px-2.5 py-1 text-xs font-bold text-gray-700">
                        {p.paymentMethod}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-xs font-medium text-gray-500">
                      {new Date(p.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-5 py-4 text-right font-black text-emerald-700">
                      PKR {Number(p.amount).toLocaleString()}
                    </td>
                    <td className="px-5 py-4 text-right">
                      <button
                        onClick={() => setSelectedPayment(p)}
                        className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 hover:text-gray-900 transition"
                        title="Print Official Receipt"
                      >
                        <Printer className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="px-5 py-10 text-center text-sm text-gray-400 font-medium">
                    No payment records recorded yet.
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

      {/* Record Payment Modal */}
      <Modal
        isOpen={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        maxWidth="max-w-md"
      >
        <div className="flex items-center justify-between border-b border-gray-100 pb-3 mb-4">
          <div>
            <h3 className="font-extrabold text-gray-900 text-lg">Record Customer Payment</h3>
            <p className="text-xs text-gray-400 font-medium">Add payment towards confirmed booking</p>
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
            <label className="block text-xs font-bold text-gray-700">Select Booking</label>
            <select
              required
              value={paymentForm.bookingId}
              onChange={(e) => setPaymentForm({ ...paymentForm, bookingId: e.target.value })}
              className="mt-1 w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm text-gray-900 focus:border-[#3b3c44] focus:ring-2 focus:ring-slate-300 focus:outline-none"
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
            <div className="rounded-xl bg-gray-50/80 border border-gray-100 p-3.5 text-xs space-y-1.5">
              <div className="flex justify-between">
                <span className="text-gray-500 font-medium">Total Booking Amount:</span>
                <span className="font-black text-gray-900">
                  PKR {Number(selectedBookingDetails.totalAmount).toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between text-emerald-700">
                <span className="font-medium">Already Paid:</span>
                <span className="font-black">
                  PKR {Number(selectedBookingDetails.advanceAmount).toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between text-amber-700 font-bold border-t border-gray-200/70 pt-1.5">
                <span>Remaining Due:</span>
                <span className="font-black">PKR {Number(selectedBookingDetails.remainingAmount).toLocaleString()}</span>
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-gray-700">Amount Paid (PKR)</label>
            <input
              type="number"
              required
              min={1}
              placeholder="0"
              value={paymentForm.amount === 0 || paymentForm.amount === "" ? "" : paymentForm.amount}
              onChange={(e) => setPaymentForm({ ...paymentForm, amount: e.target.value === "" ? "" : Number(e.target.value) })}
              className="mt-1 w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm text-gray-900 focus:border-[#3b3c44] focus:ring-2 focus:ring-slate-300 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700">Payment Method</label>
            <select
              value={paymentForm.paymentMethod}
              onChange={(e) => setPaymentForm({ ...paymentForm, paymentMethod: e.target.value as any })}
              className="mt-1 w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm text-gray-900 focus:border-[#3b3c44] focus:ring-2 focus:ring-slate-300 focus:outline-none"
            >
              <option value="CASH">Cash</option>
              <option value="BANK_TRANSFER">Bank Transfer</option>
              <option value="ONLINE">Online / EasyPaisa / JazzCash</option>
              <option value="CHEQUE">Bank Cheque</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700">Reference / Slip # (Optional)</label>
            <input
              type="text"
              value={paymentForm.reference}
              onChange={(e) => setPaymentForm({ ...paymentForm, reference: e.target.value })}
              placeholder="e.g. Bank slip or transaction ID"
              className="mt-1 w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm text-gray-900 focus:border-[#3b3c44] focus:ring-2 focus:ring-slate-300 focus:outline-none"
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
              disabled={addPaymentMutation.isPending}
              className="rounded-xl bg-[#3b3c44] px-5 py-2.5 text-xs font-bold text-white hover:bg-[#2b2c33] disabled:opacity-50 active:scale-95 transition"
            >
              {addPaymentMutation.isPending ? "Recording..." : "Record Payment"}
            </button>
          </div>
        </form>
      </Modal>

      {/* Receipt Modal */}
      <Modal
        isOpen={!!selectedPayment}
        onClose={() => setSelectedPayment(null)}
        maxWidth="max-w-md"
      >
        {selectedPayment && (
          <div>
            <div className="flex items-center justify-between border-b border-gray-100 pb-3 mb-4">
              <div>
                <span className="text-xs font-bold text-emerald-700">Payment Receipt</span>
                <h3 className="font-extrabold text-gray-900 text-lg">Receipt #{selectedPayment.receiptNumber}</h3>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={handlePrint}
                  className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 transition"
                  title="Print Official Slip"
                >
                  <Printer className="h-5 w-5" />
                </button>
                <button
                  onClick={() => setSelectedPayment(null)}
                  className="text-gray-400 hover:text-gray-600 rounded-lg p-1"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            <div className="space-y-3 text-xs">
              <div className="rounded-xl bg-gray-50/80 border border-gray-100 p-4 space-y-2.5">
                <div className="flex justify-between">
                  <span className="text-gray-400 font-medium">Customer:</span>
                  <span className="font-bold text-gray-900">{selectedPayment.booking?.customerName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400 font-medium">Booking Number:</span>
                  <span className="font-mono font-bold text-[#3b3c44]">
                    {selectedPayment.booking?.bookingNumber}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400 font-medium">Hall Venue:</span>
                  <span className="font-bold text-gray-800">{selectedPayment.booking?.hall?.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400 font-medium">Payment Date:</span>
                  <span className="font-semibold text-gray-800">
                    {new Date(selectedPayment.createdAt).toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400 font-medium">Method:</span>
                  <span className="font-bold text-gray-800">{selectedPayment.paymentMethod}</span>
                </div>
                {selectedPayment.reference && (
                  <div className="flex justify-between">
                    <span className="text-gray-400 font-medium">Reference:</span>
                    <span className="font-mono text-gray-800">{selectedPayment.reference}</span>
                  </div>
                )}
                <div className="border-t border-gray-200/70 pt-2.5 flex justify-between text-sm">
                  <span className="font-bold text-gray-900">Amount Paid:</span>
                  <span className="font-black text-emerald-700">
                    PKR {Number(selectedPayment.amount).toLocaleString()}
                  </span>
                </div>
              </div>
            </div>

            <div className="mt-6 flex justify-end border-t border-gray-100 pt-3">
              <button
                onClick={() => setSelectedPayment(null)}
                className="rounded-xl bg-gray-100 px-4 py-2 text-xs font-bold text-gray-700 hover:bg-gray-200 transition"
              >
                Close
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
