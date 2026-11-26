"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { reportApi, SuperAdminOverview } from "@/services/api/report.api";
import { ownerApi, Owner } from "@/services/api/owner.api";
import { Modal } from "@/components/ui/modal";
import {
  Users,
  UserPlus,
  KeyRound,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  ArrowRight,
  Settings,
  Phone,
  Mail,
  Clock,
  Search,
  Lock,
  Ban,
  RotateCcw,
  ExternalLink,
  HelpCircle,
  Copy,
  Check,
} from "lucide-react";

export default function SuperAdminOverviewPage() {
  const queryClient = useQueryClient();
  const [resetModalOwner, setResetModalOwner] = useState<Owner | null>(null);
  const [newPassword, setNewPassword] = useState("");
  const [resetSuccessMsg, setResetSuccessMsg] = useState<string | null>(null);
  const [copiedPass, setCopiedPass] = useState(false);

  // Fetch overview counts
  const { data: overviewData, isLoading: overviewLoading } = useQuery<SuperAdminOverview>({
    queryKey: ["super-admin-overview"],
    queryFn: async () => {
      const res = await reportApi.getOverview();
      return res as SuperAdminOverview;
    },
  });

  // Fetch recent owners list
  const { data: ownersData, isLoading: ownersLoading } = useQuery({
    queryKey: ["admin-recent-owners"],
    queryFn: async () => {
      const res = await ownerApi.getAll({ limit: 6 });
      return res as { owners: Owner[]; pagination: { total: number } };
    },
  });

  // Status mutation (Activate / Deactivate)
  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: "APPROVED" | "BLOCKED" | "PENDING" }) =>
      ownerApi.updateStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-recent-owners"] });
      queryClient.invalidateQueries({ queryKey: ["super-admin-overview"] });
      queryClient.invalidateQueries({ queryKey: ["admin-owners"] });
    },
  });

  // Password reset mutation
  const resetPasswordMutation = useMutation({
    mutationFn: ({ id, pass }: { id: string; pass: string }) =>
      ownerApi.resetPassword(id, pass),
    onSuccess: () => {
      setResetSuccessMsg("Password updated successfully! Share the new temporary password with the owner.");
      queryClient.invalidateQueries({ queryKey: ["admin-recent-owners"] });
    },
  });

  const handleGeneratePassword = () => {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$";
    let gen = "";
    for (let i = 0; i < 10; i++) {
      gen += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setNewPassword(gen);
    setCopiedPass(false);
  };

  const handleCopyPassword = () => {
    if (newPassword) {
      navigator.clipboard.writeText(newPassword);
      setCopiedPass(true);
      setTimeout(() => setCopiedPass(false), 2000);
    }
  };

  const handleResetSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetModalOwner || !newPassword) return;
    setResetSuccessMsg(null);
    resetPasswordMutation.mutate({ id: resetModalOwner.id, pass: newPassword });
  };

  if (overviewLoading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="h-9 w-9 animate-spin rounded-full border-4 border-[#3b3c44] border-t-transparent" />
      </div>
    );
  }

  const totalOwners = overviewData?.totalOwners || 0;
  const approvedOwners = overviewData?.approvedOwners || 0;
  const pendingOwners = overviewData?.pendingOwners || 0;
  const blockedOwners = Math.max(0, totalOwners - approvedOwners - pendingOwners);

  return (
    <div className="space-y-6">
      {/* Top Welcome Banner */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between bg-white rounded-2xl p-6 border border-slate-200/80">
        <div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-slate-100 text-[#3b3c44] border border-slate-200">
              <ShieldCheck className="h-3.5 w-3.5 text-[#3b3c44]" /> Super Administrator Portal
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-gray-900 mt-2">
            Hall Owner & System Administration
          </h1>
          <p className="text-xs sm:text-sm text-gray-500 font-medium mt-1">
            Manage owner accounts, login credentials, password resets, account activation, and platform configurations
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2.5">
          <Link
            href="/super-admin/owners?action=new"
            className="inline-flex items-center gap-2 rounded-xl bg-[#3b3c44] px-4 py-2.5 text-xs sm:text-sm font-bold text-white hover:bg-[#2b2c33] active:scale-95 transition"
          >
            <UserPlus className="h-4 w-4" />
            Create Owner Account
          </Link>
          <Link
            href="/super-admin/settings"
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs sm:text-sm font-bold text-gray-700 hover:bg-gray-50 hover:border-gray-300 transition"
          >
            <Settings className="h-4 w-4 text-[#3b3c44]" />
            System Settings
          </Link>
        </div>
      </div>

      {/* Primary KPI Stats Grid - Hall Owners & Account Status */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Total Registered Owners */}
        <div className="rounded-2xl border border-slate-200/80 bg-white p-4 sm:p-5 flex flex-col justify-between hover:border-slate-300 transition">
          <div className="flex items-center justify-between gap-1">
            <span className="text-[11px] sm:text-xs font-bold text-gray-400 uppercase tracking-wider truncate">
              Registered Owners
            </span>
            <div className="rounded-xl bg-slate-100 p-2 text-[#3b3c44] shrink-0">
              <Users className="h-4 w-4 sm:h-5 sm:w-5" />
            </div>
          </div>
          <div className="mt-3">
            <p className="text-2xl sm:text-3xl font-black text-gray-900">{totalOwners}</p>
            <p className="mt-1 text-[11px] sm:text-xs text-slate-500 font-semibold truncate">
              Total partner accounts
            </p>
          </div>
        </div>

        {/* Active / Approved Accounts */}
        <div className="rounded-2xl border border-emerald-200/70 bg-emerald-50/40 p-4 sm:p-5 flex flex-col justify-between hover:border-emerald-300 transition">
          <div className="flex items-center justify-between gap-1">
            <span className="text-[11px] sm:text-xs font-bold text-emerald-800 uppercase tracking-wider truncate">
              Active Accounts
            </span>
            <div className="rounded-xl bg-emerald-100 p-2 text-emerald-700 shrink-0">
              <CheckCircle2 className="h-4 w-4 sm:h-5 sm:w-5" />
            </div>
          </div>
          <div className="mt-3">
            <p className="text-2xl sm:text-3xl font-black text-emerald-900">{approvedOwners}</p>
            <p className="mt-1 text-[11px] sm:text-xs text-emerald-700 font-semibold truncate">
              Authorized to log in
            </p>
          </div>
        </div>

        {/* Pending or Under Review */}
        <div className="rounded-2xl border border-amber-200/70 bg-amber-50/40 p-4 sm:p-5 flex flex-col justify-between hover:border-amber-300 transition">
          <div className="flex items-center justify-between gap-1">
            <span className="text-[11px] sm:text-xs font-bold text-amber-800 uppercase tracking-wider truncate">
              Pending Verification
            </span>
            <div className="rounded-xl bg-amber-100 p-2 text-amber-700 shrink-0">
              <Clock className="h-4 w-4 sm:h-5 sm:w-5" />
            </div>
          </div>
          <div className="mt-3">
            <p className="text-2xl sm:text-3xl font-black text-amber-900">{pendingOwners}</p>
            <p className="mt-1 text-[11px] sm:text-xs text-amber-700 font-semibold truncate">
              Awaiting activation
            </p>
          </div>
        </div>

        {/* System & Security Operational Status */}
        <div className="rounded-2xl border border-slate-200/80 bg-white p-4 sm:p-5 flex flex-col justify-between">
          <div className="flex items-center justify-between gap-1">
            <span className="text-[11px] sm:text-xs font-bold text-slate-500 uppercase tracking-wider truncate">
              System Health
            </span>
            <div className="rounded-xl bg-slate-100 p-2 text-emerald-600 shrink-0">
              <ShieldCheck className="h-4 w-4 sm:h-5 sm:w-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full bg-emerald-500 animate-pulse" />
              <p className="text-base sm:text-xl font-black text-slate-900">100% Operational</p>
            </div>
            <p className="mt-1 text-[11px] sm:text-xs text-slate-500 font-semibold truncate">
              PostgreSQL & Auth Active
            </p>
          </div>
        </div>
      </div>

      {/* Super Admin Quick Responsibilities Action Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Card 1: Owner Accounts & Credentials */}
        <div className="rounded-2xl border border-slate-200/80 bg-white p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <div className="p-2 rounded-xl bg-slate-100 text-[#3b3c44]">
                <Users className="h-4 w-4" />
              </div>
              <h3 className="font-bold text-sm text-slate-900">Owner Account Management</h3>
            </div>
            <p className="text-xs text-slate-500 leading-relaxed">
              Create new owner portals, modify credentials, update contact information, and toggle login permissions.
            </p>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
            <Link
              href="/super-admin/owners"
              className="text-xs font-bold text-[#3b3c44] hover:underline flex items-center gap-1"
            >
              <span>Manage Owners Directory</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>

        {/* Card 2: Password Reset & Access Support */}
        <div className="rounded-2xl border border-slate-200/80 bg-white p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <div className="p-2 rounded-xl bg-amber-50 text-amber-700">
                <KeyRound className="h-4 w-4" />
              </div>
              <h3 className="font-bold text-sm text-slate-900">Password Reset & Security</h3>
            </div>
            <p className="text-xs text-slate-500 leading-relaxed">
              Instantly generate temporary passwords, reset credentials upon owner request, and revoke compromised tokens.
            </p>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
            <Link
              href="/super-admin/owners"
              className="text-xs font-bold text-amber-800 hover:underline flex items-center gap-1"
            >
              <span>Reset Owner Passwords</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>

        {/* Card 3: System-Level Settings */}
        <div className="rounded-2xl border border-slate-200/80 bg-white p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <div className="p-2 rounded-xl bg-slate-100 text-slate-700">
                <Settings className="h-4 w-4" />
              </div>
              <h3 className="font-bold text-sm text-slate-900">System Configuration</h3>
            </div>
            <p className="text-xs text-slate-500 leading-relaxed">
              Configure system-level parameters, platform support hotline, maintenance mode, and security policies.
            </p>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
            <Link
              href="/super-admin/settings"
              className="text-xs font-bold text-[#3b3c44] hover:underline flex items-center gap-1"
            >
              <span>System Settings</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
      </div>

      {/* Registered Hall Owners Section with Direct Management */}
      <div className="rounded-2xl border border-slate-200/80 bg-white p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-5">
          <div>
            <h2 className="text-lg font-black text-gray-900">Registered Hall Owners</h2>
            <p className="text-xs text-gray-500 font-medium">
              Activate/deactivate accounts, reset passwords, and provide owner assistance
            </p>
          </div>
          <Link
            href="/super-admin/owners"
            className="text-xs font-bold text-[#3b3c44] hover:underline flex items-center gap-1 self-start sm:self-auto"
          >
            <span>View All Registered Owners ({totalOwners})</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-gray-600">
            <thead className="bg-gray-50/70 text-xs font-bold uppercase text-gray-400 border-b border-gray-100">
              <tr>
                <th className="px-4 py-3">Owner Details</th>
                <th className="px-4 py-3">Phone / Contact</th>
                <th className="px-4 py-3">Halls Owned</th>
                <th className="px-4 py-3">Account Status</th>
                <th className="px-4 py-3 text-right">Quick Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100/80">
              {ownersLoading ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-sm text-gray-400">
                    <div className="h-6 w-6 animate-spin rounded-full border-2 border-[#3b3c44] border-t-transparent mx-auto" />
                  </td>
                </tr>
              ) : ownersData?.owners && ownersData.owners.length > 0 ? (
                ownersData.owners.map((owner) => {
                  const isActive = owner.status === "APPROVED";
                  const isBlocked = owner.status === "BLOCKED";

                  return (
                    <tr key={owner.id} className="hover:bg-slate-50/60 transition">
                      <td className="px-4 py-3.5">
                        <div className="font-bold text-gray-900">{owner.name}</div>
                        <div className="text-xs text-gray-400 font-mono">{owner.email}</div>
                      </td>
                      <td className="px-4 py-3.5 font-mono text-xs font-semibold text-gray-700">
                        {owner.phone ? (
                          <div className="flex items-center gap-2">
                            <span>{owner.phone}</span>
                            <a
                              href={`https://wa.me/${owner.phone.replace(/[^0-9]/g, "")}`}
                              target="_blank"
                              rel="noreferrer"
                              title="Chat on WhatsApp"
                              className="text-emerald-600 hover:text-emerald-700"
                            >
                              <ExternalLink className="h-3 w-3" />
                            </a>
                          </div>
                        ) : (
                          "—"
                        )}
                      </td>
                      <td className="px-4 py-3.5">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-bold bg-slate-100 text-slate-700">
                          {owner.hallsCount || owner._count?.halls || 0} Hall(s)
                        </span>
                      </td>
                      <td className="px-4 py-3.5">
                        <span
                          className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-bold ${
                            isActive
                              ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                              : isBlocked
                              ? "bg-rose-50 text-rose-700 border border-rose-200"
                              : "bg-amber-50 text-amber-700 border border-amber-200"
                          }`}
                        >
                          {owner.status}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Reset Password Button */}
                          <button
                            onClick={() => {
                              setResetModalOwner(owner);
                              setNewPassword("");
                              setResetSuccessMsg(null);
                            }}
                            title="Reset Owner Password"
                            className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-2.5 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition cursor-pointer"
                          >
                            <KeyRound className="h-3.5 w-3.5 text-amber-600" />
                            <span className="hidden sm:inline">Reset Pass</span>
                          </button>

                          {/* Toggle Activate / Deactivate */}
                          {isActive ? (
                            <button
                              onClick={() => statusMutation.mutate({ id: owner.id, status: "BLOCKED" })}
                              title="Deactivate / Block Account"
                              className="inline-flex items-center gap-1 rounded-lg border border-rose-200 bg-rose-50 px-2.5 py-1 text-xs font-semibold text-rose-700 hover:bg-rose-100 transition cursor-pointer"
                            >
                              <Ban className="h-3.5 w-3.5" />
                              <span className="hidden sm:inline">Deactivate</span>
                            </button>
                          ) : (
                            <button
                              onClick={() => statusMutation.mutate({ id: owner.id, status: "APPROVED" })}
                              title="Activate Account"
                              className="inline-flex items-center gap-1 rounded-lg border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700 hover:bg-emerald-100 transition cursor-pointer"
                            >
                              <CheckCircle2 className="h-3.5 w-3.5" />
                              <span className="hidden sm:inline">Activate</span>
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-sm text-gray-400 font-medium">
                    No hall owner accounts registered yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Owner Support & Helpdesk Card */}
      <div className="rounded-2xl border border-slate-200/80 bg-white p-6">
        <div className="flex items-start gap-4">
          <div className="p-3 rounded-2xl bg-slate-100 text-[#3b3c44] shrink-0">
            <HelpCircle className="h-6 w-6" />
          </div>
          <div className="flex-1">
            <h3 className="text-base font-bold text-gray-900">
              Hall Owner Support & Assistance Guidelines
            </h3>
            <p className="text-xs text-gray-500 mt-1 leading-relaxed">
              As a Super Administrator, you provide account onboarding, credential recovery, and technical assistance to hall owners.
              When an owner contacts you for password recovery, verify their identity via their registered phone number or email, generate a new temporary password, and share it securely.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-4 pt-3 border-t border-slate-100 text-xs">
              <div className="flex items-center gap-2 text-slate-700 font-semibold">
                <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                <span>Instant Account Activation</span>
              </div>
              <div className="flex items-center gap-2 text-slate-700 font-semibold">
                <KeyRound className="h-4 w-4 text-amber-600" />
                <span>One-Click Credential Reset</span>
              </div>
              <div className="flex items-center gap-2 text-slate-700 font-semibold">
                <Settings className="h-4 w-4 text-slate-600" />
                <span>Direct Platform Config</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Reset Password Modal */}
      <Modal
        isOpen={!!resetModalOwner}
        onClose={() => setResetModalOwner(null)}
        title={`Reset Password: ${resetModalOwner?.name || "Hall Owner"}`}
      >
        <form onSubmit={handleResetSubmit} className="space-y-4">
          <div className="rounded-xl bg-slate-50 p-3 border border-slate-200 text-xs text-slate-600 space-y-1">
            <p>
              <span className="font-bold text-slate-800">Email:</span> {resetModalOwner?.email}
            </p>
            <p>
              <span className="font-bold text-slate-800">Phone:</span> {resetModalOwner?.phone || "N/A"}
            </p>
          </div>

          {resetSuccessMsg && (
            <div className="rounded-xl bg-emerald-50 border border-emerald-200 p-3 text-xs text-emerald-800 font-medium flex items-start gap-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
              <span>{resetSuccessMsg}</span>
            </div>
          )}

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-bold text-slate-700">New Password</label>
              <button
                type="button"
                onClick={handleGeneratePassword}
                className="text-[11px] font-bold text-[#3b3c44] hover:underline cursor-pointer"
              >
                Generate Secure Password
              </button>
            </div>
            <div className="relative">
              <input
                type="text"
                required
                minLength={6}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Enter or generate new password..."
                className="w-full rounded-xl border border-slate-200 py-2.5 pl-3.5 pr-20 text-sm font-mono text-slate-900 focus:border-[#3b3c44] focus:ring-2 focus:ring-slate-300 focus:outline-none"
              />
              {newPassword && (
                <button
                  type="button"
                  onClick={handleCopyPassword}
                  className="absolute right-2 top-1/2 -translate-y-1/2 px-2 py-1 rounded-md text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center gap-1 cursor-pointer"
                >
                  {copiedPass ? <Check className="h-3 w-3 text-emerald-600" /> : <Copy className="h-3 w-3" />}
                  <span>{copiedPass ? "Copied" : "Copy"}</span>
                </button>
              )}
            </div>
            <p className="text-[11px] text-slate-400 mt-1">Minimum 6 characters. Old active sessions will be terminated.</p>
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setResetModalOwner(null)}
              className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 transition cursor-pointer"
            >
              Close
            </button>
            <button
              type="submit"
              disabled={resetPasswordMutation.isPending || !newPassword}
              className="rounded-xl bg-[#3b3c44] px-4 py-2 text-xs font-bold text-white hover:bg-[#2b2c33] disabled:opacity-50 transition cursor-pointer"
            >
              {resetPasswordMutation.isPending ? "Updating Password..." : "Update Password"}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
