"use client";

import { useQuery } from "@tanstack/react-query";
import { reportApi, HallIncomeReport, OwnerOverview } from "@/services/api/report.api";
import {
  Download,
  Printer,
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

  const monthlyData = overviewData?.monthlyChart && overviewData.monthlyChart.length > 0 ? overviewData.monthlyChart : [
    { month: "Jun", revenue: 0, bookings: 0 },
    { month: "Jul", revenue: 0, bookings: 0 },
    { month: "Aug", revenue: 0, bookings: 0 },
    { month: "Sep", revenue: 0, bookings: 0 },
    { month: "Oct", revenue: 0, bookings: 0 },
    { month: "Nov", revenue: Number(overviewData?.totalRevenue || 0), bookings: 1 },
  ];

  const maxMonthRev = Math.max(...monthlyData.map((m) => m.revenue || 0), 1);

  return (
    <div className="space-y-6 select-none font-sans">
      {/* ============================================================== */}
      {/* 1. TOP HEADER (Editorial luxury styling)                       */}
      {/* ============================================================== */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div>
          <h1 className="font-serif text-2xl sm:text-3xl text-[#1f2421] font-normal tracking-tight">
            Income & Financial Reports
          </h1>
          <p className="text-xs text-[#7a6f60] font-normal mt-0.5">
            Hall revenue breakdown, collection ledger, and pending balances across all venues
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <button
            onClick={() => window.print()}
            className="rounded-lg border border-[#d6cec3] bg-white px-4 py-2 text-xs sm:text-sm font-semibold text-[#1f2421] hover:bg-[#faf7f2] transition shadow-xs flex items-center gap-1.5 cursor-pointer"
          >
            <Printer className="h-4 w-4 text-[#7a6f60]" />
            <span>Print Report</span>
          </button>
          <button
            onClick={handleExportCSV}
            className="rounded-lg bg-[#1e382b] hover:bg-[#162a20] px-4 py-2 text-xs sm:text-sm font-semibold text-white transition shadow-xs flex items-center gap-1.5 active:scale-[0.98] cursor-pointer"
          >
            <Download className="h-4 w-4" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* ============================================================== */}
      {/* 2. UNIFIED 3-COLUMN AGGREGATE FINANCIAL CARD                   */}
      {/* ============================================================== */}
      <div className="rounded-2xl border border-[#e5ded4] bg-[#faf7f2] p-6 grid grid-cols-1 sm:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x divide-[#e5ded4] shadow-2xs">
        <div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-[#7a6f60]">
            TOTAL AGREED RENT
          </span>
          <p className="font-serif text-3xl sm:text-4xl text-[#1f2421] font-normal mt-2">
            PKR {Number(overviewData?.totalRevenue || 0).toLocaleString()}
          </p>
          <p className="text-xs text-[#7a6f60] font-normal mt-1">
            Total volume across confirmed bookings
          </p>
        </div>

        <div className="sm:pl-6 pt-4 sm:pt-0">
          <span className="text-[10px] font-bold uppercase tracking-wider text-[#7a6f60]">
            CASH COLLECTED (ADVANCE)
          </span>
          <p className="font-serif text-3xl sm:text-4xl text-[#1f2421] font-normal mt-2">
            PKR {Number(overviewData?.advanceReceived || 0).toLocaleString()}
          </p>
          <p className="text-xs text-[#7a6f60] font-normal mt-1">
            Deposits received in cash / bank
          </p>
        </div>

        <div className="sm:pl-6 pt-4 sm:pt-0">
          <span className="text-[10px] font-bold uppercase tracking-wider text-[#7a6f60]">
            PENDING BALANCE
          </span>
          <p className="font-serif text-3xl sm:text-4xl text-[#c28e36] font-normal mt-2">
            PKR {Number(overviewData?.remainingPayments || 0).toLocaleString()}
          </p>
          <p className="text-xs text-[#7a6f60] font-normal mt-1">
            Remaining receivable on event day
          </p>
        </div>
      </div>

      {/* ============================================================== */}
      {/* 3. MONTHLY CHART CARD (Matching Overview page)                 */}
      {/* ============================================================== */}
      <div className="rounded-2xl border border-[#e5ded4] bg-[#faf7f2] p-6 shadow-2xs">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-serif text-lg sm:text-xl text-[#1f2421] font-normal">Income by month</h2>
            <p className="text-xs text-[#7a6f60] font-normal mt-0.5">Past 6 months revenue performance</p>
          </div>
          <span className="text-xs font-semibold px-3 py-1 rounded-full border border-[#d6cec3] bg-white text-[#1f2421]">
            Confirmed Revenue
          </span>
        </div>

        <div className="mt-8 pt-4">
          <div className="h-44 sm:h-48 flex items-end justify-between gap-2 sm:gap-4 px-2 sm:px-4 border-b border-[#d6cec3]">
            {monthlyData.map((m, idx) => {
              const rev = Number(m.revenue || 0);
              const isTop = rev > 0 && rev === maxMonthRev;
              const heightPct = rev > 0 ? Math.max(12, Math.round((rev / maxMonthRev) * 100)) : 0;

              return (
                <div key={idx} className="flex-1 flex flex-col items-center justify-end h-full">
                  {isTop && (
                    <span className="text-[11px] sm:text-xs font-semibold text-[#1f2421] mb-1.5 whitespace-nowrap">
                      {rev.toLocaleString()}
                    </span>
                  )}
                  {rev > 0 ? (
                    <div
                      className="w-full max-w-[54px] bg-[#1e382b] rounded-t-lg transition-all duration-500"
                      style={{ height: `${heightPct}%` }}
                    />
                  ) : (
                    <div className="w-full max-w-[54px] h-1.5 bg-[#d6cec3] rounded-full mb-0" />
                  )}
                </div>
              );
            })}
          </div>

          <div className="flex items-center justify-between gap-2 sm:gap-4 px-2 sm:px-4 pt-2.5">
            {monthlyData.map((m, idx) => (
              <div key={idx} className="flex-1 text-center text-xs text-[#7a6f60] font-medium">
                {m.month}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ============================================================== */}
      {/* 4. HALL-BY-HALL BREAKDOWN TABLE                                */}
      {/* ============================================================== */}
      <div className="rounded-2xl border border-[#e5ded4] bg-[#faf7f2] overflow-hidden shadow-2xs">
        <div className="border-b border-[#e5ded4] p-5">
          <h3 className="font-serif text-lg text-[#1f2421] font-normal">Venue Revenue Breakdown</h3>
          <p className="text-xs text-[#7a6f60] font-normal mt-0.5">Revenue, collections, and pending dues per venue hall</p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-[#1f2421]">
            <thead className="bg-[#faf7f2] text-[11px] font-bold uppercase tracking-wider text-[#7a6f60] border-b border-[#e5ded4] select-none">
              <tr>
                <th className="px-5 py-3.5">Hall Name</th>
                <th className="px-5 py-3.5">City</th>
                <th className="px-5 py-3.5 text-center">Confirmed Events</th>
                <th className="px-5 py-3.5 text-right">Gross Rent (PKR)</th>
                <th className="px-5 py-3.5 text-right">Advance Collected</th>
                <th className="px-5 py-3.5 text-right">Balance Due</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#e5ded4]">
              {hallsLoading ? (
                <tr>
                  <td colSpan={6} className="px-5 py-12 text-center text-xs text-[#7a6f60]">
                    <div className="flex justify-center">
                      <div className="h-7 w-7 animate-spin rounded-full border-3 border-[#1e382b] border-t-transparent" />
                    </div>
                  </td>
                </tr>
              ) : hallsData && hallsData.length > 0 ? (
                hallsData.map((r) => (
                  <tr key={r.hallId} className="hover:bg-[#ebe3d7]/20 transition">
                    <td className="px-5 py-4 font-bold text-xs text-[#1f2421]">{r.hallName}</td>
                    <td className="px-5 py-4 text-xs text-[#7a6f60] font-medium">{r.city}</td>
                    <td className="px-5 py-4 text-center">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border border-[#d6cec3] bg-white text-[#1f2421]">
                        {r.totalBookings}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-right font-bold text-xs text-[#1f2421]">
                      PKR {Number(r.totalRevenue).toLocaleString()}
                    </td>
                    <td className="px-5 py-4 text-right font-semibold text-xs text-emerald-800">
                      PKR {Number(r.totalCollected).toLocaleString()}
                    </td>
                    <td className="px-5 py-4 text-right font-semibold text-xs text-[#c28e36]">
                      PKR {Number(r.pendingBalance).toLocaleString()}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="px-5 py-10 text-center text-xs text-[#7a6f60] font-medium">
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
