import { z } from "zod";
import { OwnerStatus } from "@prisma/client";

export const createOwnerSchema = z.object({
  name: z.string().min(2, "Name is required").max(100),
  email: z.string().email("Invalid email").toLowerCase().trim(),
  phone: z.string().min(7, "Phone is required").max(20),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .regex(/[A-Za-z]/, "Must contain letters")
    .regex(/[0-9]/, "Must contain numbers"),
  status: z.nativeEnum(OwnerStatus).default(OwnerStatus.APPROVED),
});

export const updateOwnerSchema = z.object({
  name: z.string().min(2).max(100).optional(),
  email: z.string().email().toLowerCase().trim().optional(),
  phone: z.string().min(7).max(20).optional(),
  status: z.nativeEnum(OwnerStatus).optional(),
});

export const updateOwnerStatusSchema = z.object({
  status: z.nativeEnum(OwnerStatus, {
    errorMap: () => ({ message: "Status must be PENDING, APPROVED, REJECTED, or BLOCKED" }),
  }),
});
