import { prisma } from "../config/prisma.js";
import { HallStatus, Role, Prisma } from "@prisma/client";
import { AuthPayload } from "../types/user.types.js";

export class HallService {
  async createHall(
    data: {
      name: string;
      city: string;
      area: string;
      address: string;
      capacity: number;
      priceWeekday: number;
      priceWeekend: number;
      amenities?: string[];
      description?: string | null;
      images?: string[];
      ownerId?: string;
    },
    user: AuthPayload
  ) {
    let targetOwnerId: string;

    if (user.role === Role.SUPER_ADMIN) {
      if (!data.ownerId) {
        throw new Error("Super Admin must assign the hall to an owner (ownerId is required).");
      }
      const ownerExists = await prisma.user.findFirst({
        where: { id: data.ownerId, role: Role.HALL_OWNER },
      });
      if (!ownerExists) {
        throw new Error("Selected Hall Owner does not exist.");
      }
      targetOwnerId = data.ownerId;
    } else {
      // Hall Owner creates for themselves
      targetOwnerId = user.userId;
    }

    // Owners create halls directly in APPROVED status without admin gate
    const initialStatus = HallStatus.APPROVED;

    const hall = await prisma.hall.create({
      data: {
        ownerId: targetOwnerId,
        name: data.name.trim(),
        city: data.city.trim(),
        area: data.area.trim(),
        address: data.address.trim(),
        capacity: data.capacity,
        priceWeekday: data.priceWeekday,
        priceWeekend: data.priceWeekend,
        amenities: data.amenities || [],
        description: data.description || null,
        images: data.images || [],
        status: initialStatus,
      },
      include: {
        owner: {
          select: { id: true, name: true, email: true, phone: true },
        },
      },
    });

    await prisma.auditLog.create({
      data: {
        userId: user.userId,
        action: "HALL_CREATED",
        details: { hallId: hall.id, name: hall.name, status: hall.status, ownerId: targetOwnerId },
      },
    });

    return hall;
  }

  async getAllHalls(
    params: {
      search?: string;
      city?: string;
      status?: HallStatus;
      ownerId?: string;
      page?: number;
      limit?: number;
    },
    user: AuthPayload
  ) {
    const page = Math.max(params.page || 1, 1);
    const limit = Math.min(Math.max(params.limit || 20, 1), 100);
    const skip = (page - 1) * limit;

    const where: Prisma.HallWhereInput = {};

    // STRICT RBAC: Hall Owner can ONLY see their own halls!
    if (user.role === Role.HALL_OWNER) {
      where.ownerId = user.userId;
    } else if (params.ownerId) {
      where.ownerId = params.ownerId;
    }

    if (params.status) {
      where.status = params.status;
    }

    if (params.city) {
      where.city = { contains: params.city.trim(), mode: "insensitive" };
    }

    if (params.search) {
      const q = params.search.trim();
      where.OR = [
        { name: { contains: q, mode: "insensitive" } },
        { area: { contains: q, mode: "insensitive" } },
        { city: { contains: q, mode: "insensitive" } },
        { address: { contains: q, mode: "insensitive" } },
      ];
    }

    const [total, halls] = await Promise.all([
      prisma.hall.count({ where }),
      prisma.hall.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: {
          owner: {
            select: { id: true, name: true, email: true, phone: true },
          },
          _count: {
            select: { bookings: true },
          },
        },
      }),
    ]);

    return {
      halls,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getHallById(id: string, user: AuthPayload) {
    const hall = await prisma.hall.findUnique({
      where: { id },
      include: {
        owner: {
          select: { id: true, name: true, email: true, phone: true },
        },
        _count: {
          select: { bookings: true, blockedDates: true },
        },
      },
    });

    if (!hall) {
      throw new Error("Hall not found.");
    }

    // STRICT OWNERSHIP CHECK: Owner cannot view another owner's hall
    if (user.role === Role.HALL_OWNER && hall.ownerId !== user.userId) {
      throw new Error("Access denied: You do not own this hall.");
    }

    return hall;
  }

  async updateHall(
    id: string,
    data: {
      name?: string;
      city?: string;
      area?: string;
      address?: string;
      capacity?: number;
      priceWeekday?: number;
      priceWeekend?: number;
      amenities?: string[];
      description?: string | null;
      images?: string[];
      ownerId?: string;
    },
    user: AuthPayload
  ) {
    const existing = await prisma.hall.findUnique({ where: { id } });
    if (!existing) {
      throw new Error("Hall not found.");
    }

    // STRICT OWNERSHIP CHECK
    if (user.role === Role.HALL_OWNER && existing.ownerId !== user.userId) {
      throw new Error("Access denied: You cannot edit another owner's hall.");
    }

    const updateData: Prisma.HallUpdateInput = {
      name: data.name?.trim(),
      city: data.city?.trim(),
      area: data.area?.trim(),
      address: data.address?.trim(),
      capacity: data.capacity,
      priceWeekday: data.priceWeekday,
      priceWeekend: data.priceWeekend,
      amenities: data.amenities,
      description: data.description,
      images: data.images,
    };

    if (user.role === Role.SUPER_ADMIN && data.ownerId) {
      updateData.owner = { connect: { id: data.ownerId } };
    }

    const updated = await prisma.hall.update({
      where: { id },
      data: updateData,
      include: {
        owner: {
          select: { id: true, name: true, email: true, phone: true },
        },
      },
    });

    await prisma.auditLog.create({
      data: {
        userId: user.userId,
        action: "HALL_UPDATED",
        details: { hallId: id, name: updated.name },
      },
    });

    return updated;
  }

  async updateHallStatus(id: string, status: HallStatus, user: AuthPayload) {
    const hall = await prisma.hall.findUnique({ where: { id } });
    if (!hall) {
      throw new Error("Hall not found.");
    }

    if (user.role === Role.HALL_OWNER && hall.ownerId !== user.userId) {
      throw new Error("Access denied: You cannot modify another owner's hall.");
    }

    const updated = await prisma.hall.update({
      where: { id },
      data: { status },
      include: {
        owner: { select: { id: true, name: true, email: true } },
      },
    });

    await prisma.auditLog.create({
      data: {
        userId: user.userId,
        action: "HALL_STATUS_UPDATED",
        details: { hallId: id, oldStatus: hall.status, newStatus: status },
      },
    });

    return updated;
  }

  async deleteHall(id: string, user: AuthPayload) {
    const hall = await prisma.hall.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            bookings: {
              where: { status: { in: ["HOLD", "CONFIRMED"] } },
            },
          },
        },
      },
    });

    if (!hall) {
      throw new Error("Hall not found.");
    }

    if (user.role === Role.HALL_OWNER && hall.ownerId !== user.userId) {
      throw new Error("Access denied: You cannot delete another owner's hall.");
    }

    // Dependency protection: cannot delete if active bookings exist
    if (hall._count.bookings > 0) {
      throw new Error(
        `Cannot delete hall: It has ${hall._count.bookings} active (Hold/Confirmed) booking(s). Please cancel or complete them first.`
      );
    }

    await prisma.hall.delete({ where: { id } });

    await prisma.auditLog.create({
      data: {
        userId: user.userId,
        action: "HALL_DELETED",
        details: { hallId: id, name: hall.name },
      },
    });
  }
}

export const hallService = new HallService();
