"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ownerApi, Owner } from "@/services/api/owner.api";
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
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">Hall Owner Management</h1>
          <p className="text-sm text-gray-500">Approve, verify, manage, and monitor hall owner accounts</p>
        </div>
        <button
          onClick={() => {
            setFormError(null);
            setCreateModalOpen(true);
          }}
          className="inline-flex items-center gap-2 rounded-xl bg-red-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-red-700 transition"
        >
          <Plus className="h-4 w-4" />
          Create Hall Owner
        </button>
      </div>

      {/* Filters & Search */}
      <div className="flex flex-col gap-3 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
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
            className="w-full rounded-xl border border-gray-300 py-2 pl-10 pr-4 text-sm text-gray-900 placeholder-gray-400 focus:border-red-600 focus:outline-none focus:ring-1 focus:ring-red-600"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {["ALL", "PENDING", "APPROVED", "REJECTED", "BLOCKED"].map((st) => (
            <button
              key={st}
              onClick={() => {
                setStatusFilter(st);
                setPage(1);
              }}
              className={`rounded-xl px-3 py-1.5 text-xs font-semibold transition ${
                statusFilter === st
                  ? "bg-red-600 text-white"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* Owners Table */}
      <div className="rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-gray-600">
            <thead className="bg-gray-50 text-xs font-semibold uppercase text-gray-500">
              <tr>
                <th className="px-5 py-3.5">Owner Details</th>
                <th className="px-5 py-3.5">Phone</th>
                <th className="px-5 py-3.5">Halls</th>
                <th className="px-5 py-3.5">Bookings</th>
                <th className="px-5 py-3.5">Status</th>
                <th className="px-5 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="px-5 py-8 text-center text-sm text-gray-500">
                    <div className="flex justify-center">
                      <div className="h-6 w-6 animate-spin rounded-full border-2 border-red-600 border-t-transparent" />
                    </div>
                  </td>
                </tr>
              ) : data?.owners && data.owners.length > 0 ? (
                data.owners.map((owner) => (
                  <tr key={owner.id} className="hover:bg-gray-50/50">
                    <td className="px-5 py-4">
                      <div className="font-semibold text-gray-900">{owner.name}</div>
                      <div className="text-xs text-gray-500">{owner.email}</div>
                    </td>
                    <td className="px-5 py-4 font-mono text-sm">{owner.phone || "—"}</td>
                    <td className="px-5 py-4 font-bold text-gray-900">
                      {owner._count?.halls || 0}
                    </td>
                    <td className="px-5 py-4 font-bold text-gray-900">
                      {owner._count?.bookings || 0}
                    </td>
                    <td className="px-5 py-4">
                      <span
                        className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                          owner.status === "APPROVED"
                            ? "bg-green-100 text-green-800"
                            : owner.status === "PENDING"
                            ? "bg-amber-100 text-amber-800"
                            : owner.status === "BLOCKED"
                            ? "bg-red-100 text-red-800"
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
                          className="rounded-lg p-1.5 text-gray-500 hover:bg-gray-100 hover:text-gray-900"
                        >
                          <Eye className="h-4 w-4" />
                        </button>

                        {owner.status === "PENDING" && (
                          <>
                            <button
                              onClick={() => statusMutation.mutate({ id: owner.id, status: "APPROVED" })}
                              title="Approve Owner"
                              className="rounded-lg p-1.5 text-green-600 hover:bg-green-50"
                            >
                              <CheckCircle2 className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => statusMutation.mutate({ id: owner.id, status: "REJECTED" })}
                              title="Reject Owner"
                              className="rounded-lg p-1.5 text-red-600 hover:bg-red-50"
                            >
                              <XCircle className="h-4 w-4" />
                            </button>
                          </>
                        )}

                        {owner.status === "APPROVED" && (
                          <button
                            onClick={() => statusMutation.mutate({ id: owner.id, status: "BLOCKED" })}
                            title="Block Owner"
                            className="rounded-lg p-1.5 text-red-600 hover:bg-red-50"
                          >
                            <Ban className="h-4 w-4" />
                          </button>
                        )}

                        {owner.status === "BLOCKED" && (
                          <button
                            onClick={() => statusMutation.mutate({ id: owner.id, status: "APPROVED" })}
                            title="Unblock Owner"
                            className="rounded-lg p-1.5 text-green-600 hover:bg-green-50"
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
                  <td colSpan={6} className="px-5 py-8 text-center text-sm text-gray-500">
                    No hall owners found matching the criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {data?.pagination && data.pagination.totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-gray-100 px-5 py-3">
            <span className="text-xs text-gray-500">
              Page {data.pagination.page} of {data.pagination.totalPages} ({data.pagination.total} total)
            </span>
            <div className="flex gap-2">
              <button
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="rounded-lg border border-gray-200 px-3 py-1 text-xs font-semibold text-gray-600 hover:bg-gray-50 disabled:opacity-50"
              >
                Previous
              </button>
              <button
                disabled={page >= data.pagination.totalPages}
                onClick={() => setPage((p) => p + 1)}
                className="rounded-lg border border-gray-200 px-3 py-1 text-xs font-semibold text-gray-600 hover:bg-gray-50 disabled:opacity-50"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Create Hall Owner Modal */}
      {createModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
            <div className="flex items-center justify-between border-b pb-3 mb-4">
              <h3 className="font-bold text-gray-900 text-lg">Create New Hall Owner</h3>
              <button onClick={() => setCreateModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                <X className="h-5 w-5" />
              </button>
            </div>

            {formError && (
              <div className="mb-4 flex items-center gap-2 rounded-xl bg-red-50 p-3 text-xs text-red-700 border border-red-200">
                <AlertCircle className="h-4 w-4 shrink-0 text-red-600" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleCreateSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700">Full Name</label>
                <input
                  type="text"
                  required
                  value={createForm.name}
                  onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })}
                  placeholder="e.g. Haji Malik Khan"
                  className="mt-1 w-full rounded-xl border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-red-600 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700">Email Address</label>
                <input
                  type="email"
                  required
                  value={createForm.email}
                  onChange={(e) => setCreateForm({ ...createForm, email: e.target.value })}
                  placeholder="owner@example.com"
                  className="mt-1 w-full rounded-xl border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-red-600 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700">Phone Number</label>
                <input
                  type="tel"
                  required
                  value={createForm.phone}
                  onChange={(e) => setCreateForm({ ...createForm, phone: e.target.value })}
                  placeholder="0300-1234567"
                  className="mt-1 w-full rounded-xl border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-red-600 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700">Initial Password</label>
                <input
                  type="password"
                  required
                  value={createForm.password}
                  onChange={(e) => setCreateForm({ ...createForm, password: e.target.value })}
                  placeholder="Minimum 6 characters"
                  className="mt-1 w-full rounded-xl border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-red-600 focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setCreateModalOpen(false)}
                  className="rounded-xl border border-gray-200 px-4 py-2 text-xs font-semibold text-gray-600 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createMutation.isPending}
                  className="rounded-xl bg-red-600 px-4 py-2 text-xs font-semibold text-white hover:bg-red-700 disabled:opacity-50"
                >
                  {createMutation.isPending ? "Creating..." : "Create Owner"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Owner Details Drawer / Modal */}
      {viewDetailsOwner && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-2xl rounded-2xl bg-white p-6 shadow-xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b pb-3 mb-4">
              <div>
                <h3 className="font-bold text-gray-900 text-lg">{viewDetailsOwner.name}</h3>
                <p className="text-xs text-gray-500">{viewDetailsOwner.email} • {viewDetailsOwner.phone}</p>
              </div>
              <button onClick={() => setViewDetailsOwner(null)} className="text-gray-400 hover:text-gray-600">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="rounded-xl bg-gray-50 p-3">
                <span className="text-xs text-gray-500">Status</span>
                <p className="font-bold text-gray-900 mt-1">{viewDetailsOwner.status}</p>
              </div>
              <div className="rounded-xl bg-gray-50 p-3">
                <span className="text-xs text-gray-500">Member Since</span>
                <p className="font-bold text-gray-900 mt-1">
                  {new Date(viewDetailsOwner.createdAt).toLocaleDateString()}
                </p>
              </div>
            </div>

            <h4 className="font-bold text-gray-900 text-sm mb-3">Owner's Assigned Halls</h4>
            {hallsLoading ? (
              <p className="text-xs text-gray-400">Loading halls...</p>
            ) : ownerHallsData?.halls && ownerHallsData.halls.length > 0 ? (
              <div className="space-y-2">
                {ownerHallsData.halls.map((h: any) => (
                  <div key={h.id} className="flex items-center justify-between rounded-xl border border-gray-200 p-3">
                    <div>
                      <p className="font-bold text-sm text-gray-900">{h.name}</p>
                      <p className="text-xs text-gray-500">{h.city} • Capacity: {h.capacity} guests</p>
                    </div>
                    <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-gray-100 text-gray-700">
                      {h.status}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-gray-400">This owner has not added any halls yet.</p>
            )}

            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setViewDetailsOwner(null)}
                className="rounded-xl bg-gray-100 px-4 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-200"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
