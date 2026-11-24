"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { hallApi, Hall } from "@/services/api/hall.api";
import { ownerApi, Owner } from "@/services/api/owner.api";
import {
  Building2,
  Search,
  Plus,
  CheckCircle2,
  XCircle,
  AlertOctagon,
  Trash2,
  MapPin,
  Users,
  X,
  AlertCircle,
} from "lucide-react";

export default function SuperAdminHallsPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [page, setPage] = useState(1);

  // Modal states
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const [createForm, setCreateForm] = useState({
    ownerId: "",
    name: "",
    city: "Peshawar",
    area: "Chamkani",
    address: "",
    capacity: 500,
    priceWeekday: 100000,
    priceWeekend: 150000,
    amenities: "AC, Sound System, Backup Generator, Parking",
    description: "",
  });

  // Fetch halls
  const { data, isLoading } = useQuery({
    queryKey: ["admin-halls", search, statusFilter, page],
    queryFn: async () => {
      const res = await hallApi.getAll({
        search: search.trim() || undefined,
        status: statusFilter === "ALL" ? undefined : statusFilter,
        page,
        limit: 10,
      });
      return res as { halls: Hall[]; pagination: { total: number; page: number; totalPages: number } };
    },
  });

  // Fetch approved owners for assignment dropdown
  const { data: ownersData } = useQuery({
    queryKey: ["approved-owners-list"],
    queryFn: async () => {
      const res = await ownerApi.getAll({ status: "APPROVED", limit: 100 });
      return res as { owners: Owner[] };
    },
  });

  // Status mutation
  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: "APPROVED" | "REJECTED" | "SUSPENDED" | "PENDING" }) =>
      hallApi.updateStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-halls"] });
      queryClient.invalidateQueries({ queryKey: ["super-admin-overview"] });
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: (id: string) => hallApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-halls"] });
      queryClient.invalidateQueries({ queryKey: ["super-admin-overview"] });
    },
    onError: (err: any) => {
      alert(err.message || "Cannot delete hall with existing active bookings.");
    },
  });

  // Create hall mutation
  const createMutation = useMutation({
    mutationFn: (newHall: any) => hallApi.create(newHall),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-halls"] });
      queryClient.invalidateQueries({ queryKey: ["super-admin-overview"] });
      setCreateModalOpen(false);
      setFormError(null);
    },
    onError: (err: any) => {
      setFormError(err.message || "Failed to create hall.");
    },
  });

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    if (!createForm.ownerId) {
      setFormError("Please select a Hall Owner to assign this hall to.");
      return;
    }

    createMutation.mutate({
      ...createForm,
      amenities: createForm.amenities.split(",").map((a) => a.trim()).filter(Boolean),
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">Hall Management</h1>
          <p className="text-sm text-gray-500">Global hall catalogue, approvals, pricing, and operational statuses</p>
        </div>
        <button
          onClick={() => {
            setFormError(null);
            setCreateModalOpen(true);
          }}
          className="inline-flex items-center gap-2 rounded-xl bg-red-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-red-700 transition"
        >
          <Plus className="h-4 w-4" />
          Add New Hall
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
            placeholder="Search by hall name, area, or city..."
            className="w-full rounded-xl border border-gray-300 py-2 pl-10 pr-4 text-sm text-gray-900 placeholder-gray-400 focus:border-red-600 focus:outline-none focus:ring-1 focus:ring-red-600"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {["ALL", "PENDING", "APPROVED", "REJECTED", "SUSPENDED"].map((st) => (
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

      {/* Halls Grid / List */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {isLoading ? (
          <div className="col-span-full py-12 text-center">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-red-600 border-t-transparent" />
          </div>
        ) : data?.halls && data.halls.length > 0 ? (
          data.halls.map((hall) => (
            <div key={hall.id} className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm flex flex-col justify-between">
              <div>
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-bold text-lg text-gray-900">{hall.name}</h3>
                    <p className="flex items-center gap-1.5 text-xs text-gray-500 mt-0.5">
                      <MapPin className="h-3.5 w-3.5 text-gray-400" />
                      {hall.area}, {hall.city}
                    </p>
                  </div>
                  <span
                    className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                      hall.status === "APPROVED"
                        ? "bg-green-100 text-green-800"
                        : hall.status === "PENDING"
                        ? "bg-amber-100 text-amber-800"
                        : hall.status === "SUSPENDED"
                        ? "bg-purple-100 text-purple-800"
                        : "bg-red-100 text-red-800"
                    }`}
                  >
                    {hall.status}
                  </span>
                </div>

                <div className="mt-4 grid grid-cols-3 gap-2 rounded-xl bg-gray-50 p-3 text-center text-xs">
                  <div>
                    <span className="text-gray-400">Capacity</span>
                    <p className="font-bold text-gray-800">{hall.capacity} Guests</p>
                  </div>
                  <div>
                    <span className="text-gray-400">Weekday</span>
                    <p className="font-bold text-gray-800">PKR {Number(hall.priceWeekday).toLocaleString()}</p>
                  </div>
                  <div>
                    <span className="text-gray-400">Weekend</span>
                    <p className="font-bold text-gray-800">PKR {Number(hall.priceWeekend).toLocaleString()}</p>
                  </div>
                </div>

                <div className="mt-3 flex items-center justify-between text-xs text-gray-500 border-t pt-3">
                  <span>
                    Owner: <strong className="text-gray-800">{hall.owner?.name || "Unassigned"}</strong>
                  </span>
                  <span>Bookings: <strong className="text-gray-800">{hall._count?.bookings || 0}</strong></span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="mt-4 flex items-center justify-end gap-2 border-t pt-3">
                {hall.status === "PENDING" && (
                  <>
                    <button
                      onClick={() => statusMutation.mutate({ id: hall.id, status: "APPROVED" })}
                      className="inline-flex items-center gap-1 rounded-lg bg-green-50 px-2.5 py-1 text-xs font-semibold text-green-700 hover:bg-green-100"
                    >
                      <CheckCircle2 className="h-3.5 w-3.5" /> Approve
                    </button>
                    <button
                      onClick={() => statusMutation.mutate({ id: hall.id, status: "REJECTED" })}
                      className="inline-flex items-center gap-1 rounded-lg bg-red-50 px-2.5 py-1 text-xs font-semibold text-red-700 hover:bg-red-100"
                    >
                      <XCircle className="h-3.5 w-3.5" /> Reject
                    </button>
                  </>
                )}

                {hall.status === "APPROVED" && (
                  <button
                    onClick={() => statusMutation.mutate({ id: hall.id, status: "SUSPENDED" })}
                    className="inline-flex items-center gap-1 rounded-lg bg-purple-50 px-2.5 py-1 text-xs font-semibold text-purple-700 hover:bg-purple-100"
                  >
                    <AlertOctagon className="h-3.5 w-3.5" /> Suspend
                  </button>
                )}

                {hall.status === "SUSPENDED" && (
                  <button
                    onClick={() => statusMutation.mutate({ id: hall.id, status: "APPROVED" })}
                    className="inline-flex items-center gap-1 rounded-lg bg-green-50 px-2.5 py-1 text-xs font-semibold text-green-700 hover:bg-green-100"
                  >
                    <CheckCircle2 className="h-3.5 w-3.5" /> Reactivate
                  </button>
                )}

                <button
                  onClick={() => {
                    if (confirm(`Are you sure you want to delete ${hall.name}?`)) {
                      deleteMutation.mutate(hall.id);
                    }
                  }}
                  title="Delete Hall"
                  className="rounded-lg p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-600 transition"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))
        ) : (
          <div className="col-span-full rounded-2xl border border-gray-200 bg-white p-12 text-center text-sm text-gray-500">
            No halls found matching your criteria.
          </div>
        )}
      </div>

      {/* Create Hall Modal */}
      {createModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-xl rounded-2xl bg-white p-6 shadow-xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b pb-3 mb-4">
              <h3 className="font-bold text-gray-900 text-lg">Add New Hall</h3>
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
                <label className="block text-xs font-semibold text-gray-700">Assign to Hall Owner</label>
                <select
                  required
                  value={createForm.ownerId}
                  onChange={(e) => setCreateForm({ ...createForm, ownerId: e.target.value })}
                  className="mt-1 w-full rounded-xl border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-red-600 focus:outline-none"
                >
                  <option value="">-- Select Approved Owner --</option>
                  {ownersData?.owners?.map((owner) => (
                    <option key={owner.id} value={owner.id}>
                      {owner.name} ({owner.email})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700">Hall Name</label>
                <input
                  type="text"
                  required
                  value={createForm.name}
                  onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })}
                  placeholder="e.g. Royal Crystal Palace"
                  className="mt-1 w-full rounded-xl border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-red-600 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700">City</label>
                  <input
                    type="text"
                    required
                    value={createForm.city}
                    onChange={(e) => setCreateForm({ ...createForm, city: e.target.value })}
                    className="mt-1 w-full rounded-xl border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-red-600 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700">Area</label>
                  <input
                    type="text"
                    required
                    value={createForm.area}
                    onChange={(e) => setCreateForm({ ...createForm, area: e.target.value })}
                    className="mt-1 w-full rounded-xl border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-red-600 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700">Full Address</label>
                <input
                  type="text"
                  required
                  value={createForm.address}
                  onChange={(e) => setCreateForm({ ...createForm, address: e.target.value })}
                  placeholder="Main GT Road, Chamkani, Peshawar"
                  className="mt-1 w-full rounded-xl border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-red-600 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700">Capacity (Guests)</label>
                  <input
                    type="number"
                    required
                    value={createForm.capacity}
                    onChange={(e) => setCreateForm({ ...createForm, capacity: Number(e.target.value) })}
                    className="mt-1 w-full rounded-xl border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-red-600 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700">Weekday Price (PKR)</label>
                  <input
                    type="number"
                    required
                    value={createForm.priceWeekday}
                    onChange={(e) => setCreateForm({ ...createForm, priceWeekday: Number(e.target.value) })}
                    className="mt-1 w-full rounded-xl border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-red-600 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700">Weekend Price (PKR)</label>
                  <input
                    type="number"
                    required
                    value={createForm.priceWeekend}
                    onChange={(e) => setCreateForm({ ...createForm, priceWeekend: Number(e.target.value) })}
                    className="mt-1 w-full rounded-xl border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-red-600 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700">Amenities (Comma-separated)</label>
                <input
                  type="text"
                  value={createForm.amenities}
                  onChange={(e) => setCreateForm({ ...createForm, amenities: e.target.value })}
                  placeholder="AC, Backup Generator, Parking, Stage Decor"
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
                  {createMutation.isPending ? "Creating..." : "Save Hall"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
