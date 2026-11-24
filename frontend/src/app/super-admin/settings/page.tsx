"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { settingsApi } from "@/services/api/settings.api";
import { reportApi, CommissionReport } from "@/services/api/report.api";
import { Percent, CheckCircle2, TrendingUp, AlertCircle, Building2 } from "lucide-react";

export default function SuperAdminSettingsPage() {
  const queryClient = useQueryClient();
  const [newPercentage, setNewPercentage] = useState<number>(5);
  const [notes, setNotes] = useState("");
  const [statusMsg, setStatusMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Fetch current commission setting
  const { data: settingData, isLoading: settingLoading } = useQuery({
    queryKey: ["global-commission-setting"],
    queryFn: async () => {
      const res = await settingsApi.getCommission();
      const pct = (res as any)?.commission?.percentage || 5;
      setNewPercentage(pct);
      return res as any;
    },
  });

  // Fetch commission report
  const { data: reportData, isLoading: reportLoading } = useQuery({
    queryKey: ["commission-report"],
    queryFn: async () => {
      const res = await reportApi.getCommissionReports();
      return (res as any)?.report as CommissionReport;
    },
  });

  // Mutation to update commission
  const updateMutation = useMutation({
    mutationFn: (data: { percentage: number; notes?: string }) =>
      settingsApi.updateCommission(data.percentage, data.notes),
    onSuccess: (res: any) => {
      setStatusMsg({ type: "success", text: res.message || "Global commission percentage updated successfully!" });
      queryClient.invalidateQueries({ queryKey: ["global-commission-setting"] });
      queryClient.invalidateQueries({ queryKey: ["commission-report"] });
    },
    onError: (err: any) => {
      setStatusMsg({ type: "error", text: err.message || "Failed to update commission rate." });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setStatusMsg(null);
    if (newPercentage < 0 || newPercentage > 100) {
      setStatusMsg({ type: "error", text: "Percentage must be between 0% and 100%." });
      return;
    }
    updateMutation.mutate({ percentage: Number(newPercentage), notes });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-gray-900">Commission Configuration & Analytics</h1>
        <p className="text-sm text-gray-500">
          Manage system-wide platform commission percentage and view revenue share metrics
        </p>
      </div>

      {statusMsg && (
        <div
          className={`flex items-center gap-2 rounded-2xl p-4 text-sm ${
            statusMsg.type === "success"
              ? "border border-green-200 bg-green-50 text-green-800"
              : "border border-red-200 bg-red-50 text-red-800"
          }`}
        >
          {statusMsg.type === "success" ? (
            <CheckCircle2 className="h-5 w-5 text-green-600" />
          ) : (
            <AlertCircle className="h-5 w-5 text-red-600" />
          )}
          <span>{statusMsg.text}</span>
        </div>
      )}

      {/* Configuration Card */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <div className="rounded-xl bg-red-50 p-2 text-red-600">
              <Percent className="h-5 w-5" />
            </div>
            <h3 className="font-bold text-gray-900">Platform Commission Rate</h3>
          </div>

          <p className="text-xs text-gray-500 mb-6">
            Changes to the commission rate will immediately apply to all new bookings created across all halls. Existing bookings retain the historical rate at which they were booked.
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-gray-700">Commission Percentage (%)</label>
              <div className="relative mt-1">
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  max="100"
                  required
                  value={newPercentage}
                  onChange={(e) => setNewPercentage(parseFloat(e.target.value))}
                  className="w-full rounded-xl border border-gray-300 py-2.5 px-3 text-lg font-bold text-gray-900 focus:border-red-600 focus:outline-none"
                />
                <span className="absolute right-3.5 top-3 text-sm font-bold text-gray-400">%</span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700">Reason / Update Notes (Optional)</label>
              <textarea
                rows={2}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="e.g. Standard platform maintenance fee update"
                className="mt-1 w-full rounded-xl border border-gray-300 p-2.5 text-xs text-gray-900 focus:border-red-600 focus:outline-none"
              />
            </div>

            <button
              type="submit"
              disabled={updateMutation.isPending || settingLoading}
              className="w-full rounded-xl bg-red-600 py-2.5 text-xs font-bold text-white hover:bg-red-700 disabled:opacity-50 transition"
            >
              {updateMutation.isPending ? "Updating Rate..." : "Save Commission Rate"}
            </button>
          </form>
        </div>

        {/* Commission Stats */}
        <div className="lg:col-span-2 space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="rounded-2xl border border-green-200 bg-green-50/50 p-6 shadow-sm">
              <span className="text-xs font-semibold uppercase tracking-wider text-green-700">All-Time Platform Earnings</span>
              <p className="mt-2 text-3xl font-extrabold text-green-800">
                PKR {Number(reportData?.totalCommissionAllTime || 0).toLocaleString()}
              </p>
              <p className="mt-1 text-xs text-green-600">Total commission earned since launch</p>
            </div>

            <div className="rounded-2xl border border-blue-200 bg-blue-50/50 p-6 shadow-sm">
              <span className="text-xs font-semibold uppercase tracking-wider text-blue-700">This Month's Earnings</span>
              <p className="mt-2 text-3xl font-extrabold text-blue-800">
                PKR {Number(reportData?.thisMonthCommission || 0).toLocaleString()}
              </p>
              <p className="mt-1 text-xs text-blue-600">Current calendar month commission</p>
            </div>
          </div>

          {/* Breakdown by Hall */}
          <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
            <h3 className="font-bold text-gray-900 mb-4">Commission Breakdown by Hall</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-gray-600">
                <thead className="bg-gray-50 text-[11px] font-semibold uppercase text-gray-500">
                  <tr>
                    <th className="px-3 py-2.5">Hall Name</th>
                    <th className="px-3 py-2.5">Owner</th>
                    <th className="px-3 py-2.5 text-center">Confirmed</th>
                    <th className="px-3 py-2.5 text-right">Hall Revenue (PKR)</th>
                    <th className="px-3 py-2.5 text-right">Commission (PKR)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {reportData?.byHall && reportData.byHall.length > 0 ? (
                    reportData.byHall.map((h) => (
                      <tr key={h.hallId} className="hover:bg-gray-50/50">
                        <td className="px-3 py-3 font-semibold text-gray-900">{h.hallName}</td>
                        <td className="px-3 py-3">{h.ownerName}</td>
                        <td className="px-3 py-3 text-center font-bold">{h.confirmedBookings}</td>
                        <td className="px-3 py-3 text-right">PKR {Number(h.totalRevenue).toLocaleString()}</td>
                        <td className="px-3 py-3 text-right font-bold text-red-600">
                          PKR {Number(h.commissionEarned).toLocaleString()}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={5} className="px-3 py-6 text-center text-gray-400">
                        No completed bookings to calculate commission.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
