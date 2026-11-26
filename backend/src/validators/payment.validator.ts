import { z } from "zod";
import { PaymentMethod } from "@prisma/client";

export const createPaymentSchema = z.object({
  bookingId: z.string().uuid("Valid Booking ID is required"),
  amount: z.coerce.number().positive("Payment amount must be greater than zero"),
  method: z.nativeEnum(PaymentMethod).default(PaymentMethod.CASH),
  transactionReference: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
});
