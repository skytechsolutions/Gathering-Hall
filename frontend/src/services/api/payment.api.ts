import api from "./axios";

export interface Payment {
  id: string;
  receiptNumber: string;
  bookingId: string;
  amount: number;
  paymentMethod: "CASH" | "BANK_TRANSFER" | "ONLINE" | "CHEQUE";
  reference: string | null;
  notes: string | null;
  createdAt: string;
  booking?: {
    id: string;
    bookingNumber: string;
    customerName: string;
    customerPhone: string;
    eventDate: string;
    totalAmount: number;
    advanceAmount: number;
    remainingAmount: number;
    status: string;
    hall?: { id: string; name: string };
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
    paymentMethod: "CASH" | "BANK_TRANSFER" | "ONLINE" | "CHEQUE";
    reference?: string | null;
    notes?: string | null;
  }) {
    return api.post<{ payment: Payment; booking: any }>("/payments", data);
  },

  async refund(id: string, reason?: string) {
    return api.post<{ payment: Payment; booking: any }>(`/payments/${id}/refund`, { reason });
  },
};
