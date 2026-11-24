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
      return (res as any)?.reports as HallIncomeReport[];
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
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">Income & Financial Reports</h1>
          <p className="text-sm text-gray-500">Hall revenue breakdown, collection ledger, and pending balances</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => window.print()}
            className="inline-flex items-center gap-2 rounded-xl border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50 shadow-sm transition"
          >
            <Printer className="h-4 w-4" />
            Print Report
          </button>
          <button
            onClick={handleExportCSV}
            className="inline-flex items-center gap-2 rounded-xl bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 shadow-sm transition"
          >
            <Download className="h-4 w-4" />
            Export CSV
          </button>
        </div>
      </div>

      {/* Aggregate Financial Metrics */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Total Agreed Rent</span>
          <p className="mt-2 text-3xl font-extrabold text-gray-900">
            PKR {Number(overviewData?.totalRevenue || 0).toLocaleString()}
          </p>
          <p className="mt-1 text-xs text-gray-500">Total volume of all confirmed bookings</p>
        </div>

        <div className="rounded-2xl border border-green-200 bg-green-50/50 p-6 shadow-sm">
          <span className="text-xs font-semibold text-green-700 uppercase tracking-wider">Cash Collected (Advance)</span>
          <p className="mt-2 text-3xl font-extrabold text-green-800">
            PKR {Number(overviewData?.advanceReceived || 0).toLocaleString()}
          </p>
          <p className="mt-1 text-xs text-green-600">Deposits received in cash / bank</p>
        </div>

        <div className="rounded-2xl border border-amber-200 bg-amber-50/50 p-6 shadow-sm">
          <span className="text-xs font-semibold text-amber-700 uppercase tracking-wider">Pending Balance</span>
          <p className="mt-2 text-3xl font-extrabold text-amber-800">
            PKR {Number(overviewData?.remainingPayments || 0).toLocaleString()}
          </p>
          <p className="mt-1 text-xs text-amber-600">Remaining receivable on event day</p>
        </div>
      </div>

      {/* Monthly Chart */}
      <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <h3 className="font-bold text-gray-900 mb-6">Past 6 Months Income Trend</h3>
        <div className="space-y-4">
          {overviewData?.monthlyChart && overviewData.monthlyChart.length > 0 ? (
            overviewData.monthlyChart.map((m, idx) => {
              const maxRev = Math.max(...overviewData.monthlyChart.map((x) => x.revenue || 1));
              const pct = Math.max(5, Math.round(((m.revenue || 0) / maxRev) * 100));
              return (
                <div key={idx} className="space-y-1.5">
                  <div className="flex justify-between text-xs font-medium">
                    <span className="text-gray-700">{m.month}</span>
                    <span className="text-gray-900 font-bold">
                      PKR {Number(m.revenue || 0).toLocaleString()} ({m.bookings} events)
                    </span>
                  </div>
                  <div className="h-3 w-full rounded-full bg-gray-100 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-red-600 transition-all duration-500"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })
          ) : (
            <p className="text-sm text-gray-500 py-6 text-center">No monthly history recorded yet.</p>
          )}
        </div>
      </div>

      {/* Hall Revenue Breakdown Table */}
      <div className="rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden">
        <div className="border-b border-gray-200 p-5">
          <h3 className="font-bold text-gray-900">Hall-by-Hall Financial Breakdown</h3>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-gray-600">
            <thead className="bg-gray-50 text-xs font-semibold uppercase text-gray-500">
              <tr>
                <th className="px-5 py-3.5">Hall Name</th>
                <th className="px-5 py-3.5">City</th>
                <th className="px-5 py-3.5 text-center">Confirmed Events</th>
                <th className="px-5 py-3.5 text-right">Gross Rent (PKR)</th>
                <th className="px-5 py-3.5 text-right">Collected (PKR)</th>
                <th className="px-5 py-3.5 text-right">Balance Due (PKR)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {hallsLoading ? (
                <tr>
                  <td colSpan={6} className="px-5 py-8 text-center text-gray-400">
                    Loading performance data...
                  </td>
                </tr>
              ) : hallsData && hallsData.length > 0 ? (
                hallsData.map((r) => (
                  <tr key={r.hallId} className="hover:bg-gray-50/50">
                    <td className="px-5 py-4 font-bold text-gray-900">{r.hallName}</td>
                    <td className="px-5 py-4 text-xs text-gray-500">{r.city}</td>
                    <td className="px-5 py-4 text-center font-semibold text-gray-800">{r.totalBookings}</td>
                    <td className="px-5 py-4 text-right font-bold text-gray-900">
                      PKR {Number(r.totalRevenue).toLocaleString()}
                    </td>
                    <td className="px-5 py-4 text-right font-semibold text-green-700">
                      PKR {Number(r.totalCollected).toLocaleString()}
                    </td>
                    <td className="px-5 py-4 text-right font-semibold text-amber-700">
                      PKR {Number(r.pendingBalance).toLocaleString()}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="px-5 py-8 text-center text-gray-400">
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
