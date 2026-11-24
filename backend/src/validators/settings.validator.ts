import { z } from "zod";

export const updateCommissionSchema = z.object({
  rate: z.coerce
    .number()
    .min(0, "Commission rate cannot be negative")
    .max(100, "Commission rate cannot exceed 100%"),
});
