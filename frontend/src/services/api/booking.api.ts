import api from "./axios";

export interface Booking {
  id: string;
  bookingNumber: string;
  hallId: string;
  customerId: string;
  customerName: string;
  customerPhone: string;
  eventDate: string;
  eventType: "BARAT" | "WALIMA" | "MEHNDI" | "OTHER";
  status: "HOLD" | "CONFIRMED" | "CANCELLED" | "BLOCKED" | "EXPIRED";
  totalAmount: number;
  advanceAmount: number;
  remainingAmount: number;
  holdExpiresAt: string | null;
  commissionRate: number;
  commissionAmount: number;
  notes: string | null;
  createdAt: string;
  hall?: { id: string; name: string; city: string; owner?: { id: string; name: string; phone: string | null } };
  customer?: any;
  payments?: any[];
  history?: any[];
}

export interface CalendarAvailabilityEvent {
  id: string;
  title: string;
  start: string;
  end: string;
  status: "HOLD" | "CONFIRMED" | "BLOCKED" | "AVAILABLE";
  color: "GREEN" | "RED" | "YELLOW" | "BLACK";
  bookingNumber?: string;
  customerName?: string;
  customerPhone?: string;
  totalAmount?: number;
  advanceAmount?: number;
  remainingAmount?: number;
  holdExpiresAt?: string;
  reason?: string;
}

export const bookingApi = {
  async getAll(params?: {
    hallId?: string;
    ownerId?: string;
    status?: string;
    search?: string;
    eventDate?: string;
    page?: number;
    limit?: number;
  }) {
    return api.get<{ bookings: Booking[]; pagination: { total: number; page: number; totalPages: number } }>(
      "/bookings",
      { params }
    );
  },

  async getById(id: string) {
    return api.get<{ booking: Booking }>(`/bookings/${id}`);
  },

  async create(data: {
    hallId: string;
    customerName: string;
    customerPhone: string;
    customerEmail?: string | null;
    customerAddress?: string | null;
    eventDate: string;
    eventType?: string;
    status?: "HOLD" | "CONFIRMED";
    totalAmount: number;
    advanceAmount?: number;
    holdHours?: number;
    notes?: string | null;
  }) {
    return api.post<{ booking: Booking }>("/bookings", data);
  },

  async confirm(id: string, data?: { advanceAmount?: number; notes?: string | null }) {
    return api.patch<{ booking: Booking }>(`/bookings/${id}/confirm`, data || {});
  },

  async cancel(id: string, reason?: string) {
    return api.patch<{ booking: Booking }>(`/bookings/${id}/cancel`, { reason });
  },

  async extendHold(id: string, additionalHours: number = 24) {
    return api.patch<{ booking: Booking }>(`/bookings/${id}/hold`, { additionalHours });
  },

  async blockDate(data: { hallId: string; date: string; reason: string }) {
    return api.post<{ blocked: any }>("/bookings/block-date", data);
  },

  async unblockDate(id: string) {
    return api.delete(`/bookings/block-date/${id}`);
  },

  async getAvailability(hallId: string, year?: number, month?: number) {
    return api.get<{
      hall: { id: string; name: string; city: string };
      events: CalendarAvailabilityEvent[];
    }>("/bookings/availability", {
      params: { hallId, year, month },
    });
  },
};
