import { prisma } from "../config/prisma.js";
import { PaymentMethod, PaymentStatus, Role } from "@prisma/client";
import { AuthPayload } from "../types/user.types.js";

export class PaymentService {
  async addPayment(
    data: {
      bookingId: string;
      amount: number;
      method?: PaymentMethod;
      transactionReference?: string | null;
      notes?: string | null;
      paymentDate?: Date | string | null;
    },
    user: AuthPayload
  ) {
    if (data.amount <= 0) {
      throw new Error("Payment amount must be greater than zero.");
    }

    const booking = await prisma.booking.findUnique({
      where: { id: data.bookingId },
      include: {
        hall: true,
        payments: {
          where: { status: PaymentStatus.COMPLETED },
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

    // Calculate current completed payments
    const currentPaid = booking.payments.reduce((acc, p) => acc + Number(p.amount), 0);
    const total = Number(booking.totalAmount);
    const newTotalPaid = currentPaid + data.amount;

    // Prevent overpayment
    if (newTotalPaid > total) {
      const maxAllowed = total - currentPaid;
      throw new Error(
        `Overpayment not allowed: Remaining balance is ${maxAllowed}. You cannot pay ${data.amount}.`
      );
    }

    const newRemaining = total - newTotalPaid;

    let parsedPaymentDate = new Date();
    if (data.paymentDate) {
      const d = new Date(data.paymentDate);
      if (!isNaN(d.getTime())) {
        parsedPaymentDate = d;
      }
    }

    const payment = await prisma.$transaction(async (tx) => {
      const p = await tx.payment.create({
        data: {
          bookingId: data.bookingId,
          amount: data.amount,
          method: data.method || PaymentMethod.CASH,
          status: PaymentStatus.COMPLETED,
          transactionReference: data.transactionReference?.trim() || null,
          notes: data.notes?.trim() || null,
          paymentDate: parsedPaymentDate,
        },
      });

      // Update booking financial totals
      await tx.booking.update({
        where: { id: data.bookingId },
        data: {
          advanceAmount: newTotalPaid,
          remainingAmount: newRemaining,
        },
      });

      await tx.bookingHistory.create({
        data: {
          bookingId: data.bookingId,
          action: "PAYMENT_RECORDED",
          performedBy: user.userId,
          notes: `Payment of ${data.amount} via ${data.method || "CASH"} received by ${user.name}. New remaining balance: ${newRemaining}.`,
        },
      });

      return p;
    });

    await prisma.auditLog.create({
      data: {
        userId: user.userId,
        action: "PAYMENT_RECORDED",
        details: { paymentId: payment.id, bookingId: data.bookingId, amount: data.amount },
      },
    });

    return payment;
  }

  async getAllPayments(
    params: { bookingId?: string; page?: number; limit?: number },
    user: AuthPayload
  ) {
    const page = Math.max(params.page || 1, 1);
    const limit = Math.min(Math.max(params.limit || 20, 1), 100);
    const skip = (page - 1) * limit;

    const where: any = {};
    if (user.role === Role.HALL_OWNER) {
      where.booking = { hall: { ownerId: user.userId } };
    }
    if (params.bookingId) {
      where.bookingId = params.bookingId;
    }

    const [total, payments] = await Promise.all([
      prisma.payment.count({ where }),
      prisma.payment.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: {
          booking: {
            select: {
              id: true,
              bookingNumber: true,
              customerName: true,
              customerPhone: true,
              eventDate: true,
              totalAmount: true,
              advanceAmount: true,
              remainingAmount: true,
              status: true,
              notes: true,
              hall: { select: { id: true, name: true, city: true } },
            },
          },
        },
      }),
    ]);

    return {
      payments,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async refundPayment(id: string, reason: string, user: AuthPayload) {
    const payment = await prisma.payment.findUnique({
      where: { id },
      include: {
        booking: { include: { hall: true } },
      },
    });

    if (!payment) {
      throw new Error("Payment record not found.");
    }

    if (user.role === Role.HALL_OWNER && payment.booking.hall.ownerId !== user.userId) {
      throw new Error("Access denied.");
    }

    if (payment.status === PaymentStatus.REFUNDED) {
      throw new Error("Payment has already been refunded.");
    }

    const refunded = await prisma.$transaction(async (tx) => {
      const updatedP = await tx.payment.update({
        where: { id },
        data: { status: PaymentStatus.REFUNDED, notes: `Refunded: ${reason}` },
      });

      // Recalculate booking remaining balance
      const allActivePayments = await tx.payment.findMany({
        where: { bookingId: payment.bookingId, status: PaymentStatus.COMPLETED },
      });
      const totalPaid = allActivePayments.reduce((acc, p) => acc + Number(p.amount), 0);
      const total = Number(payment.booking.totalAmount);
      const remaining = total - totalPaid;

      await tx.booking.update({
        where: { id: payment.bookingId },
        data: {
          advanceAmount: totalPaid,
          remainingAmount: remaining,
        },
      });

      await tx.bookingHistory.create({
        data: {
          bookingId: payment.bookingId,
          action: "PAYMENT_REFUNDED",
          performedBy: user.userId,
          notes: `Refunded payment of ${payment.amount}. Reason: ${reason}. Updated remaining: ${remaining}.`,
        },
      });

      return updatedP;
    });

    return refunded;
  }
}

export const paymentService = new PaymentService();
