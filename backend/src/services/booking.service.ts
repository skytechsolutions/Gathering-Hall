import { prisma } from "../config/prisma.js";
import { BookingStatus, EventType, Role, PaymentMethod, PaymentStatus, Prisma } from "@prisma/client";
import { AuthPayload } from "../types/user.types.js";

export class BookingService {
  /**
   * Helper to generate a unique booking number: e.g. BK-20261120-XXXX
   */
  private generateBookingNumber(): string {
    const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, "");
    const randomHex = Math.floor(1000 + Math.random() * 9000).toString();
    return `BK-${dateStr}-${randomHex}`;
  }

  async createBooking(
    data: {
      hallId: string;
      customerName: string;
      customerPhone: string;
      customerEmail?: string | null;
      customerAddress?: string | null;
      eventDate: string; // "YYYY-MM-DD"
      eventType?: EventType;
      status?: "HOLD" | "CONFIRMED";
      totalAmount: number;
      advanceAmount?: number;
      holdHours?: number; // 24 or 48
      notes?: string | null;
    },
    user: AuthPayload
  ) {
    const advance = Math.max(data.advanceAmount || 0, 0);
    const total = data.totalAmount;

    if (total <= 0) {
      throw new Error("Total amount must be greater than zero.");
    }
    if (advance > total) {
      throw new Error("Advance amount cannot exceed total amount.");
    }
    const remaining = total - advance;

    // Verify hall and ownership
    const hall = await prisma.hall.findUnique({
      where: { id: data.hallId },
      include: { owner: true },
    });
    if (!hall) {
      throw new Error("Hall not found.");
    }

    if (user.role === Role.HALL_OWNER && hall.ownerId !== user.userId) {
      throw new Error("Access denied: You cannot create bookings for another owner's hall.");
    }

    // Determine target owner for customer ledger
    const ownerId = hall.ownerId;

    // Calculate hold expiration if HOLD
    let holdExpiresAt: Date | null = null;
    const bookingStatus = data.status === "CONFIRMED" ? BookingStatus.CONFIRMED : BookingStatus.HOLD;
    if (bookingStatus === BookingStatus.HOLD) {
      const hours = data.holdHours === 48 ? 48 : 24;
      holdExpiresAt = new Date();
      holdExpiresAt.setHours(holdExpiresAt.getHours() + hours);
    }

    // Fetch current global commission setting
    const commissionSetting = await prisma.commissionSetting.findFirst();
    const commissionRate = commissionSetting ? Number(commissionSetting.rate) : 5.0;
    const commissionAmount = (total * commissionRate) / 100;

    // Run concurrency-safe transaction with Double-Booking Verification
    const booking = await prisma.$transaction(async (tx) => {
      // 1. Check if date is blocked in BlockedDate
      const isBlocked = await tx.blockedDate.findUnique({
        where: {
          hallId_date: {
            hallId: data.hallId,
            date: data.eventDate,
          },
        },
      });
      if (isBlocked) {
        throw new Error("Already Booked");
      }

      // 2. Check for active bookings: HOLD, CONFIRMED, BLOCKED
      const activeBooking = await tx.booking.findFirst({
        where: {
          hallId: data.hallId,
          eventDate: data.eventDate,
          status: {
            in: [BookingStatus.HOLD, BookingStatus.CONFIRMED, BookingStatus.BLOCKED],
          },
        },
      });
      if (activeBooking) {
        throw new Error("Already Booked");
      }

      // 3. Upsert Customer in the Hall Owner's customer ledger
      const phoneNorm = data.customerPhone.trim();
      let customer = await tx.customer.findUnique({
        where: {
          ownerId_phone: {
            ownerId,
            phone: phoneNorm,
          },
        },
      });

      if (!customer) {
        customer = await tx.customer.create({
          data: {
            ownerId,
            name: data.customerName.trim(),
            phone: phoneNorm,
            email: data.customerEmail?.trim() || null,
            address: data.customerAddress?.trim() || null,
          },
        });
      } else {
        // Update customer address/email if provided
        customer = await tx.customer.update({
          where: { id: customer.id },
          data: {
            name: data.customerName.trim(),
            email: data.customerEmail?.trim() || customer.email,
            address: data.customerAddress?.trim() || customer.address,
          },
        });
      }

      // 4. Create Booking
      const bookingNumber = this.generateBookingNumber();
      const newBooking = await tx.booking.create({
        data: {
          bookingNumber,
          hallId: data.hallId,
          customerId: customer.id,
          customerName: customer.name,
          customerPhone: customer.phone,
          eventDate: data.eventDate,
          eventType: data.eventType || EventType.BARAT,
          status: bookingStatus,
          totalAmount: total,
          advanceAmount: advance,
          remainingAmount: remaining,
          holdExpiresAt,
          commissionRate,
          commissionAmount,
          notes: data.notes || null,
        },
        include: {
          hall: { select: { id: true, name: true, city: true } },
          customer: true,
        },
      });

      // 5. If advance amount paid, record initial payment
      if (advance > 0) {
        await tx.payment.create({
          data: {
            bookingId: newBooking.id,
            amount: advance,
            method: PaymentMethod.CASH,
            status: PaymentStatus.COMPLETED,
            notes: "Initial advance payment",
          },
        });
      }

      // 6. Record in Booking History
      await tx.bookingHistory.create({
        data: {
          bookingId: newBooking.id,
          action: "BOOKING_CREATED",
          toStatus: bookingStatus,
          performedBy: user.userId,
          notes: `Booking created as ${bookingStatus}. Total: ${total}, Advance: ${advance}.`,
        },
      });

      return newBooking;
    });

    await prisma.auditLog.create({
      data: {
        userId: user.userId,
        action: "BOOKING_CREATED",
        details: { bookingId: booking.id, bookingNumber: booking.bookingNumber, hallId: booking.hallId, date: booking.eventDate },
      },
    });

    return booking;
  }

  async getAllBookings(
    params: {
      hallId?: string;
      ownerId?: string;
      status?: BookingStatus;
      search?: string;
      eventDate?: string;
      page?: number;
      limit?: number;
    },
    user: AuthPayload
  ) {
    const page = Math.max(params.page || 1, 1);
    const limit = Math.min(Math.max(params.limit || 20, 1), 100);
    const skip = (page - 1) * limit;

    const where: Prisma.BookingWhereInput = {};

    // STRICT RBAC: Hall Owner can ONLY see bookings for their own halls!
    if (user.role === Role.HALL_OWNER) {
      where.hall = { ownerId: user.userId };
    } else {
      if (params.ownerId) {
        where.hall = { ownerId: params.ownerId };
      }
    }

    if (params.hallId) {
      where.hallId = params.hallId;
    }

    if (params.status) {
      where.status = params.status;
    }

    if (params.eventDate) {
      where.eventDate = params.eventDate;
    }

    if (params.search) {
      const q = params.search.trim();
      where.OR = [
        { customerName: { contains: q, mode: "insensitive" } },
        { customerPhone: { contains: q, mode: "insensitive" } },
        { bookingNumber: { contains: q, mode: "insensitive" } },
      ];
    }

    const [total, bookings] = await Promise.all([
      prisma.booking.count({ where }),
      prisma.booking.findMany({
        where,
        skip,
        take: limit,
        orderBy: { eventDate: "desc" },
        include: {
          hall: {
            select: {
              id: true,
              name: true,
              city: true,
              ownerId: true,
              owner: { select: { id: true, name: true, phone: true } },
            },
          },
          customer: true,
          payments: {
            orderBy: { createdAt: "desc" },
          },
        },
      }),
    ]);

    return {
      bookings,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getBookingById(id: string, user: AuthPayload) {
    const booking = await prisma.booking.findUnique({
      where: { id },
      include: {
        hall: {
          include: {
            owner: { select: { id: true, name: true, email: true, phone: true } },
          },
        },
        customer: true,
        payments: {
          orderBy: { createdAt: "desc" },
        },
        history: {
          orderBy: { createdAt: "desc" },
        },
      },
    });

    if (!booking) {
      throw new Error("Booking not found.");
    }

    // STRICT OWNERSHIP CHECK
    if (user.role === Role.HALL_OWNER && booking.hall.ownerId !== user.userId) {
      throw new Error("Access denied: You do not own the hall for this booking.");
    }

    return booking;
  }

  async confirmBooking(
    id: string,
    data: { advanceAmount?: number; notes?: string | null },
    user: AuthPayload
  ) {
    const booking = await this.getBookingById(id, user);

    if (booking.status !== BookingStatus.HOLD) {
      throw new Error(`Only HOLD bookings can be confirmed. Current status is ${booking.status}.`);
    }

    const updated = await prisma.$transaction(async (tx) => {
      let additionalAdvance = 0;
      if (data.advanceAmount && data.advanceAmount > 0) {
        additionalAdvance = data.advanceAmount;
        const currentAdv = Number(booking.advanceAmount);
        const total = Number(booking.totalAmount);
        const newAdv = currentAdv + additionalAdvance;
        if (newAdv > total) {
          throw new Error("Total advance cannot exceed total booking amount.");
        }

        await tx.payment.create({
          data: {
            bookingId: id,
            amount: additionalAdvance,
            method: PaymentMethod.CASH,
            notes: "Confirmation payment",
          },
        });
      }

      const totalAdv = Number(booking.advanceAmount) + additionalAdvance;
      const total = Number(booking.totalAmount);
      const remaining = total - totalAdv;

      const confirmed = await tx.booking.update({
        where: { id },
        data: {
          status: BookingStatus.CONFIRMED,
          advanceAmount: totalAdv,
          remainingAmount: remaining,
          holdExpiresAt: null, // Clear expiration once confirmed
          notes: data.notes || booking.notes,
        },
      });

      await tx.bookingHistory.create({
        data: {
          bookingId: id,
          action: "BOOKING_CONFIRMED",
          fromStatus: BookingStatus.HOLD,
          toStatus: BookingStatus.CONFIRMED,
          performedBy: user.userId,
          notes: `Booking confirmed by ${user.name}.`,
        },
      });

      return confirmed;
    });

    return updated;
  }

  async cancelBooking(id: string, user: AuthPayload, reason?: string) {
    const booking = await this.getBookingById(id, user);

    if (booking.status === BookingStatus.CANCELLED) {
      throw new Error("Booking is already cancelled.");
    }

    const updated = await prisma.$transaction(async (tx) => {
      const cancelled = await tx.booking.update({
        where: { id },
        data: {
          status: BookingStatus.CANCELLED,
        },
      });

      await tx.bookingHistory.create({
        data: {
          bookingId: id,
          action: "BOOKING_CANCELLED",
          fromStatus: booking.status,
          toStatus: BookingStatus.CANCELLED,
          performedBy: user.userId,
          notes: reason ? `Cancelled. Reason: ${reason}` : `Cancelled by ${user.name}. Date released.`,
        },
      });

      return cancelled;
    });

    return updated;
  }

  async extendHold(id: string, additionalHours: number, user: AuthPayload) {
    const booking = await this.getBookingById(id, user);

    if (booking.status !== BookingStatus.HOLD) {
      throw new Error("Only HOLD bookings can have their hold duration extended.");
    }

    const currentExpiry = booking.holdExpiresAt || new Date();
    const newExpiry = new Date(currentExpiry);
    newExpiry.setHours(newExpiry.getHours() + additionalHours);

    const updated = await prisma.booking.update({
      where: { id },
      data: { holdExpiresAt: newExpiry },
    });

    await prisma.bookingHistory.create({
      data: {
        bookingId: id,
        action: "HOLD_EXTENDED",
        performedBy: user.userId,
        notes: `Hold extended by ${additionalHours} hours until ${newExpiry.toISOString()}.`,
      },
    });

    return updated;
  }

  async blockDate(
    data: { hallId: string; date: string; reason: string },
    user: AuthPayload
  ) {
    const hall = await prisma.hall.findUnique({ where: { id: data.hallId } });
    if (!hall) {
      throw new Error("Hall not found.");
    }

    if (user.role === Role.HALL_OWNER && hall.ownerId !== user.userId) {
      throw new Error("Access denied: You cannot block dates for another owner's hall.");
    }

    // Check if an active booking already exists
    const activeBooking = await prisma.booking.findFirst({
      where: {
        hallId: data.hallId,
        eventDate: data.date,
        status: { in: [BookingStatus.HOLD, BookingStatus.CONFIRMED, BookingStatus.BLOCKED] },
      },
    });
    if (activeBooking) {
      throw new Error("Cannot block date: A booking already exists on this date.");
    }

    const blocked = await prisma.blockedDate.create({
      data: {
        hallId: data.hallId,
        date: data.date,
        reason: data.reason.trim(),
        blockedBy: user.userId,
      },
    });

    await prisma.auditLog.create({
      data: {
        userId: user.userId,
        action: "DATE_BLOCKED",
        details: { hallId: data.hallId, date: data.date, reason: data.reason },
      },
    });

    return blocked;
  }

  async unblockDate(id: string, user: AuthPayload) {
    const blocked = await prisma.blockedDate.findUnique({
      where: { id },
      include: { hall: true },
    });
    if (!blocked) {
      throw new Error("Blocked date record not found.");
    }

    if (user.role === Role.HALL_OWNER && blocked.hall.ownerId !== user.userId) {
      throw new Error("Access denied.");
    }

    await prisma.blockedDate.delete({ where: { id } });

    await prisma.auditLog.create({
      data: {
        userId: user.userId,
        action: "DATE_UNBLOCKED",
        details: { hallId: blocked.hallId, date: blocked.date },
      },
    });
  }

  /**
   * Calendar Availability Source of Truth:
   * Returns calendar event records mapped into:
   * - RED: CONFIRMED
   * - YELLOW: HOLD / TOKEN
   * - BLACK: BLOCKED
   */
  async getAvailability(hallId: string, year?: number, month?: number, user?: AuthPayload) {
    const hall = await prisma.hall.findUnique({ where: { id: hallId } });
    if (!hall) {
      throw new Error("Hall not found.");
    }

    // Hall Owner access check
    if (user && user.role === Role.HALL_OWNER && hall.ownerId !== user.userId) {
      throw new Error("Access denied: You cannot view availability for another owner's hall.");
    }

    // Fetch active bookings: HOLD and CONFIRMED
    const activeBookings = await prisma.booking.findMany({
      where: {
        hallId,
        status: { in: [BookingStatus.HOLD, BookingStatus.CONFIRMED] },
      },
      include: {
        customer: { select: { name: true, phone: true } },
      },
    });

    // Fetch blocked dates
    const blockedDates = await prisma.blockedDate.findMany({
      where: { hallId },
    });

    // Map to calendar events format:
    // color: RED for CONFIRMED, YELLOW for HOLD, BLACK for BLOCKED
    const events = [
      ...activeBookings.map((b) => ({
        id: b.id,
        title: `${b.status === "CONFIRMED" ? "CONFIRMED" : "HOLD"}: ${b.customerName} (${b.eventType})`,
        start: b.eventDate,
        end: b.eventDate,
        status: b.status,
        color: b.status === "CONFIRMED" ? "RED" : "YELLOW",
        bookingNumber: b.bookingNumber,
        customerName: b.customerName,
        customerPhone: b.customerPhone,
        totalAmount: Number(b.totalAmount),
        advanceAmount: Number(b.advanceAmount),
        remainingAmount: Number(b.remainingAmount),
        holdExpiresAt: b.holdExpiresAt,
      })),
      ...blockedDates.map((bd) => ({
        id: bd.id,
        title: `BLOCKED: ${bd.reason || "Reserved"}`,
        start: bd.date,
        end: bd.date,
        status: "BLOCKED",
        color: "BLACK",
        reason: bd.reason,
      })),
    ];

    return {
      hall: { id: hall.id, name: hall.name, city: hall.city },
      events,
    };
  }
}

export const bookingService = new BookingService();
