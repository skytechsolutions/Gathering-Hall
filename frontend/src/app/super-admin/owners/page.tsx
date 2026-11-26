"use client";

import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ownerApi, Owner } from "@/services/api/owner.api";
import { Modal } from "@/components/ui/modal";
import {
  Users,
  Search,
  Plus,
  CheckCircle2,
  XCircle,
  Ban,
  Calendar,
  AlertCircle,
  Eye,
  Edit2,
  X,
  ShieldCheck,
  KeyRound,
  Phone,
  Mail,
  Copy,
  Check,
  ExternalLink,
  RotateCcw,
  Clock,
  Activity,
  HelpCircle,
  MessageSquare,
} from "lucide-react";

export default function SuperAdminOwnersPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [page, setPage] = useState(1);

  // Modals state
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [editOwner, setEditOwner] = useState<Owner | null>(null);
  const [resetPassOwner, setResetPassOwner] = useState<Owner | null>(null);
  const [viewDetailsOwner, setViewDetailsOwner] = useState<Owner | null>(null);
  const [supportOwner, setSupportOwner] = useState<Owner | null>(null);

  // Forms state
  const [createForm, setCreateForm] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
  });
  const [editForm, setEditForm] = useState({
    name: "",
    email: "",
    phone: "",
  });
  const [formError, setFormError] = useState<string | null>(null);

  // Reset password state
  const [newPassword, setNewPassword] = useState("");
  const [resetSuccess, setResetSuccess] = useState<string | null>(null);
  const [copiedPass, setCopiedPass] = useState(false);

  // Auto-open create modal if url has ?action=new
  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      if (params.get("action") === "new") {
        setCreateModalOpen(true);
      }
    }
  }, []);

  // Fetch owners query
  const { data, isLoading } = useQuery({
    queryKey: ["admin-owners", search, statusFilter, page],
    queryFn: async () => {
      const res = await ownerApi.getAll({
        search: search.trim() || undefined,
        status: statusFilter === "ALL" ? undefined : statusFilter,
        page,
        limit: 10,
      });
      return res as { owners: Owner[]; pagination: { total: number; page: number; totalPages: number } };
    },
  });

  // Owner activities query for details modal
  const { data: activitiesData, isLoading: activitiesLoading } = useQuery({
    queryKey: ["owner-activities", viewDetailsOwner?.id],
    queryFn: () => (viewDetailsOwner ? ownerApi.getActivities(viewDetailsOwner.id) : null),
    enabled: !!viewDetailsOwner,
  });

  // Status mutation (Activate / Deactivate)
  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: "APPROVED" | "REJECTED" | "BLOCKED" | "PENDING" }) =>
      ownerApi.updateStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-owners"] });
      queryClient.invalidateQueries({ queryKey: ["super-admin-overview"] });
    },
  });

  // Create owner mutation
  const createMutation = useMutation({
    mutationFn: (newOwner: typeof createForm) => ownerApi.create(newOwner),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-owners"] });
      queryClient.invalidateQueries({ queryKey: ["super-admin-overview"] });
      setCreateModalOpen(false);
      setCreateForm({ name: "", email: "", phone: "", password: "" });
      setFormError(null);
    },
    onError: (err: any) => {
      setFormError(err.message || "Failed to create owner.");
    },
  });

  // Edit owner credentials mutation
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: typeof editForm }) =>
      ownerApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-owners"] });
      queryClient.invalidateQueries({ queryKey: ["super-admin-overview"] });
      setEditOwner(null);
      setFormError(null);
    },
    onError: (err: any) => {
      setFormError(err.message || "Failed to update owner credentials.");
    },
  });

  // Reset password mutation
  const resetPasswordMutation = useMutation({
    mutationFn: ({ id, pass }: { id: string; pass: string }) =>
      ownerApi.resetPassword(id, pass),
    onSuccess: () => {
      setResetSuccess("Password successfully updated! Share the credentials with the owner.");
      queryClient.invalidateQueries({ queryKey: ["admin-owners"] });
    },
    onError: (err: any) => {
      setFormError(err.message || "Failed to reset password.");
    },
  });

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    createMutation.mutate(createForm);
  };

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editOwner) return;
    setFormError(null);
    updateMutation.mutate({ id: editOwner.id, data: editForm });
  };

  const handleResetSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetPassOwner || !newPassword) return;
    setFormError(null);
    setResetSuccess(null);
    resetPasswordMutation.mutate({ id: resetPassOwner.id, pass: newPassword });
  };

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

  const openEditModal = (owner: Owner) => {
    setEditOwner(owner);
    setEditForm({
      name: owner.name,
      email: owner.email,
      phone: owner.phone || "",
    });
    setFormError(null);
  };

  const openResetPassModal = (owner: Owner) => {
    setResetPassOwner(owner);
    setNewPassword("");
    setResetSuccess(null);
    setFormError(null);
    setCopiedPass(false);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between bg-[#faf7f2] rounded-2xl p-6 border border-[#e5ded4]">
        <div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-[#ebe3d7] text-[#1e382b] border border-[#d6cec3]">
              <Users className="h-3.5 w-3.5 text-[#1e382b]" /> Partner Directory
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-[#1f2421] mt-2">
            Hall Owner Account Management
          </h1>
          <p className="text-xs sm:text-sm text-[#6c726d] font-medium mt-1">
            Create accounts, activate/deactivate access, manage login credentials, and reset passwords
          </p>
        </div>
        <button
          onClick={() => {
            setFormError(null);
            setCreateModalOpen(true);
          }}
          className="inline-flex items-center gap-2 rounded-xl bg-[#1e382b] hover:bg-[#162a20] px-4 py-2.5 text-xs sm:text-sm font-bold text-white active:scale-95 transition cursor-pointer"
        >
          <Plus className="h-4 w-4" />
          Create Hall Owner
        </button>
      </div>

      {/* Filters & Search */}
      <div className="flex flex-col gap-3 rounded-2xl border border-[#e5ded4] bg-[#faf7f2] p-4 sm:p-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-3 h-4 w-4 text-[#7a7368]" />
          <input
            type="text"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            placeholder="Search by owner name, email, or phone..."
            className="w-full rounded-xl border border-[#d6cec3] bg-white py-2.5 pl-10 pr-4 text-sm text-[#1f2421] placeholder-[#7a7368] focus:border-[#1e382b] focus:ring-2 focus:ring-[#1e382b]/20 focus:outline-none"
          />
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          {[
            { label: "All Owners", value: "ALL" },
            { label: "Active", value: "APPROVED" },
            { label: "Deactivated / Blocked", value: "BLOCKED" },
            { label: "Pending", value: "PENDING" },
          ].map((st) => (
            <button
              key={st.value}
              onClick={() => {
                setStatusFilter(st.value);
                setPage(1);
              }}
              className={`rounded-xl px-3 py-1.5 text-xs font-bold transition cursor-pointer ${
                statusFilter === st.value
                  ? "bg-[#1e382b] text-white shadow-2xs"
                  : "bg-[#ebe3d7]/60 text-[#1f2421] hover:bg-[#ebe3d7]"
              }`}
            >
              {st.label}
            </button>
          ))}
        </div>
      </div>

      {/* Owners Table */}
      <div className="rounded-2xl border border-[#e5ded4] bg-[#faf7f2] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-[#1f2421]">
            <thead className="bg-[#ebe3d7]/50 text-xs font-bold uppercase text-[#6c726d] border-b border-[#e5ded4]">
              <tr>
                <th className="px-5 py-3.5">Owner Credentials</th>
                <th className="px-5 py-3.5">Phone / Contact</th>
                <th className="px-5 py-3.5">Halls</th>
                <th className="px-5 py-3.5">Account Status</th>
                <th className="px-5 py-3.5">Support & Assistance</th>
                <th className="px-5 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#e5ded4]">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="px-5 py-12 text-center text-sm text-[#6c726d]">
                    <div className="flex justify-center">
                      <div className="h-7 w-7 animate-spin rounded-full border-3 border-[#1e382b] border-t-transparent" />
                    </div>
                  </td>
                </tr>
              ) : data?.owners && data.owners.length > 0 ? (
                data.owners.map((owner) => {
                  const isActive = owner.status === "APPROVED";
                  const isBlocked = owner.status === "BLOCKED";
                  const isPending = owner.status === "PENDING";

                  return (
                    <tr key={owner.id} className="hover:bg-[#ebe3d7]/30 transition">
                      {/* Owner Credentials */}
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-[#1f2421]">{owner.name}</span>
                          <button
                            onClick={() => openEditModal(owner)}
                            title="Edit Credentials"
                            className="p-1 rounded text-[#7a7368] hover:text-[#1f2421] hover:bg-[#ebe3d7] cursor-pointer"
                          >
                            <Edit2 className="h-3 w-3" />
                          </button>
                        </div>
                        <div className="text-xs text-[#6c726d] font-mono mt-0.5">{owner.email}</div>
                      </td>

                      {/* Phone Number */}
                      <td className="px-5 py-4 font-mono font-medium text-[#1f2421] text-xs">
                        {owner.phone ? (
                          <div className="flex items-center gap-1.5">
                            <span>{owner.phone}</span>
                            <a
                              href={`https://wa.me/${owner.phone.replace(/[^0-9]/g, "")}`}
                              target="_blank"
                              rel="noreferrer"
                              title="Chat via WhatsApp"
                              className="text-emerald-700 hover:text-emerald-800"
                            >
                              <ExternalLink className="h-3 w-3" />
                            </a>
                          </div>
                        ) : (
                          "—"
                        )}
                      </td>

                      {/* Registered Halls Count */}
                      <td className="px-5 py-4">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#ebe3d7] text-[#1e382b] border border-[#d6cec3]">
                          {owner.hallsCount || owner._count?.halls || 0} Hall(s)
                        </span>
                      </td>

                      {/* Account Status Badge */}
                      <td className="px-5 py-4">
                        <span
                          className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-bold ${
                            isActive
                              ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                              : isBlocked
                              ? "bg-rose-50 text-rose-700 border border-rose-200"
                              : "bg-amber-50 text-amber-700 border border-amber-200"
                          }`}
                        >
                          {isActive ? "Active" : isBlocked ? "Deactivated" : "Pending"}
                        </span>
                      </td>

                      {/* One-Click Support Actions */}
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-1">
                          {owner.phone && (
                            <a
                              href={`tel:${owner.phone}`}
                              title={`Call ${owner.name}`}
                              className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition"
                            >
                              <Phone className="h-3.5 w-3.5" />
                            </a>
                          )}
                          <a
                            href={`mailto:${owner.email}`}
                            title={`Email ${owner.email}`}
                            className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition"
                          >
                            <Mail className="h-3.5 w-3.5" />
                          </a>
                          <button
                            onClick={() => setSupportOwner(owner)}
                            title="Owner Assistance Guide"
                            className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition cursor-pointer"
                          >
                            <HelpCircle className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </td>

                      {/* Quick Admin Actions */}
                      <td className="px-5 py-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Reset Password Button */}
                          <button
                            onClick={() => openResetPassModal(owner)}
                            title="Reset Owner Password"
                            className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-2.5 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition cursor-pointer"
                          >
                            <KeyRound className="h-3.5 w-3.5 text-amber-600" />
                            <span className="hidden sm:inline">Reset Pass</span>
                          </button>

                          {/* View Activities / Details */}
                          <button
                            onClick={() => setViewDetailsOwner(owner)}
                            title="Monitor Account Activities"
                            className="p-1.5 rounded-lg text-gray-500 hover:bg-gray-100 hover:text-gray-900 transition cursor-pointer"
                          >
                            <Eye className="h-4 w-4" />
                          </button>

                          {/* Activate / Deactivate Toggle */}
                          {isActive ? (
                            <button
                              onClick={() => statusMutation.mutate({ id: owner.id, status: "BLOCKED" })}
                              title="Deactivate Account"
                              className="inline-flex items-center gap-1 rounded-lg border border-rose-200 bg-rose-50 px-2.5 py-1 text-xs font-semibold text-rose-700 hover:bg-rose-100 transition cursor-pointer"
                            >
                              <Ban className="h-3.5 w-3.5" />
                              <span className="hidden md:inline">Deactivate</span>
                            </button>
                          ) : (
                            <button
                              onClick={() => statusMutation.mutate({ id: owner.id, status: "APPROVED" })}
                              title="Activate Account"
                              className="inline-flex items-center gap-1 rounded-lg border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700 hover:bg-emerald-100 transition cursor-pointer"
                            >
                              <CheckCircle2 className="h-3.5 w-3.5" />
                              <span className="hidden md:inline">Activate</span>
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={6} className="px-5 py-10 text-center text-sm text-gray-400 font-medium">
                    No hall owners found matching the criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {data?.pagination && data.pagination.totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-gray-100 px-5 py-3.5">
            <span className="text-xs text-gray-500 font-medium">
              Page {data.pagination.page} of {data.pagination.totalPages} ({data.pagination.total} total)
            </span>
            <div className="flex gap-2">
              <button
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-bold text-gray-600 hover:bg-gray-50 disabled:opacity-40 transition cursor-pointer"
              >
                Previous
              </button>
              <button
                disabled={page >= data.pagination.totalPages}
                onClick={() => setPage((p) => p + 1)}
                className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-bold text-gray-600 hover:bg-gray-50 disabled:opacity-40 transition cursor-pointer"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* 1. Create Hall Owner Modal */}
      <Modal
        isOpen={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        maxWidth="max-w-md"
        title="Create New Hall Owner Account"
      >
        {formError && (
          <div className="mb-4 flex items-center gap-2 rounded-xl bg-rose-50 p-3.5 text-xs text-rose-700 border border-rose-200">
            <AlertCircle className="h-4 w-4 shrink-0 text-rose-600" />
            <span>{formError}</span>
          </div>
        )}

        <form onSubmit={handleCreateSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-gray-700">Owner Full Name</label>
            <input
              type="text"
              required
              value={createForm.name}
              onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })}
              placeholder="e.g. Haji Malik Khan"
              className="mt-1 w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm text-gray-900 focus:border-[#3b3c44] focus:ring-2 focus:ring-slate-300 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700">Email Address (Login Username)</label>
            <input
              type="email"
              required
              value={createForm.email}
              onChange={(e) => setCreateForm({ ...createForm, email: e.target.value })}
              placeholder="owner@example.com"
              className="mt-1 w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm text-gray-900 focus:border-[#3b3c44] focus:ring-2 focus:ring-slate-300 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700">Phone Number (Support & WhatsApp)</label>
            <input
              type="tel"
              required
              value={createForm.phone}
              onChange={(e) => setCreateForm({ ...createForm, phone: e.target.value })}
              placeholder="0300-1234567"
              className="mt-1 w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm text-gray-900 focus:border-[#3b3c44] focus:ring-2 focus:ring-slate-300 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700">Initial Password</label>
            <input
              type="password"
              required
              minLength={6}
              value={createForm.password}
              onChange={(e) => setCreateForm({ ...createForm, password: e.target.value })}
              placeholder="Minimum 6 characters"
              className="mt-1 w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm text-gray-900 focus:border-[#3b3c44] focus:ring-2 focus:ring-slate-300 focus:outline-none"
            />
          </div>

          <div className="flex justify-end gap-2.5 pt-3 border-t border-gray-100">
            <button
              type="button"
              onClick={() => setCreateModalOpen(false)}
              className="rounded-xl border border-gray-200 px-4 py-2.5 text-xs font-bold text-gray-600 hover:bg-gray-50 transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={createMutation.isPending}
              className="rounded-xl bg-[#3b3c44] px-5 py-2.5 text-xs font-bold text-white hover:bg-[#2b2c33] disabled:opacity-50 active:scale-95 transition cursor-pointer"
            >
              {createMutation.isPending ? "Creating..." : "Create Owner Account"}
            </button>
          </div>
        </form>
      </Modal>

      {/* 2. Edit Owner Credentials Modal */}
      <Modal
        isOpen={!!editOwner}
        onClose={() => setEditOwner(null)}
        maxWidth="max-w-md"
        title={`Edit Credentials: ${editOwner?.name || ""}`}
      >
        {formError && (
          <div className="mb-4 flex items-center gap-2 rounded-xl bg-rose-50 p-3.5 text-xs text-rose-700 border border-rose-200">
            <AlertCircle className="h-4 w-4 shrink-0 text-rose-600" />
            <span>{formError}</span>
          </div>
        )}

        <form onSubmit={handleEditSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-gray-700">Full Name</label>
            <input
              type="text"
              required
              value={editForm.name}
              onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
              className="mt-1 w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm text-gray-900 focus:border-[#3b3c44] focus:ring-2 focus:ring-slate-300 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700">Email Address (Login Username)</label>
            <input
              type="email"
              required
              value={editForm.email}
              onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
              className="mt-1 w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm text-gray-900 focus:border-[#3b3c44] focus:ring-2 focus:ring-slate-300 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700">Phone Number</label>
            <input
              type="tel"
              value={editForm.phone}
              onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
              className="mt-1 w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm text-gray-900 focus:border-[#3b3c44] focus:ring-2 focus:ring-slate-300 focus:outline-none"
            />
          </div>

          <div className="flex justify-end gap-2.5 pt-3 border-t border-gray-100">
            <button
              type="button"
              onClick={() => setEditOwner(null)}
              className="rounded-xl border border-gray-200 px-4 py-2.5 text-xs font-bold text-gray-600 hover:bg-gray-50 transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={updateMutation.isPending}
              className="rounded-xl bg-[#3b3c44] px-5 py-2.5 text-xs font-bold text-white hover:bg-[#2b2c33] disabled:opacity-50 active:scale-95 transition cursor-pointer"
            >
              {updateMutation.isPending ? "Saving..." : "Save Credentials"}
            </button>
          </div>
        </form>
      </Modal>

      {/* 3. Reset Password Modal */}
      <Modal
        isOpen={!!resetPassOwner}
        onClose={() => setResetPassOwner(null)}
        maxWidth="max-w-md"
        title={`Reset Password: ${resetPassOwner?.name || ""}`}
      >
        <form onSubmit={handleResetSubmit} className="space-y-4">
          <div className="rounded-xl bg-slate-50 p-3 border border-slate-200 text-xs text-slate-600 space-y-1">
            <p>
              <span className="font-bold text-slate-800">Email:</span> {resetPassOwner?.email}
            </p>
            <p>
              <span className="font-bold text-slate-800">Phone:</span> {resetPassOwner?.phone || "N/A"}
            </p>
          </div>

          {resetSuccess && (
            <div className="rounded-xl bg-emerald-50 border border-emerald-200 p-3 text-xs text-emerald-800 font-medium flex items-start gap-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
              <span>{resetSuccess}</span>
            </div>
          )}

          {formError && (
            <div className="rounded-xl bg-rose-50 border border-rose-200 p-3 text-xs text-rose-800 font-medium flex items-start gap-2">
              <AlertCircle className="h-4 w-4 text-rose-600 shrink-0 mt-0.5" />
              <span>{formError}</span>
            </div>
          )}

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-bold text-slate-700">New Temporary Password</label>
              <button
                type="button"
                onClick={handleGeneratePassword}
                className="text-[11px] font-bold text-[#3b3c44] hover:underline cursor-pointer"
              >
                Generate Password
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
            <p className="text-[11px] text-slate-400 mt-1">
              Updating this terminates any existing active sessions and enforces immediate login with the new password.
            </p>
          </div>

          <div className="flex justify-end gap-2.5 pt-3 border-t border-gray-100">
            <button
              type="button"
              onClick={() => setResetPassOwner(null)}
              className="rounded-xl border border-gray-200 px-4 py-2.5 text-xs font-bold text-gray-600 hover:bg-gray-50 transition cursor-pointer"
            >
              Close
            </button>
            <button
              type="submit"
              disabled={resetPasswordMutation.isPending || !newPassword}
              className="rounded-xl bg-[#3b3c44] px-5 py-2.5 text-xs font-bold text-white hover:bg-[#2b2c33] disabled:opacity-50 active:scale-95 transition cursor-pointer"
            >
              {resetPasswordMutation.isPending ? "Updating Password..." : "Update Password"}
            </button>
          </div>
        </form>
      </Modal>

      {/* 4. Owner Activities & Account Monitoring Modal */}
      <Modal
        isOpen={!!viewDetailsOwner}
        onClose={() => setViewDetailsOwner(null)}
        maxWidth="max-w-xl"
        title={`Account Activity: ${viewDetailsOwner?.name || ""}`}
      >
        {viewDetailsOwner && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-xl bg-slate-50 border border-slate-200 p-3">
                <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Account Status</span>
                <p className="font-bold text-sm text-slate-900 mt-0.5">{viewDetailsOwner.status}</p>
              </div>
              <div className="rounded-xl bg-slate-50 border border-slate-200 p-3">
                <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Registration Date</span>
                <p className="font-bold text-sm text-slate-900 mt-0.5">
                  {new Date(viewDetailsOwner.createdAt).toLocaleDateString()}
                </p>
              </div>
            </div>

            <div className="border-t border-slate-100 pt-3">
              <div className="flex items-center gap-2 mb-2">
                <Activity className="h-4 w-4 text-[#3b3c44]" />
                <h4 className="font-bold text-xs uppercase tracking-wider text-slate-700">Account Audit Trail & Activity</h4>
              </div>

              {activitiesLoading ? (
                <div className="py-6 text-center text-xs text-slate-400">Loading activity trail...</div>
              ) : activitiesData?.activities && activitiesData.activities.length > 0 ? (
                <div className="max-h-56 overflow-y-auto divide-y divide-slate-100 border border-slate-200 rounded-xl">
                  {activitiesData.activities.map((act: any) => (
                    <div key={act.id} className="p-2.5 text-xs hover:bg-slate-50">
                      <div className="flex items-center justify-between font-bold text-slate-800">
                        <span>{act.action}</span>
                        <span className="text-[10px] text-slate-400 font-mono">
                          {new Date(act.createdAt).toLocaleString()}
                        </span>
                      </div>
                      {act.details && (
                        <p className="text-[11px] text-slate-500 font-mono mt-0.5 truncate">
                          {typeof act.details === "string" ? act.details : JSON.stringify(act.details)}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-slate-400 py-4 text-center border border-dashed border-slate-200 rounded-xl">
                  No recent security audit logs for this account.
                </p>
              )}
            </div>

            <div className="flex justify-end border-t border-slate-100 pt-3">
              <button
                onClick={() => setViewDetailsOwner(null)}
                className="rounded-xl bg-slate-100 px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-200 transition cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* 5. Support & Assistance Drawer / Modal */}
      <Modal
        isOpen={!!supportOwner}
        onClose={() => setSupportOwner(null)}
        maxWidth="max-w-md"
        title={`Owner Assistance: ${supportOwner?.name || ""}`}
      >
        {supportOwner && (
          <div className="space-y-4">
            <p className="text-xs text-slate-500">
              Direct assistance channels for resolving account access, credential recovery, and owner inquiries.
            </p>

            <div className="space-y-2.5">
              {supportOwner.phone && (
                <a
                  href={`tel:${supportOwner.phone}`}
                  className="flex items-center justify-between p-3 rounded-xl border border-slate-200 hover:bg-slate-50 transition"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 rounded-lg bg-emerald-50 text-emerald-700">
                      <Phone className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="font-bold text-xs text-slate-900">Direct Phone Call</p>
                      <p className="text-[11px] text-slate-500 font-mono">{supportOwner.phone}</p>
                    </div>
                  </div>
                  <span className="text-xs font-bold text-slate-600">Call Now &rarr;</span>
                </a>
              )}

              {supportOwner.phone && (
                <a
                  href={`https://wa.me/${supportOwner.phone.replace(/[^0-9]/g, "")}?text=Hello%20${encodeURIComponent(supportOwner.name)},%20this%20is%20Chamkani%20Hall%20Management%20Support.`}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center justify-between p-3 rounded-xl border border-emerald-200 bg-emerald-50/40 hover:bg-emerald-50 transition"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 rounded-lg bg-emerald-500 text-white">
                      <MessageSquare className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="font-bold text-xs text-emerald-950">WhatsApp Assistance</p>
                      <p className="text-[11px] text-emerald-700">Send direct support message</p>
                    </div>
                  </div>
                  <span className="text-xs font-bold text-emerald-800">Open Chat &rarr;</span>
                </a>
              )}

              <a
                href={`mailto:${supportOwner.email}?subject=Chamkani%20Hall%20Owner%20Support`}
                className="flex items-center justify-between p-3 rounded-xl border border-slate-200 hover:bg-slate-50 transition"
              >
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-lg bg-indigo-50 text-indigo-700">
                    <Mail className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="font-bold text-xs text-slate-900">Official Support Email</p>
                    <p className="text-[11px] text-slate-500 font-mono">{supportOwner.email}</p>
                  </div>
                </div>
                <span className="text-xs font-bold text-slate-600">Send Email &rarr;</span>
              </a>
            </div>

            <div className="flex justify-end border-t border-slate-100 pt-3">
              <button
                onClick={() => setSupportOwner(null)}
                className="rounded-xl bg-slate-100 px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-200 transition cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
