import { z } from "zod";
import { EventType, BookingStatus } from "@prisma/client";

export const createBookingSchema = z.object({
  hallId: z.string().uuid("Valid Hall ID required"),
  customerName: z.string().min(2, "Customer name is required"),
  customerPhone: z.string().min(7, "Customer phone is required"),
  customerEmail: z.string().email().optional().nullable().or(z.literal("")),
  customerAddress: z.string().optional().nullable(),
  eventDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Event date must be in YYYY-MM-DD format"),
  eventType: z.nativeEnum(EventType).default(EventType.BARAT),
  status: z.enum(["HOLD", "CONFIRMED"]).default("HOLD"),
  totalAmount: z.coerce.number().positive("Total amount must be greater than zero"),
  advanceAmount: z.coerce.number().min(0, "Advance amount cannot be negative").default(0),
  holdHours: z.coerce.number().int().refine((h) => h === 24 || h === 48, {
    message: "Hold duration must be 24 or 48 hours",
  }).optional().default(24),
  session: z.enum(["DAY", "NIGHT"]).optional().default("DAY"),
  notes: z.string().optional().nullable(),
}).refine((data) => data.advanceAmount <= data.totalAmount, {
  message: "Advance amount cannot exceed total amount",
  path: ["advanceAmount"],
});

export const updateBookingSchema = z.object({
  eventDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  eventType: z.nativeEnum(EventType).optional(),
  totalAmount: z.coerce.number().positive().optional(),
  notes: z.string().optional().nullable(),
});

export const confirmBookingSchema = z.object({
  advanceAmount: z.coerce.number().min(0).optional(),
  notes: z.string().optional().nullable(),
});

export const extendHoldSchema = z.object({
  additionalHours: z.coerce.number().int().positive().max(72).default(24),
});

export const blockDateSchema = z.object({
  hallId: z.string().uuid("Valid Hall ID required"),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be YYYY-MM-DD"),
  reason: z.string().min(2, "Reason for blocking date is required"),
  session: z.enum(["DAY", "NIGHT", "BOTH"]).optional().default("BOTH"),
});
