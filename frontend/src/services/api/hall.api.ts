import api from "./axios";

export interface Hall {
  id: string;
  ownerId: string;
  name: string;
  city: string;
  area: string;
  address: string;
  capacity: number;
  priceWeekday: number;
  priceWeekend: number;
  amenities: string[];
  description: string | null;
  images: string[];
  status: "PENDING" | "APPROVED" | "REJECTED" | "SUSPENDED";
  createdAt: string;
  owner?: { id: string; name: string; email: string; phone: string | null };
  _count?: { bookings: number };
}

export const hallApi = {
  async getAll(params?: { search?: string; city?: string; status?: string; ownerId?: string; page?: number; limit?: number }) {
    return api.get<{ halls: Hall[]; pagination: { total: number; page: number; totalPages: number } }>(
      "/halls",
      { params }
    );
  },

  async getById(id: string) {
    return api.get<{ hall: Hall }>(`/halls/${id}`);
  },

  async create(data: Partial<Hall> & { ownerId?: string }) {
    return api.post<{ hall: Hall }>("/halls", data);
  },

  async update(id: string, data: Partial<Hall> & { ownerId?: string }) {
    return api.put<{ hall: Hall }>(`/halls/${id}`, data);
  },

  async updateStatus(id: string, status: "PENDING" | "APPROVED" | "REJECTED" | "SUSPENDED") {
    return api.patch<{ hall: Hall }>(`/halls/${id}/status`, { status });
  },

  async delete(id: string) {
    return api.delete(`/halls/${id}`);
  },
};
