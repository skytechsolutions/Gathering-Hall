"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { reportApi, HallIncomeReport } from "@/services/api/report.api";
import {
  BarChart3,
  Download,
  Printer,
  Calendar,
  Building2,
  DollarSign,
  TrendingUp,
  Sparkles,
} from "lucide-react";

export default function SuperAdminReportsPage() {
  const [selectedCity, setSelectedCity] = useState("ALL");

  const { data, isLoading } = useQuery({
    queryKey: ["admin-hall-income-reports"],
    queryFn: async () => {
      const res = await reportApi.getHallIncome();
      const list = (res as any)?.reports ?? (res as any)?.halls ?? (Array.isArray(res) ? res : []);
      return (list || []) as HallIncomeReport[];
    },
  });

  const handleExportCSV = () => {
    if (!data || data.length === 0) return;
    const headers = ["Hall Name", "City", "Total Bookings", "Total Revenue (PKR)", "Collected (PKR)", "Pending Balance (PKR)"];
    const rows = data.map((r) => [
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
    link.setAttribute("download", `Chamkani_Hall_Financial_Report_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const filteredReports = data?.filter((r) => selectedCity === "ALL" || r.city.toLowerCase() === selectedCity.toLowerCase()) || [];

  const totalGross = filteredReports.reduce((acc, curr) => acc + (curr.totalRevenue || 0), 0);
  const totalCollected = filteredReports.reduce((acc, curr) => acc + (curr.totalCollected || 0), 0);
  const totalPending = filteredReports.reduce((acc, curr) => acc + (curr.pendingBalance || 0), 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between bg-white rounded-3xl p-6 border border-gray-100 shadow-[0_4px_25px_rgba(0,0,0,0.03)]">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-gray-900">Financial Reports & Analytics</h1>
          <p className="text-xs sm:text-sm text-gray-500 font-medium mt-1">
            Global income statements, cash collections, and pending balances across all registered halls
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => window.print()}
            className="inline-flex items-center gap-2 rounded-2xl border border-gray-200 bg-white px-4 py-2.5 text-xs sm:text-sm font-bold text-gray-700 hover:bg-gray-50 hover:border-gray-300 transition"
          >
            <Printer className="h-4 w-4" />
            Print Report
          </button>
          <button
            onClick={handleExportCSV}
            className="inline-flex items-center gap-2 rounded-2xl bg-blue-600 px-4 py-2.5 text-xs sm:text-sm font-bold text-white shadow-md shadow-blue-500/20 hover:bg-blue-700 active:scale-95 transition"
          >
            <Download className="h-4 w-4" />
            Export CSV
          </button>
        </div>
      </div>

      {/* Aggregate Metrics */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-3xl border border-gray-100 bg-white p-6 shadow-[0_4px_25px_rgba(0,0,0,0.02)]">
          <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Gross Booking Value</span>
          <p className="mt-2 text-3xl font-black text-gray-900">
            PKR {totalGross.toLocaleString()}
          </p>
          <p className="mt-1 text-xs text-gray-500 font-medium">Across {filteredReports.length} halls</p>
        </div>

        <div className="rounded-3xl border border-emerald-100 bg-emerald-50/40 p-6 shadow-[0_4px_25px_rgba(0,0,0,0.02)]">
          <span className="text-xs font-bold text-emerald-800 uppercase tracking-wider">Total Cash Collected</span>
          <p className="mt-2 text-3xl font-black text-emerald-900">
            PKR {totalCollected.toLocaleString()}
          </p>
          <p className="mt-1 text-xs text-emerald-700 font-medium">Advance deposits & partial payments</p>
        </div>

        <div className="rounded-3xl border border-amber-100 bg-amber-50/40 p-6 shadow-[0_4px_25px_rgba(0,0,0,0.02)]">
          <span className="text-xs font-bold text-amber-800 uppercase tracking-wider">Pending Receivables</span>
          <p className="mt-2 text-3xl font-black text-amber-900">
            PKR {totalPending.toLocaleString()}
          </p>
          <p className="mt-1 text-xs text-amber-700 font-medium">Due on or prior to events</p>
        </div>
      </div>

      {/* Hall Income Table */}
      <div className="rounded-3xl border border-gray-100 bg-white shadow-[0_4px_25px_rgba(0,0,0,0.02)] overflow-hidden">
        <div className="flex items-center justify-between border-b border-gray-100 p-5">
          <div>
            <h3 className="font-extrabold text-lg text-gray-900">Hall Performance Breakdown</h3>
            <p className="text-xs text-gray-400 font-medium">Financial breakdown per registered venue</p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-gray-400">Filter City:</span>
            <select
              value={selectedCity}
              onChange={(e) => setSelectedCity(e.target.value)}
              className="rounded-2xl border border-gray-200 px-3 py-1.5 text-xs font-semibold text-gray-700 focus:outline-none"
            >
              <option value="ALL">All Cities</option>
              <option value="Peshawar">Peshawar</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-gray-600">
            <thead className="bg-gray-50/70 text-xs font-bold uppercase text-gray-400 border-b border-gray-100">
              <tr>
                <th className="px-5 py-3.5">Hall Name</th>
                <th className="px-5 py-3.5">City</th>
                <th className="px-5 py-3.5 text-center">Confirmed Bookings</th>
                <th className="px-5 py-3.5 text-right">Total Revenue (PKR)</th>
                <th className="px-5 py-3.5 text-right">Collected (PKR)</th>
                <th className="px-5 py-3.5 text-right">Balance Due (PKR)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100/80">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="px-5 py-12 text-center text-gray-400">
                    <div className="flex justify-center">
                      <div className="h-7 w-7 animate-spin rounded-full border-3 border-blue-600 border-t-transparent" />
                    </div>
                  </td>
                </tr>
              ) : filteredReports.length > 0 ? (
                filteredReports.map((r) => (
                  <tr key={r.hallId} className="hover:bg-blue-50/20 transition">
                    <td className="px-5 py-4 font-bold text-gray-900">{r.hallName}</td>
                    <td className="px-5 py-4 text-xs font-semibold text-gray-500">{r.city}</td>
                    <td className="px-5 py-4 text-center">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200/50">
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
                    No financial records available.
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
