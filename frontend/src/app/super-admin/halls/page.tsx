"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { hallApi, Hall } from "@/services/api/hall.api";
import { ownerApi, Owner } from "@/services/api/owner.api";
import { Modal } from "@/components/ui/modal";
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
  Sparkles,
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
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between bg-white rounded-3xl p-6 border border-gray-100 shadow-[0_4px_25px_rgba(0,0,0,0.03)]">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-gray-900">Hall Management</h1>
          <p className="text-xs sm:text-sm text-gray-500 font-medium mt-1">
            Global hall catalogue, approvals, pricing configurations, and operational status
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
          Add New Hall
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
            placeholder="Search by hall name, area, or city..."
            className="w-full rounded-2xl border border-gray-200 py-2.5 pl-10 pr-4 text-sm text-gray-900 placeholder-gray-400 focus:border-blue-600 focus:ring-2 focus:ring-blue-100 focus:outline-none"
          />
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          {["ALL", "PENDING", "APPROVED", "REJECTED", "SUSPENDED"].map((st) => (
            <button
              key={st}
              onClick={() => {
                setStatusFilter(st);
                setPage(1);
              }}
              className={`rounded-xl px-3 py-1.5 text-xs font-bold transition ${
                statusFilter === st
                  ? "bg-blue-600 text-white shadow-sm shadow-blue-500/20"
                  : "bg-gray-100/80 text-gray-600 hover:bg-gray-200/80"
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
          <div className="col-span-full py-16 text-center">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-3 border-blue-600 border-t-transparent" />
          </div>
        ) : data?.halls && data.halls.length > 0 ? (
          data.halls.map((hall) => (
            <div
              key={hall.id}
              className="rounded-3xl border border-gray-100 bg-white p-6 shadow-[0_4px_25px_rgba(0,0,0,0.02)] flex flex-col justify-between hover:border-blue-200 transition"
            >
              <div>
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-extrabold text-lg text-gray-900">{hall.name}</h3>
                    <p className="flex items-center gap-1.5 text-xs text-gray-500 font-medium mt-1">
                      <MapPin className="h-3.5 w-3.5 text-gray-400" />
                      {hall.area}, {hall.city}
                    </p>
                  </div>
                  <span
                    className={`inline-flex rounded-full px-3 py-1 text-xs font-bold ${
                      hall.status === "APPROVED"
                        ? "bg-emerald-50 text-emerald-700 border border-emerald-200/60"
                        : hall.status === "PENDING"
                        ? "bg-amber-50 text-amber-700 border border-amber-200/60"
                        : hall.status === "SUSPENDED"
                        ? "bg-purple-50 text-purple-700 border border-purple-200/60"
                        : "bg-rose-50 text-rose-700 border border-rose-200/60"
                    }`}
                  >
                    {hall.status}
                  </span>
                </div>

                <div className="mt-4 grid grid-cols-3 gap-2.5 rounded-2xl bg-gray-50/80 border border-gray-100 p-3 text-center text-xs">
                  <div>
                    <span className="text-gray-400 font-medium">Capacity</span>
                    <p className="font-bold text-gray-800 mt-0.5">{hall.capacity} Guests</p>
                  </div>
                  <div>
                    <span className="text-gray-400 font-medium">Weekday</span>
                    <p className="font-bold text-gray-800 mt-0.5">PKR {Number(hall.priceWeekday).toLocaleString()}</p>
                  </div>
                  <div>
                    <span className="text-gray-400 font-medium">Weekend</span>
                    <p className="font-bold text-gray-800 mt-0.5">PKR {Number(hall.priceWeekend).toLocaleString()}</p>
                  </div>
                </div>

                <div className="mt-3.5 flex items-center justify-between text-xs text-gray-500 font-medium border-t border-gray-100 pt-3">
                  <span>
                    Owner: <strong className="text-gray-900 font-bold">{hall.owner?.name || "Unassigned"}</strong>
                  </span>
                  <span>Bookings: <strong className="text-blue-600 font-black">{hall._count?.bookings || 0}</strong></span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="mt-4 flex items-center justify-end gap-2 border-t border-gray-100 pt-3">
                {hall.status === "PENDING" && (
                  <>
                    <button
                      onClick={() => statusMutation.mutate({ id: hall.id, status: "APPROVED" })}
                      className="inline-flex items-center gap-1 rounded-xl bg-emerald-50 px-3 py-1.5 text-xs font-bold text-emerald-700 hover:bg-emerald-100 transition"
                    >
                      <CheckCircle2 className="h-3.5 w-3.5" /> Approve
                    </button>
                    <button
                      onClick={() => statusMutation.mutate({ id: hall.id, status: "REJECTED" })}
                      className="inline-flex items-center gap-1 rounded-xl bg-rose-50 px-3 py-1.5 text-xs font-bold text-rose-700 hover:bg-rose-100 transition"
                    >
                      <XCircle className="h-3.5 w-3.5" /> Reject
                    </button>
                  </>
                )}

                {hall.status === "APPROVED" && (
                  <button
                    onClick={() => statusMutation.mutate({ id: hall.id, status: "SUSPENDED" })}
                    className="inline-flex items-center gap-1 rounded-xl bg-purple-50 px-3 py-1.5 text-xs font-bold text-purple-700 hover:bg-purple-100 transition"
                  >
                    <AlertOctagon className="h-3.5 w-3.5" /> Suspend
                  </button>
                )}

                {hall.status === "SUSPENDED" && (
                  <button
                    onClick={() => statusMutation.mutate({ id: hall.id, status: "APPROVED" })}
                    className="inline-flex items-center gap-1 rounded-xl bg-emerald-50 px-3 py-1.5 text-xs font-bold text-emerald-700 hover:bg-emerald-100 transition"
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
                  className="rounded-xl p-2 text-gray-400 hover:bg-rose-50 hover:text-rose-600 transition"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))
        ) : (
          <div className="col-span-full rounded-3xl border border-gray-100 bg-white p-12 text-center text-sm text-gray-500">
            No halls found matching your criteria.
          </div>
        )}
      </div>

      {/* Create Hall Modal */}
      <Modal
        isOpen={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        maxWidth="max-w-xl"
      >
        <div className="flex items-center justify-between border-b border-gray-100 pb-3 mb-4">
          <div>
            <h3 className="font-extrabold text-gray-900 text-lg">Add New Hall</h3>
            <p className="text-xs text-gray-400 font-medium">Assign a new hall to an approved owner</p>
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
            <label className="block text-xs font-bold text-gray-700">Assign to Hall Owner</label>
            <select
              required
              value={createForm.ownerId}
              onChange={(e) => setCreateForm({ ...createForm, ownerId: e.target.value })}
              className="mt-1 w-full rounded-2xl border border-gray-200 px-3.5 py-2.5 text-sm text-gray-900 focus:border-blue-600 focus:ring-2 focus:ring-blue-100 focus:outline-none"
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
            <label className="block text-xs font-bold text-gray-700">Hall Name</label>
            <input
              type="text"
              required
              value={createForm.name}
              onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })}
              placeholder="e.g. Royal Crystal Palace"
              className="mt-1 w-full rounded-2xl border border-gray-200 px-3.5 py-2.5 text-sm text-gray-900 focus:border-blue-600 focus:ring-2 focus:ring-blue-100 focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-gray-700">City</label>
              <input
                type="text"
                required
                value={createForm.city}
                onChange={(e) => setCreateForm({ ...createForm, city: e.target.value })}
                className="mt-1 w-full rounded-2xl border border-gray-200 px-3.5 py-2.5 text-sm text-gray-900 focus:border-blue-600 focus:ring-2 focus:ring-blue-100 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-700">Area</label>
              <input
                type="text"
                required
                value={createForm.area}
                onChange={(e) => setCreateForm({ ...createForm, area: e.target.value })}
                className="mt-1 w-full rounded-2xl border border-gray-200 px-3.5 py-2.5 text-sm text-gray-900 focus:border-blue-600 focus:ring-2 focus:ring-blue-100 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700">Full Address</label>
            <input
              type="text"
              required
              value={createForm.address}
              onChange={(e) => setCreateForm({ ...createForm, address: e.target.value })}
              placeholder="Main GT Road, Chamkani, Peshawar"
              className="mt-1 w-full rounded-2xl border border-gray-200 px-3.5 py-2.5 text-sm text-gray-900 focus:border-blue-600 focus:ring-2 focus:ring-blue-100 focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-bold text-gray-700">Capacity (Guests)</label>
              <input
                type="number"
                required
                value={createForm.capacity}
                onChange={(e) => setCreateForm({ ...createForm, capacity: Number(e.target.value) })}
                className="mt-1 w-full rounded-2xl border border-gray-200 px-3 py-2 text-sm text-gray-900 focus:border-blue-600 focus:ring-2 focus:ring-blue-100 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-700">Weekday Price (PKR)</label>
              <input
                type="number"
                required
                value={createForm.priceWeekday}
                onChange={(e) => setCreateForm({ ...createForm, priceWeekday: Number(e.target.value) })}
                className="mt-1 w-full rounded-2xl border border-gray-200 px-3 py-2 text-sm text-gray-900 focus:border-blue-600 focus:ring-2 focus:ring-blue-100 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-700">Weekend Price (PKR)</label>
              <input
                type="number"
                required
                value={createForm.priceWeekend}
                onChange={(e) => setCreateForm({ ...createForm, priceWeekend: Number(e.target.value) })}
                className="mt-1 w-full rounded-2xl border border-gray-200 px-3 py-2 text-sm text-gray-900 focus:border-blue-600 focus:ring-2 focus:ring-blue-100 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700">Amenities (Comma-separated)</label>
            <input
              type="text"
              value={createForm.amenities}
              onChange={(e) => setCreateForm({ ...createForm, amenities: e.target.value })}
              placeholder="AC, Backup Generator, Parking, Stage Decor"
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
              {createMutation.isPending ? "Creating..." : "Save Hall"}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
