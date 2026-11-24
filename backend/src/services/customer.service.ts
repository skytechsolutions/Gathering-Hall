import { prisma } from "../config/prisma.js";
import { Role, Prisma } from "@prisma/client";
import { AuthPayload } from "../types/user.types.js";

export class CustomerService {
  async getAllCustomers(
    params: { search?: string; page?: number; limit?: number },
    user: AuthPayload
  ) {
    const page = Math.max(params.page || 1, 1);
    const limit = Math.min(Math.max(params.limit || 20, 1), 100);
    const skip = (page - 1) * limit;

    const where: Prisma.CustomerWhereInput = {};

    // STRICT RBAC: Hall Owner only accesses their own customers
    if (user.role === Role.HALL_OWNER) {
      where.ownerId = user.userId;
    }

    if (params.search) {
      const q = params.search.trim();
      where.OR = [
        { name: { contains: q, mode: "insensitive" } },
        { phone: { contains: q, mode: "insensitive" } },
        { email: { contains: q, mode: "insensitive" } },
      ];
    }

    const [total, customers] = await Promise.all([
      prisma.customer.count({ where }),
      prisma.customer.findMany({
        where,
        skip,
        take: limit,
        orderBy: { updatedAt: "desc" },
        include: {
          _count: {
            select: { bookings: true },
          },
        },
      }),
    ]);

    // Aggregate ledger metrics for each customer
    const customersWithLedger = await Promise.all(
      customers.map(async (c) => {
        const bookings = await prisma.booking.findMany({
          where: { customerId: c.id },
          select: { totalAmount: true, advanceAmount: true, remainingAmount: true, status: true },
        });

        let totalBookingsAmount = 0;
        let totalAdvancePaid = 0;
        let totalRemaining = 0;

        for (const b of bookings) {
          if (b.status === "CONFIRMED" || b.status === "HOLD") {
            totalBookingsAmount += Number(b.totalAmount);
            totalAdvancePaid += Number(b.advanceAmount);
            totalRemaining += Number(b.remainingAmount);
          }
        }

        return {
          id: c.id,
          name: c.name,
          phone: c.phone,
          email: c.email,
          address: c.address,
          totalBookingsCount: c._count.bookings,
          totalBookingsAmount,
          totalAdvancePaid,
          totalRemaining,
          createdAt: c.createdAt,
        };
      })
    );

    return {
      customers: customersWithLedger,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getCustomerById(id: string, user: AuthPayload) {
    const customer = await prisma.customer.findUnique({
      where: { id },
      include: {
        bookings: {
          orderBy: { eventDate: "desc" },
          include: {
            hall: { select: { id: true, name: true, city: true } },
            payments: { orderBy: { createdAt: "desc" } },
          },
        },
      },
    });

    if (!customer) {
      throw new Error("Customer not found.");
    }

    // STRICT OWNERSHIP CHECK
    if (user.role === Role.HALL_OWNER && customer.ownerId !== user.userId) {
      throw new Error("Access denied: You do not have permission to view this customer.");
    }

    // Calculate customer ledger totals
    let totalBilled = 0;
    let totalPaid = 0;
    let totalRemaining = 0;

    for (const b of customer.bookings) {
      if (b.status === "CONFIRMED" || b.status === "HOLD") {
        totalBilled += Number(b.totalAmount);
        totalPaid += Number(b.advanceAmount);
        totalRemaining += Number(b.remainingAmount);
      }
    }

    return {
      customer: {
        id: customer.id,
        name: customer.name,
        phone: customer.phone,
        email: customer.email,
        address: customer.address,
        referenceName: customer.referenceName,
        referencePhone: customer.referencePhone,
        notes: customer.notes,
        createdAt: customer.createdAt,
      },
      ledger: {
        totalBilled,
        totalPaid,
        totalRemaining,
        bookingsCount: customer.bookings.length,
      },
      bookings: customer.bookings,
    };
  }

  async getCustomerBookings(id: string, user: AuthPayload) {
    const customer = await this.getCustomerById(id, user);
    return customer.bookings;
  }
}

export const customerService = new CustomerService();
