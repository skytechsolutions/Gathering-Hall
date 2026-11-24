import api from "./axios";
import { User } from "./auth.api";

export interface OwnerWithStats extends User {
  hallsCount: number;
  bookingsCount: number;
  _count?: { halls: number; bookings: number };
}

export type Owner = OwnerWithStats;

export const ownerApi = {
  async getAll(params?: { search?: string; status?: string; page?: number; limit?: number }) {
    return api.get<{ owners: Owner[]; pagination: { total: number; page: number; totalPages: number } }>(
      "/owners",
      { params }
    );
  },

  async getById(id: string) {
    return api.get<{
      owner: User & {
        halls: any[];
        financials: {
          totalBookings: number;
          totalRevenue: number;
          totalAdvance: number;
          totalRemaining: number;
          totalCommission: number;
          ownerNet: number;
        };
      };
    }>(`/owners/${id}`);
  },

  async getHalls(id: string) {
    const res = await api.get<{
      owner: User & { halls: any[] };
    }>(`/owners/${id}`);
    return { halls: res?.owner?.halls || [] };
  },

  async create(data: { name: string; email: string; phone: string; password: string; status?: string }) {
    return api.post<{ owner: User }>("/owners", data);
  },

  async update(id: string, data: Partial<{ name: string; email: string; phone: string; status: string }>) {
    return api.put<{ owner: User }>(`/owners/${id}`, data);
  },

  async updateStatus(id: string, status: "PENDING" | "APPROVED" | "REJECTED" | "BLOCKED") {
    return api.patch<{ owner: User }>(`/owners/${id}/status`, { status });
  },
};
