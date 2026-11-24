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
} from "lucide-react";

export default function SuperAdminReportsPage() {
  const [selectedCity, setSelectedCity] = useState("ALL");

  const { data, isLoading } = useQuery({
    queryKey: ["admin-hall-income-reports"],
    queryFn: async () => {
      const res = await reportApi.getHallIncome();
      return (res as any)?.reports as HallIncomeReport[];
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
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">Financial Reports & Analytics</h1>
          <p className="text-sm text-gray-500">Hall-by-hall income statements, cash collections, and pending balances</p>
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

      {/* Aggregate Metrics */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Gross Booking Value</span>
          <p className="mt-2 text-3xl font-extrabold text-gray-900">
            PKR {totalGross.toLocaleString()}
          </p>
          <p className="mt-1 text-xs text-gray-500">Across {filteredReports.length} halls</p>
        </div>

        <div className="rounded-2xl border border-green-200 bg-green-50/50 p-6 shadow-sm">
          <span className="text-xs font-semibold text-green-700 uppercase tracking-wider">Total Cash Collected</span>
          <p className="mt-2 text-3xl font-extrabold text-green-800">
            PKR {totalCollected.toLocaleString()}
          </p>
          <p className="mt-1 text-xs text-green-600">Advance deposits & partial payments</p>
        </div>

        <div className="rounded-2xl border border-amber-200 bg-amber-50/50 p-6 shadow-sm">
          <span className="text-xs font-semibold text-amber-700 uppercase tracking-wider">Pending Receivables</span>
          <p className="mt-2 text-3xl font-extrabold text-amber-800">
            PKR {totalPending.toLocaleString()}
          </p>
          <p className="mt-1 text-xs text-amber-600">Due on or prior to events</p>
        </div>
      </div>

      {/* Hall Income Table */}
      <div className="rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden">
        <div className="flex items-center justify-between border-b border-gray-200 p-5">
          <h3 className="font-bold text-gray-900">Hall Performance Breakdown</h3>
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-gray-500">Filter City:</span>
            <select
              value={selectedCity}
              onChange={(e) => setSelectedCity(e.target.value)}
              className="rounded-xl border border-gray-300 px-3 py-1.5 text-xs text-gray-700 focus:outline-none"
            >
              <option value="ALL">All Cities</option>
              <option value="Peshawar">Peshawar</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-gray-600">
            <thead className="bg-gray-50 text-xs font-semibold uppercase text-gray-500">
              <tr>
                <th className="px-5 py-3.5">Hall Name</th>
                <th className="px-5 py-3.5">City</th>
                <th className="px-5 py-3.5 text-center">Confirmed Bookings</th>
                <th className="px-5 py-3.5 text-right">Total Revenue (PKR)</th>
                <th className="px-5 py-3.5 text-right">Collected (PKR)</th>
                <th className="px-5 py-3.5 text-right">Balance Due (PKR)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="px-5 py-8 text-center text-gray-400">
                    Loading performance data...
                  </td>
                </tr>
              ) : filteredReports.length > 0 ? (
                filteredReports.map((r) => (
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
