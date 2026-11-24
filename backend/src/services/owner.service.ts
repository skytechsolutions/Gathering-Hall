import { prisma } from "../config/prisma.js";
import { hashPassword } from "../utils/password.js";
import { Role, OwnerStatus, Prisma } from "@prisma/client";

export class OwnerService {
  async createOwner(data: {
    name: string;
    email: string;
    phone: string;
    password: string;
    status?: OwnerStatus;
  }, adminId: string) {
    const existing = await prisma.user.findFirst({
      where: {
        OR: [{ email: data.email.toLowerCase().trim() }, { phone: data.phone.trim() }],
      },
    });

    if (existing) {
      throw new Error("An account with this email or phone number already exists.");
    }

    const hashedPassword = await hashPassword(data.password);

    const owner = await prisma.user.create({
      data: {
        name: data.name.trim(),
        email: data.email.toLowerCase().trim(),
        phone: data.phone.trim(),
        password: hashedPassword,
        role: Role.HALL_OWNER,
        status: data.status || OwnerStatus.APPROVED,
      },
    });

    await prisma.auditLog.create({
      data: {
        userId: adminId,
        action: "SUPERADMIN_CREATED_OWNER",
        details: { ownerId: owner.id, email: owner.email, status: owner.status },
      },
    });

    return {
      id: owner.id,
      name: owner.name,
      email: owner.email,
      phone: owner.phone,
      role: owner.role,
      status: owner.status,
      createdAt: owner.createdAt,
    };
  }

  async getAllOwners(params: {
    search?: string;
    status?: OwnerStatus;
    page?: number;
    limit?: number;
  }) {
    const page = Math.max(params.page || 1, 1);
    const limit = Math.min(Math.max(params.limit || 10, 1), 100);
    const skip = (page - 1) * limit;

    const where: Prisma.UserWhereInput = {
      role: Role.HALL_OWNER,
    };

    if (params.status) {
      where.status = params.status;
    }

    if (params.search) {
      const q = params.search.trim();
      where.OR = [
        { name: { contains: q, mode: "insensitive" } },
        { email: { contains: q, mode: "insensitive" } },
        { phone: { contains: q, mode: "insensitive" } },
      ];
    }

    const [total, owners] = await Promise.all([
      prisma.user.count({ where }),
      prisma.user.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          status: true,
          createdAt: true,
          _count: {
            select: {
              halls: true,
            },
          },
        },
      }),
    ]);

    // Also get booking count for each owner
    const ownersWithStats = await Promise.all(
      owners.map(async (o) => {
        const totalBookings = await prisma.booking.count({
          where: { hall: { ownerId: o.id } },
        });
        return {
          ...o,
          hallsCount: o._count.halls,
          bookingsCount: totalBookings,
        };
      })
    );

    return {
      owners: ownersWithStats,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getOwnerById(id: string) {
    const owner = await prisma.user.findFirst({
      where: { id, role: Role.HALL_OWNER },
      include: {
        halls: {
          include: {
            _count: {
              select: { bookings: true },
            },
          },
        },
      },
    });

    if (!owner) {
      throw new Error("Hall Owner not found.");
    }

    // Aggregate owner financials
    const bookings = await prisma.booking.findMany({
      where: { hall: { ownerId: id } },
      select: {
        totalAmount: true,
        advanceAmount: true,
        remainingAmount: true,
        commissionAmount: true,
        status: true,
      },
    });

    let totalRevenue = 0;
    let totalAdvance = 0;
    let totalRemaining = 0;
    let totalCommission = 0;

    for (const b of bookings) {
      if (b.status === "CONFIRMED") {
        totalRevenue += Number(b.totalAmount);
        totalAdvance += Number(b.advanceAmount);
        totalRemaining += Number(b.remainingAmount);
        totalCommission += Number(b.commissionAmount);
      }
    }

    return {
      id: owner.id,
      name: owner.name,
      email: owner.email,
      phone: owner.phone,
      status: owner.status,
      createdAt: owner.createdAt,
      halls: owner.halls,
      financials: {
        totalBookings: bookings.length,
        totalRevenue,
        totalAdvance,
        totalRemaining,
        totalCommission,
        ownerNet: totalRevenue - totalCommission,
      },
    };
  }

  async updateOwner(
    id: string,
    data: { name?: string; email?: string; phone?: string; status?: OwnerStatus },
    adminId: string
  ) {
    const owner = await prisma.user.findFirst({
      where: { id, role: Role.HALL_OWNER },
    });
    if (!owner) {
      throw new Error("Hall Owner not found.");
    }

    const updated = await prisma.user.update({
      where: { id },
      data: {
        name: data.name?.trim(),
        email: data.email?.toLowerCase().trim(),
        phone: data.phone?.trim(),
        status: data.status,
      },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        status: true,
        updatedAt: true,
      },
    });

    await prisma.auditLog.create({
      data: {
        userId: adminId,
        action: "SUPERADMIN_UPDATED_OWNER",
        details: { ownerId: id, changes: data },
      },
    });

    return updated;
  }

  async updateOwnerStatus(id: string, status: OwnerStatus, adminId: string) {
    const owner = await prisma.user.findFirst({
      where: { id, role: Role.HALL_OWNER },
    });
    if (!owner) {
      throw new Error("Hall Owner not found.");
    }

    const updated = await prisma.user.update({
      where: { id },
      data: { status },
      select: {
        id: true,
        name: true,
        email: true,
        status: true,
        updatedAt: true,
      },
    });

    await prisma.auditLog.create({
      data: {
        userId: adminId,
        action: "SUPERADMIN_UPDATED_OWNER_STATUS",
        details: { ownerId: id, oldStatus: owner.status, newStatus: status },
      },
    });

    return updated;
  }
}

export const ownerService = new OwnerService();
