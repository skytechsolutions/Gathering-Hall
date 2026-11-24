import api from "./axios";

export interface Customer {
  id: string;
  name: string;
  phone: string;
  email: string | null;
  cnic: string | null;
  address: string | null;
  createdAt: string;
  _count?: { bookings: number };
  bookings?: any[];
}

export interface CustomerLedger {
  customer: Customer;
  totalBilled: number;
  totalPaid: number;
  remainingBalance: number;
  bookings: any[];
}

export const customerApi = {
  async getAll(params?: { search?: string; page?: number; limit?: number }) {
    return api.get<{ customers: Customer[]; pagination: { total: number; page: number; totalPages: number } }>(
      "/customers",
      { params }
    );
  },

  async getById(id: string) {
    return api.get<{ customer: Customer }>(`/customers/${id}`);
  },

  async getBookings(id: string) {
    return api.get<{ customer: Customer; bookings: any[] }>(`/customers/${id}/bookings`);
  },

  async getLedger(id: string) {
    return api.get<CustomerLedger>(`/customers/${id}/ledger`);
  },
};
