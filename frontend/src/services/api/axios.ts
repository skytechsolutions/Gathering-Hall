import axios from "axios";

export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

const instance = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

instance.interceptors.response.use(
  (response) => response.data?.data ?? response.data,
  (error) => {
    const data = error.response?.data;
    let message = data?.message || data?.error || error.message || "An unexpected error occurred";

    // Extract detailed Zod validation messages if present
    if (Array.isArray(data?.errors) && data.errors.length > 0) {
      const fieldMessages = data.errors
        .map((e: any) => (typeof e === "string" ? e : e.message))
        .filter(Boolean);
      if (fieldMessages.length > 0) {
        message = fieldMessages.join(". ");
      }
    }

    return Promise.reject(new Error(message));
  }
);

export const api = {
  get: <T = any>(url: string, config?: any): Promise<T> =>
    instance.get(url, config) as unknown as Promise<T>,
  post: <T = any>(url: string, data?: any, config?: any): Promise<T> =>
    instance.post(url, data, config) as unknown as Promise<T>,
  put: <T = any>(url: string, data?: any, config?: any): Promise<T> =>
    instance.put(url, data, config) as unknown as Promise<T>,
  patch: <T = any>(url: string, data?: any, config?: any): Promise<T> =>
    instance.patch(url, data, config) as unknown as Promise<T>,
  delete: <T = any>(url: string, config?: any): Promise<T> =>
    instance.delete(url, config) as unknown as Promise<T>,
};

export default api;
