import api from "./axios";

export interface User {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  role: "SUPER_ADMIN" | "HALL_OWNER";
  status: "PENDING" | "APPROVED" | "REJECTED" | "BLOCKED";
  createdAt: string;
}

export const authApi = {
  async register(data: { name: string; email: string; phone: string; password: string }) {
    return api.post<{ user: User; message: string }>("/auth/register", data);
  },

  async login(data: { email: string; password: string }) {
    return api.post<{ user: User; token: string }>("/auth/login", data);
  },

  async me() {
    return api.get<{ user: User }>("/auth/me");
  },

  async logout() {
    return api.post("/auth/logout");
  },

  async refresh() {
    return api.post<{ token: string }>("/auth/refresh");
  },

  async updateProfile(data: { name?: string; phone?: string }) {
    return api.put<{ user: User }>("/auth/profile", data);
  },
};
