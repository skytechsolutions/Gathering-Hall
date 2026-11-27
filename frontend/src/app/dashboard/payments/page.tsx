"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { paymentApi, Payment } from "@/services/api/payment.api";
import { bookingApi } from "@/services/api/booking.api";
import { Modal } from "@/components/ui/modal";
import {
  Plus,
  Printer,
  AlertCircle,
  X,
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
      const res = await paymentApi.getAll({ page, limit: 15 });
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
      queryClient.invalidateQueries({ queryKey: ["owner-customers"] });
      queryClient.invalidateQueries({ queryKey: ["customer-ledger"] });
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

  // Aggregated metrics from payments
  const totalCount = data?.pagination?.total || data?.payments?.length || 0;
  const pageTotalPaid = data?.payments?.reduce((acc, p) => acc + (Number(p.amount) || 0), 0) || 0;
  const latestAmount = data?.payments?.[0] ? Number(data.payments[0].amount) || 0 : 0;

  return (
    <div className="space-y-5 select-none font-sans">
      {/* ============================================================== */}
      {/* 1. TOP HEADER (Editorial luxury styling)                       */}
      {/* ============================================================== */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div>
          <h1 className="font-serif text-2xl sm:text-3xl text-[#1f2421] font-normal tracking-tight">
            Payments & Receipts
          </h1>
          <p className="text-xs text-[#7a6f60] font-normal mt-0.5">
            Record customer installments, print official receipts, and manage billing accounts
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
          <span>Record Payment</span>
        </button>
      </div>

      {/* ============================================================== */}
      {/* 2. UNIFIED 3-COLUMN METRICS CARD                              */}
      {/* ============================================================== */}
      <div className="rounded-2xl border border-[#e5ded4] bg-[#faf7f2] p-6 grid grid-cols-1 sm:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x divide-[#e5ded4] shadow-2xs">
        <div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-[#7a6f60]">
            TOTAL RECEIPTS
          </span>
          <p className="font-serif text-3xl sm:text-4xl text-[#1f2421] font-normal mt-2">
            {totalCount}
          </p>
          <p className="text-xs text-[#7a6f60] font-normal mt-1">Verified transactions</p>
        </div>

        <div className="sm:pl-6 pt-4 sm:pt-0">
          <span className="text-[10px] font-bold uppercase tracking-wider text-[#7a6f60]">
            TOTAL RECEIVED (PAGE)
          </span>
          <p className="font-serif text-3xl sm:text-4xl text-[#1f2421] font-normal mt-2">
            PKR {pageTotalPaid.toLocaleString()}
          </p>
          <p className="text-xs text-[#7a6f60] font-normal mt-1">Cash & bank collections</p>
        </div>

        <div className="sm:pl-6 pt-4 sm:pt-0">
          <span className="text-[10px] font-bold uppercase tracking-wider text-[#7a6f60]">
            LATEST INSTALLMENT
          </span>
          <p className="font-serif text-3xl sm:text-4xl text-[#c28e36] font-normal mt-2">
            PKR {latestAmount.toLocaleString()}
          </p>
          <p className="text-xs text-[#7a6f60] font-normal mt-1">Most recent receipt</p>
        </div>
      </div>

      {/* ============================================================== */}
      {/* 3. COUNTER ROW                                                 */}
      {/* ============================================================== */}
      <div className="flex items-center justify-between text-xs text-[#7a6f60] pt-1 font-normal">
        <span>Official Payment Receipts Ledger</span>
        <span>Showing {data?.payments?.length || 0} of {totalCount} records</span>
      </div>

      {/* ============================================================== */}
      {/* 4. PAYMENTS TABLE CARD                                         */}
      {/* ============================================================== */}
      <div className="rounded-2xl border border-[#e5ded4] bg-[#faf7f2] overflow-hidden shadow-2xs">
        {/* Mobile View (< md) */}
        <div className="md:hidden divide-y divide-[#e5ded4]">
          {isLoading ? (
            <div className="py-12 flex justify-center">
              <div className="h-7 w-7 animate-spin rounded-full border-3 border-[#1e382b] border-t-transparent" />
            </div>
          ) : data?.payments && data.payments.length > 0 ? (
            data.payments.map((p) => (
              <div key={p.id} className="p-4 space-y-2.5">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-mono font-bold text-xs text-[#1e382b]">{p.receiptNumber}</span>
                  <span className="rounded-md bg-white border border-[#d6cec3] px-2 py-0.5 text-[10px] font-semibold text-[#1f2421]">
                    {p.paymentMethod}
                  </span>
                </div>

                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h4 className="font-semibold text-xs text-[#1f2421]">{p.booking?.customerName || "Customer"}</h4>
                    <p className="text-[11px] text-[#7a6f60] font-medium">{p.booking?.hall?.name || ""}</p>
                    <p className="font-mono text-[11px] text-[#7a6f60] mt-0.5">Booking: {p.booking?.bookingNumber || "—"}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-xs text-emerald-800">PKR {Number(p.amount).toLocaleString()}</p>
                    <p className="text-[11px] font-mono text-[#7a6f60] mt-0.5">{new Date(p.createdAt).toLocaleDateString()}</p>
                  </div>
                </div>

                <div className="pt-1 flex justify-end">
                  <button
                    onClick={() => setSelectedPayment(p)}
                    className="w-full inline-flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-lg border border-[#d6cec3] bg-white hover:bg-[#ebe3d7] text-xs font-semibold text-[#1f2421] transition cursor-pointer"
                  >
                    <Printer className="h-3.5 w-3.5" />
                    <span>Receipt Voucher</span>
                  </button>
                </div>
              </div>
            ))
          ) : (
            <div className="py-10 text-center text-xs text-[#7a6f60] font-medium">
              No payment records recorded yet.
            </div>
          )}
        </div>

        {/* Desktop Payments Table */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left text-xs text-[#1f2421]">
            <thead className="bg-[#faf7f2] text-[11px] font-bold uppercase tracking-wider text-[#7a6f60] border-b border-[#e5ded4] select-none">
              <tr>
                <th className="px-5 py-3.5">Receipt #</th>
                <th className="px-5 py-3.5">Booking #</th>
                <th className="px-5 py-3.5">Customer & Venue</th>
                <th className="px-5 py-3.5">Method</th>
                <th className="px-5 py-3.5">Date</th>
                <th className="px-5 py-3.5 text-right">Amount Paid</th>
                <th className="px-5 py-3.5 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#e5ded4]">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="px-5 py-12 text-center text-xs text-[#7a6f60]">
                    <div className="flex justify-center">
                      <div className="h-7 w-7 animate-spin rounded-full border-3 border-[#1e382b] border-t-transparent" />
                    </div>
                  </td>
                </tr>
              ) : data?.payments && data.payments.length > 0 ? (
                data.payments.map((p) => (
                  <tr key={p.id} className="hover:bg-[#ebe3d7]/20 transition">
                    <td className="px-5 py-4 font-mono font-bold text-[#1e382b]">{p.receiptNumber}</td>
                    <td className="px-5 py-4 font-mono text-xs font-medium text-[#1f2421]">
                      {p.booking?.bookingNumber || "—"}
                    </td>
                    <td className="px-5 py-4">
                      <p className="font-semibold text-xs text-[#1f2421]">{p.booking?.customerName || "Customer"}</p>
                      <p className="text-[11px] text-[#7a6f60] font-medium">{p.booking?.hall?.name || ""}</p>
                    </td>
                    <td className="px-5 py-4">
                      <span className="rounded-md bg-white border border-[#d6cec3] px-2.5 py-1 text-[11px] font-semibold text-[#1f2421]">
                        {p.paymentMethod}
                      </span>
                    </td>
                    <td className="px-5 py-4 font-mono text-xs text-[#7a6f60]">
                      {new Date(p.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-5 py-4 text-right font-bold text-xs text-emerald-800">
                      PKR {Number(p.amount).toLocaleString()}
                    </td>
                    <td className="px-5 py-4 text-right">
                      <div className="flex items-center justify-end gap-3">
                        <button
                          onClick={() => setSelectedPayment(p)}
                          className="rounded-md border border-[#d6cec3] bg-white hover:bg-[#ebe3d7] px-3 py-1 text-xs font-semibold text-[#1f2421] transition cursor-pointer"
                        >
                          Receipt
                        </button>
                        <button
                          onClick={() => {
                            setSelectedPayment(p);
                            setTimeout(() => window.print(), 200);
                          }}
                          className="text-xs text-[#1f2421] underline hover:text-[#1e382b] font-medium cursor-pointer"
                        >
                          Print
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="px-5 py-10 text-center text-xs text-[#7a6f60] font-medium">
                    No payment records recorded yet.
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
      {/* 5. RECORD PAYMENT MODAL                                        */}
      {/* ============================================================== */}
      <Modal
        isOpen={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        maxWidth="max-w-md"
      >
        <div className="font-sans">
          <div className="flex items-center justify-between border-b border-[#e5ded4] pb-3 mb-4">
            <div>
              <h3 className="font-serif text-xl text-[#1f2421] font-normal">Record Customer Payment</h3>
              <p className="text-xs text-[#7a6f60] font-normal">Add installment towards confirmed booking</p>
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
              <label className="block text-xs font-bold text-[#1f2421]">Select Booking</label>
              <select
                required
                value={paymentForm.bookingId}
                onChange={(e) => setPaymentForm({ ...paymentForm, bookingId: e.target.value })}
                className="mt-1 w-full rounded-lg border border-[#d6cec3] bg-white px-3.5 py-2 text-xs text-[#1f2421] focus:border-[#1e382b] focus:outline-none"
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
              <div className="rounded-xl bg-white border border-[#e5ded4] p-3 text-xs space-y-1.5">
                <div className="flex justify-between">
                  <span className="text-[#7a6f60] font-medium">Total Booking Rent:</span>
                  <span className="font-bold text-[#1f2421]">
                    PKR {Number(selectedBookingDetails.totalAmount).toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between text-emerald-800">
                  <span className="font-medium">Already Paid:</span>
                  <span className="font-bold">
                    PKR {Number(selectedBookingDetails.advanceAmount).toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between text-[#c28e36] font-bold border-t border-[#e5ded4] pt-1.5">
                  <span>Remaining Due:</span>
                  <span>PKR {Number(selectedBookingDetails.remainingAmount).toLocaleString()}</span>
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-[#1f2421]">Amount Paid (PKR)</label>
              <input
                type="number"
                required
                min={1}
                placeholder="0"
                value={paymentForm.amount === 0 || paymentForm.amount === "" ? "" : paymentForm.amount}
                onChange={(e) => setPaymentForm({ ...paymentForm, amount: e.target.value === "" ? "" : Number(e.target.value) })}
                className="mt-1 w-full rounded-lg border border-[#d6cec3] bg-white px-3.5 py-2 text-xs text-[#1f2421] focus:border-[#1e382b] focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#1f2421]">Payment Method</label>
              <select
                value={paymentForm.paymentMethod}
                onChange={(e) => setPaymentForm({ ...paymentForm, paymentMethod: e.target.value as any })}
                className="mt-1 w-full rounded-lg border border-[#d6cec3] bg-white px-3.5 py-2 text-xs text-[#1f2421] focus:border-[#1e382b] focus:outline-none"
              >
                <option value="CASH">Cash</option>
                <option value="BANK_TRANSFER">Bank Transfer</option>
                <option value="ONLINE">Online / EasyPaisa / JazzCash</option>
                <option value="CHEQUE">Bank Cheque</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#1f2421]">Reference / Slip # (Optional)</label>
              <input
                type="text"
                value={paymentForm.reference}
                onChange={(e) => setPaymentForm({ ...paymentForm, reference: e.target.value })}
                placeholder="e.g. Bank slip or transaction ID"
                className="mt-1 w-full rounded-lg border border-[#d6cec3] bg-white px-3.5 py-2 text-xs text-[#1f2421] focus:border-[#1e382b] focus:outline-none"
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
                disabled={addPaymentMutation.isPending}
                className="rounded-lg bg-[#1e382b] hover:bg-[#162a20] px-5 py-2 text-xs font-semibold text-white disabled:opacity-50 active:scale-95 transition cursor-pointer shadow-xs"
              >
                {addPaymentMutation.isPending ? "Recording..." : "Record Payment"}
              </button>
            </div>
          </form>
        </div>
      </Modal>

      {/* ============================================================== */}
      {/* 6. RECEIPT MODAL                                               */}
      {/* ============================================================== */}
      <Modal
        isOpen={!!selectedPayment}
        onClose={() => setSelectedPayment(null)}
        maxWidth="max-w-md"
      >
        {selectedPayment && (
          <div className="font-sans">
            <div className="flex items-center justify-between border-b border-[#e5ded4] pb-3 mb-4">
              <div>
                <span className="text-xs font-bold text-emerald-800">Official Payment Slip</span>
                <h3 className="font-serif text-xl text-[#1f2421] font-normal">Receipt #{selectedPayment.receiptNumber}</h3>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={handlePrint}
                  className="rounded-lg p-2 text-[#7a6f60] hover:bg-[#ebe3d7] transition cursor-pointer"
                  title="Print Official Slip"
                >
                  <Printer className="h-4 w-4" />
                </button>
                <button
                  onClick={() => setSelectedPayment(null)}
                  className="text-[#7a6f60] hover:text-[#1f2421] rounded-lg p-1 cursor-pointer"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            <div className="space-y-3 text-xs">
              <div className="rounded-xl bg-white border border-[#e5ded4] p-4 space-y-2.5">
                <div className="flex justify-between">
                  <span className="text-[#7a6f60] font-medium">Customer:</span>
                  <span className="font-bold text-[#1f2421]">{selectedPayment.booking?.customerName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#7a6f60] font-medium">Booking Number:</span>
                  <span className="font-mono font-bold text-[#1e382b]">
                    {selectedPayment.booking?.bookingNumber}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#7a6f60] font-medium">Hall Venue:</span>
                  <span className="font-semibold text-[#1f2421]">{selectedPayment.booking?.hall?.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#7a6f60] font-medium">Payment Date:</span>
                  <span className="font-mono text-[#1f2421]">
                    {new Date(selectedPayment.createdAt).toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#7a6f60] font-medium">Method:</span>
                  <span className="font-semibold text-[#1f2421]">{selectedPayment.paymentMethod}</span>
                </div>
                {selectedPayment.reference && (
                  <div className="flex justify-between">
                    <span className="text-[#7a6f60] font-medium">Reference:</span>
                    <span className="font-mono text-[#1f2421]">{selectedPayment.reference}</span>
                  </div>
                )}
                <div className="border-t border-[#e5ded4] pt-2.5 flex justify-between text-sm">
                  <span className="font-bold text-[#1f2421]">Amount Paid:</span>
                  <span className="font-bold text-emerald-800">
                    PKR {Number(selectedPayment.amount).toLocaleString()}
                  </span>
                </div>
              </div>
            </div>

            <div className="mt-6 flex justify-end border-t border-[#e5ded4] pt-3">
              <button
                onClick={() => setSelectedPayment(null)}
                className="rounded-lg border border-[#d6cec3] bg-white px-4 py-2 text-xs font-semibold text-[#1f2421] hover:bg-[#faf7f2] transition cursor-pointer"
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
