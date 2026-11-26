import api from "./axios";

export interface SuperAdminOverview {
  role: "SUPER_ADMIN";
  totalHalls: number;
  approvedHalls: number;
  pendingHalls: number;
  totalOwners: number;
  approvedOwners: number;
  pendingOwners: number;
  totalBookings: number;
  confirmedBookings: number;
  holdBookings: number;
  bookingsThisMonth: number;
  totalRevenue: number;
  totalAdvanceReceived: number;
  totalRemainingAmount: number;
  totalCommissionEarned: number;
  monthlyRevenueChart: { month: string; revenue: number; bookings: number }[];
  recentBookings: any[];
  recentOwners: any[];
}

export interface OwnerOverview {
  role: "HALL_OWNER";
  myHallsCount: number;
  totalBookings: number;
  confirmedBookings: number;
  holdBookings: number;
  todayBookings: number;
  upcomingBookings: number;
  totalRevenue: number;
  advanceReceived: number;
  remainingPayments: number;
  monthlyIncome: number;
  monthlyChart: { month: string; revenue: number; bookings: number }[];
  recentBookings: any[];
  upcomingEvents: any[];
}

export interface HallIncomeReport {
  hallId: string;
  hallName: string;
  city: string;
  totalBookings: number;
  totalRevenue: number;
  totalCollected: number;
  pendingBalance: number;
}

export interface CommissionReport {
  currentCommissionRate: number;
  totalCommissionAllTime: number;
  thisMonthCommission: number;
  byHall: {
    hallId: string;
    hallName: string;
    ownerName: string;
    confirmedBookings: number;
    totalRevenue: number;
    commissionEarned: number;
  }[];
}

export const reportApi = {
  async getOverview() {
    return api.get<SuperAdminOverview | OwnerOverview>("/reports/overview");
  },

  async getHallIncome() {
    return api.get<{ reports: HallIncomeReport[] }>("/reports/halls");
  },

  async getCommissionReports() {
    return api.get<{ report: CommissionReport }>("/reports/commission");
  },
};
