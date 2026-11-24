import { prisma } from "../config/prisma.js";
import { BookingStatus, Role, OwnerStatus } from "@prisma/client";
import { AuthPayload } from "../types/user.types.js";

export class ReportService {
  async getOverview(user: AuthPayload) {
    const today = new Date().toISOString().slice(0, 10);
    const currentYear = new Date().getFullYear();
    const currentMonthPrefix = new Date().toISOString().slice(0, 7); // "YYYY-MM"

    if (user.role === Role.SUPER_ADMIN) {
      // SUPER ADMIN GLOBAL OVERVIEW
      const [
        totalHalls,
        approvedHalls,
        pendingHalls,
        totalOwners,
        approvedOwners,
        pendingOwners,
        totalBookings,
        confirmedBookings,
        holdBookings,
        bookingsThisMonth,
      ] = await Promise.all([
        prisma.hall.count(),
        prisma.hall.count({ where: { status: "APPROVED" } }),
        prisma.hall.count({ where: { status: "PENDING" } }),
        prisma.user.count({ where: { role: Role.HALL_OWNER } }),
        prisma.user.count({ where: { role: Role.HALL_OWNER, status: OwnerStatus.APPROVED } }),
        prisma.user.count({ where: { role: Role.HALL_OWNER, status: OwnerStatus.PENDING } }),
        prisma.booking.count(),
        prisma.booking.count({ where: { status: BookingStatus.CONFIRMED } }),
        prisma.booking.count({ where: { status: BookingStatus.HOLD } }),
        prisma.booking.count({ where: { eventDate: { startsWith: currentMonthPrefix } } }),
      ]);

      // Financials
      const allConfirmedBookings = await prisma.booking.findMany({
        where: { status: BookingStatus.CONFIRMED },
        select: {
          totalAmount: true,
          advanceAmount: true,
          remainingAmount: true,
          commissionAmount: true,
        },
      });

      let totalRevenue = 0;
      let totalAdvance = 0;
      let totalRemaining = 0;
      let totalCommission = 0;

      for (const b of allConfirmedBookings) {
        totalRevenue += Number(b.totalAmount);
        totalAdvance += Number(b.advanceAmount);
        totalRemaining += Number(b.remainingAmount);
        totalCommission += Number(b.commissionAmount);
      }

      // Monthly revenue chart (past 6 months)
      const monthlyChart = await this.getMonthlyRevenueChart();

      // Recent 5 bookings
      const recentBookings = await prisma.booking.findMany({
        take: 5,
        orderBy: { createdAt: "desc" },
        include: {
          hall: { select: { name: true } },
        },
      });

      // Recent 5 registered owners
      const recentOwners = await prisma.user.findMany({
        where: { role: Role.HALL_OWNER },
        take: 5,
        orderBy: { createdAt: "desc" },
        select: { id: true, name: true, email: true, phone: true, status: true, createdAt: true },
      });

      return {
        role: Role.SUPER_ADMIN,
        totalHalls,
        approvedHalls,
        pendingHalls,
        totalOwners,
        approvedOwners,
        pendingOwners,
        totalBookings,
        confirmedBookings,
        holdBookings,
        bookingsThisMonth,
        totalRevenue,
        totalAdvanceReceived: totalAdvance,
        totalRemainingAmount: totalRemaining,
        totalCommissionEarned: totalCommission,
        monthlyChart,
        recentBookings,
        recentOwners,
      };
    } else {
      // HALL OWNER DASHBOARD OVERVIEW (Strictly Own Data)
      const ownerId = user.userId;

      const [
        myHallsCount,
        totalBookings,
        confirmedBookings,
        holdBookings,
        todayBookings,
        upcomingBookings,
      ] = await Promise.all([
        prisma.hall.count({ where: { ownerId } }),
        prisma.booking.count({ where: { hall: { ownerId } } }),
        prisma.booking.count({ where: { hall: { ownerId }, status: BookingStatus.CONFIRMED } }),
        prisma.booking.count({ where: { hall: { ownerId }, status: BookingStatus.HOLD } }),
        prisma.booking.count({ where: { hall: { ownerId }, eventDate: today, status: { in: ["HOLD", "CONFIRMED"] } } }),
        prisma.booking.count({ where: { hall: { ownerId }, eventDate: { gte: today }, status: { in: ["HOLD", "CONFIRMED"] } } }),
      ]);

      const ownerBookings = await prisma.booking.findMany({
        where: { hall: { ownerId }, status: BookingStatus.CONFIRMED },
        select: {
          totalAmount: true,
          advanceAmount: true,
          remainingAmount: true,
          eventDate: true,
        },
      });

      let totalRevenue = 0;
      let advanceReceived = 0;
      let remainingPayments = 0;
      let monthlyIncome = 0;

      for (const b of ownerBookings) {
        totalRevenue += Number(b.totalAmount);
        advanceReceived += Number(b.advanceAmount);
        remainingPayments += Number(b.remainingAmount);
        if (b.eventDate.startsWith(currentMonthPrefix)) {
          monthlyIncome += Number(b.totalAmount);
        }
      }

      const monthlyChart = await this.getMonthlyRevenueChart(ownerId);

      const recentBookings = await prisma.booking.findMany({
        where: { hall: { ownerId } },
        take: 5,
        orderBy: { createdAt: "desc" },
        include: { hall: { select: { name: true } } },
      });

      const upcomingEvents = await prisma.booking.findMany({
        where: {
          hall: { ownerId },
          eventDate: { gte: today },
          status: { in: [BookingStatus.HOLD, BookingStatus.CONFIRMED] },
        },
        take: 5,
        orderBy: { eventDate: "asc" },
        include: { hall: { select: { name: true } } },
      });

      return {
        role: Role.HALL_OWNER,
        myHallsCount,
        totalBookings,
        confirmedBookings,
        holdBookings,
        todayBookings,
        upcomingBookings,
        totalRevenue,
        advanceReceived,
        remainingPayments,
        monthlyIncome,
        monthlyChart,
        recentBookings,
        upcomingEvents,
      };
    }
  }

  private async getMonthlyRevenueChart(ownerId?: string) {
    const months: { label: string; yearMonth: string }[] = [];
    const now = new Date();

    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const label = d.toLocaleString("default", { month: "short" });
      const yearMonth = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      months.push({ label, yearMonth });
    }

    const where: any = { status: BookingStatus.CONFIRMED };
    if (ownerId) {
      where.hall = { ownerId };
    }

    const bookings = await prisma.booking.findMany({
      where,
      select: { eventDate: true, totalAmount: true },
    });

    return months.map((m) => {
      const monthBookings = bookings.filter((b) => b.eventDate.startsWith(m.yearMonth));
      const revenue = monthBookings.reduce((acc, b) => acc + Number(b.totalAmount), 0);
      return {
        month: m.label,
        yearMonth: m.yearMonth,
        revenue,
        bookingsCount: monthBookings.length,
      };
    });
  }

  async getCommissionReports() {
    const confirmedBookings = await prisma.booking.findMany({
      where: { status: BookingStatus.CONFIRMED },
      include: {
        hall: {
          select: {
            id: true,
            name: true,
            owner: { select: { id: true, name: true, email: true } },
          },
        },
      },
    });

    let totalCommission = 0;
    const hallCommissionMap: Record<string, { hallName: string; totalCommission: number; bookingsCount: number }> = {};
    const ownerCommissionMap: Record<string, { ownerName: string; email: string; totalCommission: number; bookingsCount: number }> = {};

    for (const b of confirmedBookings) {
      const comm = Number(b.commissionAmount);
      totalCommission += comm;

      // By Hall
      const hallId = b.hall.id;
      if (!hallCommissionMap[hallId]) {
        hallCommissionMap[hallId] = { hallName: b.hall.name, totalCommission: 0, bookingsCount: 0 };
      }
      hallCommissionMap[hallId].totalCommission += comm;
      hallCommissionMap[hallId].bookingsCount += 1;

      // By Owner
      const ownerId = b.hall.owner.id;
      if (!ownerCommissionMap[ownerId]) {
        ownerCommissionMap[ownerId] = {
          ownerName: b.hall.owner.name,
          email: b.hall.owner.email,
          totalCommission: 0,
          bookingsCount: 0,
        };
      }
      ownerCommissionMap[ownerId].totalCommission += comm;
      ownerCommissionMap[ownerId].bookingsCount += 1;
    }

    return {
      totalCommissionEarned: totalCommission,
      byHall: Object.values(hallCommissionMap),
      byOwner: Object.values(ownerCommissionMap),
    };
  }

  async getHallIncomeReport(user: AuthPayload) {
    const where: any = {};
    if (user.role === Role.HALL_OWNER) {
      where.ownerId = user.userId;
    }

    const halls = await prisma.hall.findMany({
      where,
      include: {
        bookings: {
          where: { status: BookingStatus.CONFIRMED },
          select: { totalAmount: true, advanceAmount: true, remainingAmount: true },
        },
      },
    });

    return halls.map((h) => {
      let revenue = 0;
      let collected = 0;
      let pending = 0;
      for (const b of h.bookings) {
        revenue += Number(b.totalAmount);
        collected += Number(b.advanceAmount);
        pending += Number(b.remainingAmount);
      }
      return {
        hallId: h.id,
        hallName: h.name,
        city: h.city,
        confirmedBookings: h.bookings.length,
        totalRevenue: revenue,
        collectedPayments: collected,
        remainingReceivable: pending,
      };
    });
  }
}

export const reportService = new ReportService();
