import { z } from "zod";

export const createCustomerSchema = z.object({
  fullName: z.string().trim().min(1, "Customer full name is required"),
  phone: z.string().trim().nullable().optional(),
  whatsappNumber: z.string().trim().nullable().optional(),
  address: z.string().trim().nullable().optional(),
  referenceName: z.string().trim().nullable().optional(),
  referencePhone: z.string().trim().nullable().optional(),
  notes: z.string().trim().nullable().optional(),
});
