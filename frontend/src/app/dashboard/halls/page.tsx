"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { hallApi, Hall } from "@/services/api/hall.api";
import {
  Building2,
  Plus,
  CalendarDays,
  MapPin,
  Users,
  Edit2,
  AlertCircle,
  X,
  CheckCircle2,
} from "lucide-react";

export default function OwnerHallsPage() {
  const queryClient = useQueryClient();
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [editingHall, setEditingHall] = useState<Hall | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  const [form, setForm] = useState({
    name: "",
    city: "Peshawar",
    area: "Chamkani",
    address: "",
    capacity: 500,
    priceWeekday: 120000,
    priceWeekend: 160000,
    amenities: "AC, Backup Generator, Stage Decoration, Sound System, Parking",
    description: "",
  });

  const { data, isLoading } = useQuery({
    queryKey: ["owner-my-halls"],
    queryFn: async () => {
      const res = await hallApi.getAll();
      return res as { halls: Hall[] };
    },
  });

  const createMutation = useMutation({
    mutationFn: (newHall: any) => hallApi.create(newHall),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["owner-my-halls"] });
      queryClient.invalidateQueries({ queryKey: ["owner-overview"] });
      setCreateModalOpen(false);
      setFormError(null);
    },
    onError: (err: any) => {
      setFormError(err.message || "Failed to create hall.");
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => hallApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["owner-my-halls"] });
      setEditingHall(null);
      setFormError(null);
    },
    onError: (err: any) => {
      setFormError(err.message || "Failed to update hall.");
    },
  });

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    createMutation.mutate({
      ...form,
      amenities: form.amenities.split(",").map((a) => a.trim()).filter(Boolean),
    });
  };

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingHall) return;
    setFormError(null);
    updateMutation.mutate({
      id: editingHall.id,
      data: {
        name: form.name,
        city: form.city,
        area: form.area,
        address: form.address,
        capacity: form.capacity,
        priceWeekday: form.priceWeekday,
        priceWeekend: form.priceWeekend,
        amenities: form.amenities.split(",").map((a) => a.trim()).filter(Boolean),
        description: form.description,
      },
    });
  };

  const openEditModal = (hall: Hall) => {
    setEditingHall(hall);
    setForm({
      name: hall.name,
      city: hall.city,
      area: hall.area,
      address: hall.address,
      capacity: hall.capacity,
      priceWeekday: Number(hall.priceWeekday),
      priceWeekend: Number(hall.priceWeekend),
      amenities: Array.isArray(hall.amenities) ? hall.amenities.join(", ") : "",
      description: hall.description || "",
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">My Wedding Halls</h1>
          <p className="text-sm text-gray-500">Manage your hall profiles, pricing, capacity, and operational status</p>
        </div>
        <button
          onClick={() => {
            setFormError(null);
            setForm({
              name: "",
              city: "Peshawar",
              area: "Chamkani",
              address: "",
              capacity: 500,
              priceWeekday: 120000,
              priceWeekend: 160000,
              amenities: "AC, Backup Generator, Stage Decoration, Sound System, Parking",
              description: "",
            });
            setCreateModalOpen(true);
          }}
          className="inline-flex items-center gap-2 rounded-xl bg-red-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-red-700 transition"
        >
          <Plus className="h-4 w-4" />
          Add New Hall
        </button>
      </div>

      {/* Halls Grid */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {isLoading ? (
          <div className="col-span-full py-12 text-center">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-red-600 border-t-transparent" />
          </div>
        ) : data?.halls && data.halls.length > 0 ? (
          data.halls.map((hall) => (
            <div key={hall.id} className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm flex flex-col justify-between">
              <div>
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-bold text-lg text-gray-900">{hall.name}</h3>
                    <p className="flex items-center gap-1.5 text-xs text-gray-500 mt-1">
                      <MapPin className="h-3.5 w-3.5 text-gray-400" />
                      {hall.address}, {hall.area}, {hall.city}
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

                {hall.status === "PENDING" && (
                  <div className="mt-3 rounded-xl bg-amber-50 p-2.5 text-xs text-amber-700 flex items-center gap-2">
                    <AlertCircle className="h-4 w-4 shrink-0 text-amber-600" />
                    <span>This hall is currently pending Super Admin approval.</span>
                  </div>
                )}

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

                <div className="mt-4">
                  <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Amenities</span>
                  <div className="mt-1.5 flex flex-wrap gap-1.5">
                    {Array.isArray(hall.amenities) && hall.amenities.length > 0 ? (
                      hall.amenities.map((am, idx) => (
                        <span key={idx} className="rounded-lg bg-gray-100 px-2 py-0.5 text-xs text-gray-700">
                          {am}
                        </span>
                      ))
                    ) : (
                      <span className="text-xs text-gray-400">No amenities listed</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="mt-6 flex items-center justify-between border-t border-gray-100 pt-4">
                <Link
                  href={`/dashboard/calendar?hallId=${hall.id}`}
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-red-600 hover:text-red-700 hover:underline"
                >
                  <CalendarDays className="h-4 w-4" /> Open Calendar
                </Link>

                <button
                  onClick={() => openEditModal(hall)}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-gray-200 px-3 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-50"
                >
                  <Edit2 className="h-3.5 w-3.5 text-gray-500" /> Edit Hall
                </button>
              </div>
            </div>
          ))
        ) : (
          <div className="col-span-full rounded-2xl border border-gray-200 bg-white p-12 text-center text-sm text-gray-500">
            You have not registered any halls yet. Click <strong>Add New Hall</strong> to submit your first hall!
          </div>
        )}
      </div>

      {/* Create / Edit Modal */}
      {(createModalOpen || editingHall) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-xl rounded-2xl bg-white p-6 shadow-xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b pb-3 mb-4">
              <h3 className="font-bold text-gray-900 text-lg">
                {editingHall ? `Edit ${editingHall.name}` : "Add New Wedding Hall"}
              </h3>
              <button
                onClick={() => {
                  setCreateModalOpen(false);
                  setEditingHall(null);
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {formError && (
              <div className="mb-4 flex items-center gap-2 rounded-xl bg-red-50 p-3 text-xs text-red-700 border border-red-200">
                <AlertCircle className="h-4 w-4 shrink-0 text-red-600" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={editingHall ? handleEditSubmit : handleCreateSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700">Hall Name</label>
                <input
                  type="text"
                  required
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="e.g. Royal Marquee Chamkani"
                  className="mt-1 w-full rounded-xl border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-red-600 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700">City</label>
                  <input
                    type="text"
                    required
                    value={form.city}
                    onChange={(e) => setForm({ ...form, city: e.target.value })}
                    className="mt-1 w-full rounded-xl border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-red-600 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700">Area</label>
                  <input
                    type="text"
                    required
                    value={form.area}
                    onChange={(e) => setForm({ ...form, area: e.target.value })}
                    className="mt-1 w-full rounded-xl border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-red-600 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700">Physical Address</label>
                <input
                  type="text"
                  required
                  value={form.address}
                  onChange={(e) => setForm({ ...form, address: e.target.value })}
                  placeholder="Main GT Road, Near Chamkani Interchange"
                  className="mt-1 w-full rounded-xl border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-red-600 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700">Capacity</label>
                  <input
                    type="number"
                    required
                    value={form.capacity}
                    onChange={(e) => setForm({ ...form, capacity: Number(e.target.value) })}
                    className="mt-1 w-full rounded-xl border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-red-600 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700">Weekday Price</label>
                  <input
                    type="number"
                    required
                    value={form.priceWeekday}
                    onChange={(e) => setForm({ ...form, priceWeekday: Number(e.target.value) })}
                    className="mt-1 w-full rounded-xl border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-red-600 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700">Weekend Price</label>
                  <input
                    type="number"
                    required
                    value={form.priceWeekend}
                    onChange={(e) => setForm({ ...form, priceWeekend: Number(e.target.value) })}
                    className="mt-1 w-full rounded-xl border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-red-600 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700">Amenities (Comma-separated)</label>
                <input
                  type="text"
                  value={form.amenities}
                  onChange={(e) => setForm({ ...form, amenities: e.target.value })}
                  placeholder="AC, Backup Generator, Parking, Stage Decor"
                  className="mt-1 w-full rounded-xl border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-red-600 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700">Description / Policies</label>
                <textarea
                  rows={2}
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder="Grand ballroom with central heating, elegant bridal room..."
                  className="mt-1 w-full rounded-xl border border-gray-300 p-2.5 text-xs text-gray-900 focus:border-red-600 focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setCreateModalOpen(false);
                    setEditingHall(null);
                  }}
                  className="rounded-xl border border-gray-200 px-4 py-2 text-xs font-semibold text-gray-600 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createMutation.isPending || updateMutation.isPending}
                  className="rounded-xl bg-red-600 px-4 py-2 text-xs font-semibold text-white hover:bg-red-700 disabled:opacity-50"
                >
                  {createMutation.isPending || updateMutation.isPending ? "Saving..." : "Save Hall"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
