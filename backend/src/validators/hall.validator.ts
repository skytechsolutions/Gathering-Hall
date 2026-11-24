import { z } from "zod";
import { HallStatus } from "@prisma/client";

export const createHallSchema = z.object({
  name: z.string().min(2, "Hall name is required").max(100),
  city: z.string().min(2, "City is required").max(100),
  area: z.string().min(2, "Area is required").max(100),
  address: z.string().min(5, "Address is required"),
  capacity: z.coerce.number().int().min(10, "Capacity must be at least 10"),
  priceWeekday: z.coerce.number().min(0, "Weekday price must be non-negative"),
  priceWeekend: z.coerce.number().min(0, "Weekend price must be non-negative"),
  amenities: z.array(z.string()).default([]),
  description: z.string().optional().nullable(),
  images: z.array(z.string()).default([]),
  ownerId: z.string().uuid().optional(), // only used by Super Admin; Hall Owner will use own ID
});

export const updateHallSchema = createHallSchema.partial();

export const updateHallStatusSchema = z.object({
  status: z.nativeEnum(HallStatus, {
    errorMap: () => ({ message: "Status must be PENDING, APPROVED, REJECTED, or SUSPENDED" }),
  }),
});
