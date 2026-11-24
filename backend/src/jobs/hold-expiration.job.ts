import cron from "node-cron";
import { prisma } from "../config/prisma.js";
import { BookingStatus } from "@prisma/client";

/**
 * Background job to automatically expire HOLD bookings whose holdExpiresAt timestamp has passed.
 * Runs every minute. Idempotent and concurrency-safe.
 */
export async function expireHeldBookings(): Promise<number> {
  const now = new Date();

  // Find all active HOLD bookings where holdExpiresAt has passed
  const expiredBookings = await prisma.booking.findMany({
    where: {
      status: BookingStatus.HOLD,
      holdExpiresAt: {
        lte: now,
      },
    },
    select: {
      id: true,
      bookingNumber: true,
      hallId: true,
      eventDate: true,
    },
  });

  if (expiredBookings.length === 0) {
    return 0;
  }

  let count = 0;
  for (const b of expiredBookings) {
    await prisma.$transaction(async (tx) => {
      // Re-check status inside transaction to prevent race conditions
      const current = await tx.booking.findUnique({
        where: { id: b.id },
        select: { status: true },
      });

      if (current && current.status === BookingStatus.HOLD) {
        await tx.booking.update({
          where: { id: b.id },
          data: {
            status: BookingStatus.EXPIRED,
          },
        });

        await tx.bookingHistory.create({
          data: {
            bookingId: b.id,
            action: "HOLD_EXPIRED",
            fromStatus: BookingStatus.HOLD,
            toStatus: BookingStatus.EXPIRED,
            performedBy: "SYSTEM_SCHEDULER",
            notes: `Hold reservation expired at ${now.toISOString()}. Date ${b.eventDate} has been released.`,
          },
        });

        count += 1;
      }
    });
  }

  if (count > 0) {
    console.log(`[HoldExpirationJob] Automatically expired ${count} booking hold(s) and released dates.`);
  }

  return count;
}

export function startHoldExpirationScheduler(): void {
  // Run every minute: * * * * *
  cron.schedule("* * * * *", async () => {
    try {
      await expireHeldBookings();
    } catch (err) {
      console.error("[HoldExpirationJob] Error running hold expiration check:", err);
    }
  });

  console.log("✓ Hold Expiration Scheduler initialized (running every 60 seconds)");
}
