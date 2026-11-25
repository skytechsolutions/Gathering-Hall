"use client";

import { useState } from "react";
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
  Building2,
  Calendar,
  AlertCircle,
  Eye,
  Edit2,
  X,
  ShieldCheck,
  Sparkles,
} from "lucide-react";

export default function SuperAdminOwnersPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [page, setPage] = useState(1);

  // Modals state
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [selectedOwner, setSelectedOwner] = useState<Owner | null>(null);
  const [viewDetailsOwner, setViewDetailsOwner] = useState<Owner | null>(null);

  // New owner form state
  const [createForm, setCreateForm] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
  });
  const [formError, setFormError] = useState<string | null>(null);

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

  // Status mutation
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

  // Owner halls query for details modal
  const { data: ownerHallsData, isLoading: hallsLoading } = useQuery({
    queryKey: ["owner-halls", viewDetailsOwner?.id],
    queryFn: () => (viewDetailsOwner ? ownerApi.getHalls(viewDetailsOwner.id) : null),
    enabled: !!viewDetailsOwner,
  });

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    createMutation.mutate(createForm);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between bg-white rounded-3xl p-6 border border-gray-100 shadow-[0_4px_25px_rgba(0,0,0,0.03)]">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-gray-900">
            Hall Owner Management
          </h1>
          <p className="text-xs sm:text-sm text-gray-500 font-medium mt-1">
            Approve, verify, monitor, and regulate hall owner portal accounts
          </p>
        </div>
        <button
          onClick={() => {
            setFormError(null);
            setCreateModalOpen(true);
          }}
          className="inline-flex items-center gap-2 rounded-2xl bg-blue-600 px-4 py-2.5 text-xs sm:text-sm font-bold text-white shadow-md shadow-blue-500/20 hover:bg-blue-700 active:scale-95 transition"
        >
          <Plus className="h-4 w-4" />
          Create Hall Owner
        </button>
      </div>

      {/* Filters & Search */}
      <div className="flex flex-col gap-3 rounded-3xl border border-gray-100 bg-white p-4 sm:p-5 shadow-[0_4px_25px_rgba(0,0,0,0.02)] sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-3 h-4 w-4 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            placeholder="Search by owner name, email, or phone..."
            className="w-full rounded-2xl border border-gray-200 py-2.5 pl-10 pr-4 text-sm text-gray-900 placeholder-gray-400 focus:border-blue-600 focus:ring-2 focus:ring-blue-100 focus:outline-none"
          />
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          {["ALL", "PENDING", "APPROVED", "REJECTED", "BLOCKED"].map((st) => (
            <button
              key={st}
              onClick={() => {
                setStatusFilter(st);
                setPage(1);
              }}
              className={`rounded-xl px-3 py-1.5 text-xs font-bold transition ${statusFilter === st
                  ? "bg-blue-600 text-white shadow-sm shadow-blue-500/20"
                  : "bg-gray-100/80 text-gray-600 hover:bg-gray-200/80"
                }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* Owners Table */}
      <div className="rounded-3xl border border-gray-100 bg-white shadow-[0_4px_25px_rgba(0,0,0,0.02)] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-gray-600">
            <thead className="bg-gray-50/70 text-xs font-bold uppercase text-gray-400 border-b border-gray-100">
              <tr>
                <th className="px-5 py-3.5">Owner Details</th>
                <th className="px-5 py-3.5">Phone</th>
                <th className="px-5 py-3.5 text-center">Halls</th>
                <th className="px-5 py-3.5 text-center">Bookings</th>
                <th className="px-5 py-3.5">Status</th>
                <th className="px-5 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100/80">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="px-5 py-12 text-center text-sm text-gray-500">
                    <div className="flex justify-center">
                      <div className="h-7 w-7 animate-spin rounded-full border-3 border-blue-600 border-t-transparent" />
                    </div>
                  </td>
                </tr>
              ) : data?.owners && data.owners.length > 0 ? (
                data.owners.map((owner) => (
                  <tr key={owner.id} className="hover:bg-blue-50/20 transition">
                    <td className="px-5 py-4">
                      <div className="font-bold text-gray-900">{owner.name}</div>
                      <div className="text-xs text-gray-400 font-mono">{owner.email}</div>
                    </td>
                    <td className="px-5 py-4 font-mono font-medium text-gray-700">{owner.phone || "—"}</td>
                    <td className="px-5 py-4 text-center">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200/50">
                        {owner._count?.halls || 0}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-center">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-indigo-50 text-indigo-700 border border-indigo-200/50">
                        {owner._count?.bookings || 0}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <span
                        className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-bold ${owner.status === "APPROVED"
                            ? "bg-emerald-50 text-emerald-700 border border-emerald-200/60"
                            : owner.status === "PENDING"
                              ? "bg-amber-50 text-amber-700 border border-amber-200/60"
                              : owner.status === "BLOCKED"
                                ? "bg-rose-50 text-rose-700 border border-rose-200/60"
                                : "bg-gray-100 text-gray-800"
                          }`}
                      >
                        {owner.status}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => setViewDetailsOwner(owner)}
                          title="View Details"
                          className="rounded-xl p-2 text-gray-500 hover:bg-gray-100 hover:text-gray-900 transition"
                        >
                          <Eye className="h-4 w-4" />
                        </button>

                        {owner.status === "PENDING" && (
                          <>
                            <button
                              onClick={() => statusMutation.mutate({ id: owner.id, status: "APPROVED" })}
                              title="Approve Owner"
                              className="rounded-xl p-2 text-emerald-600 hover:bg-emerald-50 transition"
                            >
                              <CheckCircle2 className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => statusMutation.mutate({ id: owner.id, status: "REJECTED" })}
                              title="Reject Owner"
                              className="rounded-xl p-2 text-rose-600 hover:bg-rose-50 transition"
                            >
                              <XCircle className="h-4 w-4" />
                            </button>
                          </>
                        )}

                        {owner.status === "APPROVED" && (
                          <button
                            onClick={() => statusMutation.mutate({ id: owner.id, status: "BLOCKED" })}
                            title="Block Owner"
                            className="rounded-xl p-2 text-rose-600 hover:bg-rose-50 transition"
                          >
                            <Ban className="h-4 w-4" />
                          </button>
                        )}

                        {owner.status === "BLOCKED" && (
                          <button
                            onClick={() => statusMutation.mutate({ id: owner.id, status: "APPROVED" })}
                            title="Unblock Owner"
                            className="rounded-xl p-2 text-emerald-600 hover:bg-emerald-50 transition"
                          >
                            <CheckCircle2 className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
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
                className="rounded-xl border border-gray-200 px-3 py-1.5 text-xs font-bold text-gray-600 hover:bg-gray-50 disabled:opacity-40 transition"
              >
                Previous
              </button>
              <button
                disabled={page >= data.pagination.totalPages}
                onClick={() => setPage((p) => p + 1)}
                className="rounded-xl border border-gray-200 px-3 py-1.5 text-xs font-bold text-gray-600 hover:bg-gray-50 disabled:opacity-40 transition"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Create Hall Owner Modal */}
      <Modal
        isOpen={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        maxWidth="max-w-md"
      >
        <div className="flex items-center justify-between border-b border-gray-100 pb-3 mb-4">
          <div>
            <h3 className="font-extrabold text-gray-900 text-lg">Create New Hall Owner</h3>
            <p className="text-xs text-gray-400 font-medium">Add verified owner account to portal</p>
          </div>
          <button
            onClick={() => setCreateModalOpen(false)}
            className="text-gray-400 hover:text-gray-600 rounded-lg p-1"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {formError && (
          <div className="mb-4 flex items-center gap-2 rounded-2xl bg-rose-50 p-3.5 text-xs text-rose-700 border border-rose-200">
            <AlertCircle className="h-4 w-4 shrink-0 text-rose-600" />
            <span>{formError}</span>
          </div>
        )}

        <form onSubmit={handleCreateSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-gray-700">Full Name</label>
            <input
              type="text"
              required
              value={createForm.name}
              onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })}
              placeholder="e.g. Haji Malik Khan"
              className="mt-1 w-full rounded-2xl border border-gray-200 px-3.5 py-2.5 text-sm text-gray-900 focus:border-blue-600 focus:ring-2 focus:ring-blue-100 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700">Email Address</label>
            <input
              type="email"
              required
              value={createForm.email}
              onChange={(e) => setCreateForm({ ...createForm, email: e.target.value })}
              placeholder="owner@example.com"
              className="mt-1 w-full rounded-2xl border border-gray-200 px-3.5 py-2.5 text-sm text-gray-900 focus:border-blue-600 focus:ring-2 focus:ring-blue-100 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700">Phone Number</label>
            <input
              type="tel"
              required
              value={createForm.phone}
              onChange={(e) => setCreateForm({ ...createForm, phone: e.target.value })}
              placeholder="0300-1234567"
              className="mt-1 w-full rounded-2xl border border-gray-200 px-3.5 py-2.5 text-sm text-gray-900 focus:border-blue-600 focus:ring-2 focus:ring-blue-100 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700">Initial Password</label>
            <input
              type="password"
              required
              value={createForm.password}
              onChange={(e) => setCreateForm({ ...createForm, password: e.target.value })}
              placeholder="Minimum 6 characters"
              className="mt-1 w-full rounded-2xl border border-gray-200 px-3.5 py-2.5 text-sm text-gray-900 focus:border-blue-600 focus:ring-2 focus:ring-blue-100 focus:outline-none"
            />
          </div>

          <div className="flex justify-end gap-2.5 pt-3 border-t border-gray-100">
            <button
              type="button"
              onClick={() => setCreateModalOpen(false)}
              className="rounded-2xl border border-gray-200 px-4 py-2.5 text-xs font-bold text-gray-600 hover:bg-gray-50 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={createMutation.isPending}
              className="rounded-2xl bg-blue-600 px-5 py-2.5 text-xs font-bold text-white hover:bg-blue-700 disabled:opacity-50 shadow-md shadow-blue-500/20 active:scale-95 transition"
            >
              {createMutation.isPending ? "Creating..." : "Create Owner"}
            </button>
          </div>
        </form>
      </Modal>

      {/* Owner Details Drawer / Modal */}
      <Modal
        isOpen={!!viewDetailsOwner}
        onClose={() => setViewDetailsOwner(null)}
        maxWidth="max-w-2xl"
      >
        {viewDetailsOwner && (
          <div>
            <div className="flex items-center justify-between border-b border-gray-100 pb-3 mb-4">
              <div>
                <h3 className="font-extrabold text-gray-900 text-lg">{viewDetailsOwner.name}</h3>
                <p className="text-xs text-gray-400 font-medium">{viewDetailsOwner.email} • {viewDetailsOwner.phone}</p>
              </div>
              <button
                onClick={() => setViewDetailsOwner(null)}
                className="text-gray-400 hover:text-gray-600 rounded-lg p-1"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 mb-6">
              <div className="rounded-2xl bg-gray-50/80 border border-gray-100 p-3.5">
                <span className="text-xs font-medium text-gray-400">Account Status</span>
                <p className="font-bold text-gray-900 mt-0.5">{viewDetailsOwner.status}</p>
              </div>
              <div className="rounded-2xl bg-gray-50/80 border border-gray-100 p-3.5">
                <span className="text-xs font-medium text-gray-400">Registered Since</span>
                <p className="font-bold text-gray-900 mt-0.5">
                  {new Date(viewDetailsOwner.createdAt).toLocaleDateString()}
                </p>
              </div>
            </div>

            <h4 className="font-extrabold text-gray-900 text-sm mb-3">Owner's Registered Halls</h4>
            {hallsLoading ? (
              <p className="text-xs text-gray-400">Loading venues...</p>
            ) : ownerHallsData?.halls && ownerHallsData.halls.length > 0 ? (
              <div className="space-y-2">
                {ownerHallsData.halls.map((h: any) => (
                  <div
                    key={h.id}
                    className="flex items-center justify-between rounded-2xl border border-gray-100 bg-white p-3.5 shadow-xs"
                  >
                    <div>
                      <p className="font-bold text-sm text-gray-900">{h.name}</p>
                      <p className="text-xs text-gray-500 font-medium">
                        {h.city} • Capacity: {h.capacity} guests
                      </p>
                    </div>
                    <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-100">
                      {h.status}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-gray-400 font-medium">This owner has not added any halls yet.</p>
            )}

            <div className="mt-6 flex justify-end border-t border-gray-100 pt-3">
              <button
                onClick={() => setViewDetailsOwner(null)}
                className="rounded-2xl bg-gray-100 px-4 py-2 text-xs font-bold text-gray-700 hover:bg-gray-200 transition"
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
