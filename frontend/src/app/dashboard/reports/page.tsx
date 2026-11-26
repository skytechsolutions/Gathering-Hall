"use client";

import { useQuery } from "@tanstack/react-query";
import { reportApi, HallIncomeReport, OwnerOverview } from "@/services/api/report.api";
import {
  BarChart3,
  Download,
  Printer,
  DollarSign,
  TrendingUp,
  Building2,
  Calendar,
  Sparkles,
  ArrowUpRight,
} from "lucide-react";

export default function OwnerReportsPage() {
  // Fetch overview metrics
  const { data: overviewData, isLoading: overviewLoading } = useQuery<OwnerOverview>({
    queryKey: ["owner-overview-reports"],
    queryFn: async () => {
      const res = await reportApi.getOverview();
      return res as OwnerOverview;
    },
  });

  // Fetch hall-by-hall breakdown
  const { data: hallsData, isLoading: hallsLoading } = useQuery({
    queryKey: ["owner-hall-income-breakdown"],
    queryFn: async () => {
      const res = await reportApi.getHallIncome();
      const list = (res as any)?.reports ?? (res as any)?.halls ?? (Array.isArray(res) ? res : []);
      return (list || []) as HallIncomeReport[];
    },
  });

  const handleExportCSV = () => {
    if (!hallsData || hallsData.length === 0) return;
    const headers = ["Hall Name", "City", "Total Bookings", "Total Revenue (PKR)", "Advance Received (PKR)", "Balance Due (PKR)"];
    const rows = hallsData.map((r) => [
      `"${r.hallName}"`,
      `"${r.city}"`,
      r.totalBookings,
      r.totalRevenue,
      r.totalCollected,
      r.pendingBalance,
    ]);
    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Hall_Owner_Revenue_Statement_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between bg-white rounded-2xl p-4 sm:p-6 border border-gray-100">
        <div>
          <h1 className="text-xl sm:text-3xl font-black tracking-tight text-gray-900">Income & Financial Reports</h1>
          <p className="text-xs sm:text-sm text-gray-500 font-medium mt-0.5 sm:mt-1">
            Hall revenue breakdown, collection ledger, and pending balances across all venues
          </p>
        </div>
        <div className="grid grid-cols-2 gap-2 sm:flex sm:items-center sm:gap-3 w-full sm:w-auto">
          <button
            onClick={() => window.print()}
            className="flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs sm:text-sm font-bold text-gray-700 hover:bg-gray-50 hover:border-gray-300 transition cursor-pointer"
          >
            <Printer className="h-4 w-4" />
            Print Report
          </button>
          <button
            onClick={handleExportCSV}
            className="flex items-center justify-center gap-2 rounded-xl bg-[#3b3c44] px-4 py-2.5 text-xs sm:text-sm font-bold text-white hover:bg-[#2b2c33] active:scale-95 transition cursor-pointer"
          >
            <Download className="h-4 w-4" />
            Export CSV
          </button>
        </div>
      </div>

      {/* Aggregate Financial Metrics */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-slate-200/80 bg-white p-6">
          <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Total Agreed Rent</span>
          <p className="mt-2 text-3xl font-black text-gray-900">
            PKR {Number(overviewData?.totalRevenue || 0).toLocaleString()}
          </p>
          <p className="mt-1 text-xs text-gray-500 font-medium">Total volume across all confirmed bookings</p>
        </div>

        <div className="rounded-2xl border border-emerald-200/60 bg-emerald-50/40 p-6">
          <span className="text-xs font-bold text-emerald-800 uppercase tracking-wider">Cash Collected (Advance)</span>
          <p className="mt-2 text-3xl font-black text-emerald-900">
            PKR {Number(overviewData?.advanceReceived || 0).toLocaleString()}
          </p>
          <p className="mt-1 text-xs text-emerald-700 font-medium">Deposits received in cash / bank</p>
        </div>

        <div className="rounded-2xl border border-amber-200/60 bg-amber-50/40 p-6">
          <span className="text-xs font-bold text-amber-800 uppercase tracking-wider">Pending Balance</span>
          <p className="mt-2 text-3xl font-black text-amber-900">
            PKR {Number(overviewData?.remainingPayments || 0).toLocaleString()}
          </p>
          <p className="mt-1 text-xs text-amber-700 font-medium">Remaining receivable on event day</p>
        </div>
      </div>

      {/* Monthly Chart */}
      <div className="rounded-2xl border border-slate-200/80 bg-white p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="font-extrabold text-lg text-gray-900">Past 6 Months Income Trend</h3>
            <p className="text-xs text-gray-400 font-medium">Monthly revenue generated from completed events</p>
          </div>
          <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-slate-100 text-[#3b3c44] border border-slate-200">
            Revenue Performance
          </span>
        </div>

        <div className="space-y-4">
          {overviewData?.monthlyChart && overviewData.monthlyChart.length > 0 ? (
            overviewData.monthlyChart.map((m, idx) => {
              const maxRev = Math.max(...overviewData.monthlyChart.map((x) => x.revenue || 1));
              const pct = Math.max(8, Math.round(((m.revenue || 0) / maxRev) * 100));
              return (
                <div key={idx} className="space-y-1.5">
                  <div className="flex justify-between text-xs font-semibold">
                    <span className="text-gray-700">{m.month}</span>
                    <span className="text-gray-900 font-bold">
                      PKR {Number(m.revenue || 0).toLocaleString()}{" "}
                      <span className="text-gray-400 font-normal">({m.bookings} events)</span>
                    </span>
                  </div>
                  <div className="h-3 w-full rounded-xl bg-gray-100 overflow-hidden">
                    <div
                      className="h-full rounded-xl bg-gradient-to-r from-[#3b3c44] to-[#25262c] transition-all duration-500"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })
          ) : (
            <p className="text-sm text-gray-400 py-10 text-center font-medium">No monthly history recorded yet.</p>
          )}
        </div>
      </div>

      {/* Hall Revenue Breakdown Table */}
      <div className="rounded-2xl border border-slate-200/80 bg-white overflow-hidden">
        <div className="border-b border-gray-100 p-5">
          <h3 className="font-extrabold text-lg text-gray-900">Hall-by-Hall Financial Breakdown</h3>
          <p className="text-xs text-gray-400 font-medium">Revenue, collections, and pending dues per venue</p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-gray-600">
            <thead className="bg-gray-50/70 text-xs font-bold uppercase text-gray-400 border-b border-gray-100">
              <tr>
                <th className="px-5 py-3.5">Hall Name</th>
                <th className="px-5 py-3.5">City</th>
                <th className="px-5 py-3.5 text-center">Confirmed Events</th>
                <th className="px-5 py-3.5 text-right">Gross Rent (PKR)</th>
                <th className="px-5 py-3.5 text-right">Collected (PKR)</th>
                <th className="px-5 py-3.5 text-right">Balance Due (PKR)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100/80">
              {hallsLoading ? (
                <tr>
                  <td colSpan={6} className="px-5 py-12 text-center text-gray-400">
                    <div className="flex justify-center">
                      <div className="h-7 w-7 animate-spin rounded-full border-3 border-[#3b3c44] border-t-transparent" />
                    </div>
                  </td>
                </tr>
              ) : hallsData && hallsData.length > 0 ? (
                hallsData.map((r) => (
                  <tr key={r.hallId} className="hover:bg-slate-100/50 transition">
                    <td className="px-5 py-4 font-bold text-gray-900">{r.hallName}</td>
                    <td className="px-5 py-4 text-xs font-semibold text-gray-500">{r.city}</td>
                    <td className="px-5 py-4 text-center">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-slate-100 text-[#3b3c44] border border-slate-200">
                        {r.totalBookings}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-right font-black text-gray-900">
                      PKR {Number(r.totalRevenue).toLocaleString()}
                    </td>
                    <td className="px-5 py-4 text-right font-bold text-emerald-700">
                      PKR {Number(r.totalCollected).toLocaleString()}
                    </td>
                    <td className="px-5 py-4 text-right font-bold text-amber-700">
                      PKR {Number(r.pendingBalance).toLocaleString()}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="px-5 py-10 text-center text-gray-400 font-medium">
                    No financial records available yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
