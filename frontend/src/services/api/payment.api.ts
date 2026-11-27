import api from "./axios";

export interface Payment {
  id: string;
  receiptNumber?: string;
  bookingId: string;
  amount: number | string;
  paymentMethod?: "CASH" | "BANK_TRANSFER" | "ONLINE" | "CHEQUE" | "CARD" | "OTHER" | "JAZZCASH" | "EASYPAISA";
  method?: string;
  status?: string;
  transactionReference?: string | null;
  reference?: string | null;
  paymentDate?: string;
  notes?: string | null;
  createdAt: string;
  booking?: {
    id: string;
    bookingNumber: string;
    customerName: string;
    customerPhone?: string;
    eventDate: string;
    totalAmount?: number | string;
    advanceAmount?: number | string;
    remainingAmount?: number | string;
    status?: string;
    notes?: string | null;
    hall?: { id: string; name: string; city?: string };
  };
}

export const paymentApi = {
  async getAll(params?: { bookingId?: string; startDate?: string; endDate?: string; page?: number; limit?: number }) {
    return api.get<{ payments: Payment[]; pagination: { total: number; page: number; totalPages: number } }>(
      "/payments",
      { params }
    );
  },

  async addPayment(data: {
    bookingId: string;
    amount: number;
    paymentMethod?: "CASH" | "BANK_TRANSFER" | "ONLINE" | "CHEQUE" | "CARD" | "OTHER" | "JAZZCASH" | "EASYPAISA";
    method?: string;
    transactionReference?: string | null;
    reference?: string | null;
    paymentDate?: string | null;
    notes?: string | null;
  }) {
    // Map payment methods to backend enum if necessary
    let backendMethod = data.method || data.paymentMethod || "CASH";
    let extraRef = data.transactionReference || data.reference || null;

    if (backendMethod === "JAZZCASH") {
      backendMethod = "CARD";
      if (!extraRef) extraRef = "JazzCash";
      else extraRef = `JazzCash: ${extraRef}`;
    } else if (backendMethod === "EASYPAISA") {
      backendMethod = "CARD";
      if (!extraRef) extraRef = "EasyPaisa";
      else extraRef = `EasyPaisa: ${extraRef}`;
    } else if (backendMethod === "ONLINE") {
      backendMethod = "CARD";
    }

    return api.post<{ payment: Payment; booking: any }>("/payments", {
      bookingId: data.bookingId,
      amount: data.amount,
      method: backendMethod,
      transactionReference: extraRef,
      notes: data.notes,
      paymentDate: data.paymentDate,
    });
  },

  async refund(id: string, reason?: string) {
    return api.post<{ payment: Payment; booking: any }>(`/payments/${id}/refund`, { reason });
  },
};
