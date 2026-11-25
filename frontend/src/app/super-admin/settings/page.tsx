"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { settingsApi } from "@/services/api/settings.api";
import { reportApi, CommissionReport } from "@/services/api/report.api";
import { Percent, CheckCircle2, TrendingUp, AlertCircle, Building2, Sparkles, ShieldCheck } from "lucide-react";

export default function SuperAdminSettingsPage() {
  const queryClient = useQueryClient();
  const [newPercentage, setNewPercentage] = useState<number | "">(5);
  const [notes, setNotes] = useState("");
  const [statusMsg, setStatusMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Fetch current commission setting
  const { data: settingData, isLoading: settingLoading } = useQuery({
    queryKey: ["global-commission-setting"],
    queryFn: async () => {
      const res = await settingsApi.getCommission();
      const pct = (res as any)?.commission?.percentage ?? (res as any)?.percentage ?? 5;
      setNewPercentage(pct);
      return (res || { percentage: 5 }) as any;
    },
  });

  // Fetch commission report
  const { data: reportData, isLoading: reportLoading } = useQuery({
    queryKey: ["commission-report"],
    queryFn: async () => {
      const res = await reportApi.getCommissionReports();
      const rep = (res as any)?.report ?? res;
      return (rep || {
        currentCommissionRate: 5,
        totalCommissionAllTime: 0,
        thisMonthCommission: 0,
        byHall: [],
      }) as CommissionReport;
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
    const pct = Number(newPercentage) || 0;
    if (pct < 0 || pct > 100) {
      setStatusMsg({ type: "error", text: "Percentage must be between 0% and 100%." });
      return;
    }
    updateMutation.mutate({ percentage: pct, notes });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-[0_4px_25px_rgba(0,0,0,0.03)]">
        <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-gray-900">
          Commission Configuration & Analytics
        </h1>
        <p className="text-xs sm:text-sm text-gray-500 font-medium mt-1">
          Manage system-wide platform commission percentage and review automated revenue share
        </p>
      </div>

      {statusMsg && (
        <div
          className={`flex items-center gap-2 rounded-2xl p-4 text-sm ${
            statusMsg.type === "success"
              ? "border border-emerald-200 bg-emerald-50 text-emerald-800"
              : "border border-rose-200 bg-rose-50 text-rose-800"
          }`}
        >
          {statusMsg.type === "success" ? (
            <CheckCircle2 className="h-5 w-5 text-emerald-600" />
          ) : (
            <AlertCircle className="h-5 w-5 text-rose-600" />
          )}
          <span className="font-semibold">{statusMsg.text}</span>
        </div>
      )}

      {/* Configuration Card */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="rounded-3xl border border-gray-100 bg-white p-6 shadow-[0_4px_25px_rgba(0,0,0,0.02)]">
          <div className="flex items-center gap-2 mb-4">
            <div className="rounded-2xl bg-blue-50 p-2 text-blue-600">
              <Percent className="h-5 w-5" />
            </div>
            <h3 className="font-extrabold text-gray-900 text-lg">Platform Commission Rate</h3>
          </div>

          <p className="text-xs text-gray-500 font-medium mb-6">
            Changes to the commission rate immediately apply to all new bookings created across all halls. Existing bookings retain their historical rate.
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-gray-700">Commission Percentage (%)</label>
              <div className="relative mt-1">
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  max="100"
                  required
                  placeholder="0"
                  value={newPercentage === 0 || newPercentage === "" ? "" : newPercentage}
                  onChange={(e) => {
                    const val = e.target.value;
                    setNewPercentage(val === "" ? "" : parseFloat(val));
                  }}
                  className="w-full rounded-2xl border border-gray-200 py-3 px-4 text-xl font-black text-gray-900 focus:border-blue-600 focus:ring-2 focus:ring-blue-100 focus:outline-none"
                />
                <span className="absolute right-4 top-3.5 text-sm font-black text-gray-400">%</span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700">Update Reason / Log Notes</label>
              <textarea
                rows={2}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="e.g. Standard platform fee adjustments"
                className="mt-1 w-full rounded-2xl border border-gray-200 p-3 text-xs text-gray-900 focus:border-blue-600 focus:ring-2 focus:ring-blue-100 focus:outline-none"
              />
            </div>

            <button
              type="submit"
              disabled={updateMutation.isPending || settingLoading}
              className="w-full rounded-2xl bg-blue-600 py-3 text-xs font-bold text-white hover:bg-blue-700 disabled:opacity-50 shadow-md shadow-blue-500/20 active:scale-95 transition"
            >
              {updateMutation.isPending ? "Updating Rate..." : "Save Commission Rate"}
            </button>
          </form>
        </div>

        {/* Commission Stats */}
        <div className="lg:col-span-2 space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="rounded-3xl border border-emerald-100 bg-emerald-50/40 p-6 shadow-[0_4px_25px_rgba(0,0,0,0.02)]">
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-800">
                All-Time Platform Earnings
              </span>
              <p className="mt-2 text-3xl font-black text-emerald-900">
                PKR {Number(reportData?.totalCommissionAllTime || 0).toLocaleString()}
              </p>
              <p className="mt-1 text-xs text-emerald-700 font-medium">Total commission earned since launch</p>
            </div>

            <div className="rounded-3xl border border-blue-100 bg-blue-50/40 p-6 shadow-[0_4px_25px_rgba(0,0,0,0.02)]">
              <span className="text-xs font-bold uppercase tracking-wider text-blue-800">
                This Month's Earnings
              </span>
              <p className="mt-2 text-3xl font-black text-blue-900">
                PKR {Number(reportData?.thisMonthCommission || 0).toLocaleString()}
              </p>
              <p className="mt-1 text-xs text-blue-700 font-medium">Current calendar month commission</p>
            </div>
          </div>

          {/* Breakdown by Hall */}
          <div className="rounded-3xl border border-gray-100 bg-white p-6 shadow-[0_4px_25px_rgba(0,0,0,0.02)]">
            <h3 className="font-extrabold text-lg text-gray-900 mb-4">Commission Breakdown by Hall</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-gray-600">
                <thead className="bg-gray-50/70 text-[11px] font-bold uppercase text-gray-400 border-b border-gray-100">
                  <tr>
                    <th className="px-3.5 py-3">Hall Name</th>
                    <th className="px-3.5 py-3">Owner</th>
                    <th className="px-3.5 py-3 text-center">Confirmed</th>
                    <th className="px-3.5 py-3 text-right">Hall Revenue (PKR)</th>
                    <th className="px-3.5 py-3 text-right">Commission (PKR)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100/80">
                  {reportData?.byHall && reportData.byHall.length > 0 ? (
                    reportData.byHall.map((h) => (
                      <tr key={h.hallId} className="hover:bg-blue-50/20 transition">
                        <td className="px-3.5 py-3 font-bold text-gray-900">{h.hallName}</td>
                        <td className="px-3.5 py-3 font-medium text-gray-700">{h.ownerName}</td>
                        <td className="px-3.5 py-3 text-center">
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200/50">
                            {h.confirmedBookings}
                          </span>
                        </td>
                        <td className="px-3.5 py-3 text-right font-medium text-gray-900">
                          PKR {Number(h.totalRevenue).toLocaleString()}
                        </td>
                        <td className="px-3.5 py-3 text-right font-black text-blue-600">
                          PKR {Number(h.commissionEarned).toLocaleString()}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={5} className="px-3.5 py-6 text-center text-gray-400 font-medium">
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
