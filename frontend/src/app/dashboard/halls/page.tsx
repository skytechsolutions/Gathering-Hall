"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { hallApi, Hall } from "@/services/api/hall.api";
import { Modal } from "@/components/ui/modal";
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
  Sparkles,
  Trash2,
  Power,
  PowerOff,
  AlertTriangle,
} from "lucide-react";

export default function OwnerHallsPage() {
  const queryClient = useQueryClient();
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [editingHall, setEditingHall] = useState<Hall | null>(null);
  const [deleteConfirmHall, setDeleteConfirmHall] = useState<Hall | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const [form, setForm] = useState<{
    name: string;
    city: string;
    area: string;
    address: string;
    capacity: number | "";
    priceWeekday: number | "";
    priceWeekend: number | "";
    amenities: string;
    description: string;
  }>({
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

  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: "APPROVED" | "SUSPENDED" }) =>
      hallApi.updateStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["owner-my-halls"] });
      queryClient.invalidateQueries({ queryKey: ["owner-overview"] });
      queryClient.invalidateQueries({ queryKey: ["owner-halls-dropdown"] });
      queryClient.invalidateQueries({ queryKey: ["owner-halls-calendar"] });
      queryClient.invalidateQueries({ queryKey: ["hall-availability"] });
    },
    onError: (err: any) => {
      alert(err.message || "Failed to update hall status.");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => hallApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["owner-my-halls"] });
      queryClient.invalidateQueries({ queryKey: ["owner-overview"] });
      queryClient.invalidateQueries({ queryKey: ["owner-halls-dropdown"] });
      queryClient.invalidateQueries({ queryKey: ["owner-halls-calendar"] });
      queryClient.invalidateQueries({ queryKey: ["hall-availability"] });
      setDeleteConfirmHall(null);
      setDeleteError(null);
    },
    onError: (err: any) => {
      setDeleteError(err.message || "Failed to delete hall. It may have active bookings.");
    },
  });

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    createMutation.mutate({
      ...form,
      capacity: Number(form.capacity) || 0,
      priceWeekday: Number(form.priceWeekday) || 0,
      priceWeekend: Number(form.priceWeekend) || 0,
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
        capacity: Number(form.capacity) || 0,
        priceWeekday: Number(form.priceWeekday) || 0,
        priceWeekend: Number(form.priceWeekend) || 0,
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
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between bg-[#faf7f2] rounded-2xl p-6 border border-[#e5ded4]">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-[#1f2421]">My Wedding Halls</h1>
          <p className="text-xs sm:text-sm text-[#6c726d] font-medium mt-1">
            Manage your registered hall profiles, capacities, pricing rules, and operational status
          </p>
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
          className="inline-flex items-center gap-2 rounded-xl bg-[#1e382b] hover:bg-[#162a20] px-4 py-2.5 text-xs sm:text-sm font-bold text-white active:scale-95 transition cursor-pointer"
        >
          <Plus className="h-4 w-4" />
          Add New Hall
        </button>
      </div>

      {/* Halls Grid - Compact responsive 3-column layout */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
        {isLoading ? (
          <div className="col-span-full py-16 text-center">
            <div className="inline-block h-9 w-9 animate-spin rounded-full border-4 border-[#1e382b] border-t-transparent" />
          </div>
        ) : data?.halls && data.halls.length > 0 ? (
          data.halls.map((hall) => (
            <div
              key={hall.id}
              className="rounded-2xl border border-[#e5ded4] bg-[#faf7f2] p-4 sm:p-5 flex flex-col justify-between hover:border-[#d6cec3] transition shadow-2xs"
            >
              <div>
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <h3 className="font-extrabold text-base text-[#1f2421] truncate">{hall.name}</h3>
                    <p className="flex items-center gap-1 text-[11px] text-[#6c726d] font-medium mt-0.5 truncate">
                      <MapPin className="h-3 w-3 text-[#7a7368] shrink-0" />
                      <span className="truncate">{hall.address}, {hall.area}, {hall.city}</span>
                    </p>
                  </div>
                  <span
                    className={`shrink-0 inline-flex rounded-full px-2.5 py-0.5 text-[11px] font-bold ${
                      hall.status === "APPROVED" || hall.status === "PENDING"
                        ? "bg-emerald-50 text-emerald-700 border border-emerald-200/60"
                        : "bg-[#ebe3d7] text-[#6c726d] border border-[#d6cec3]"
                    }`}
                  >
                    {hall.status === "APPROVED" || hall.status === "PENDING" ? "ACTIVE" : "DISABLED"}
                  </span>
                </div>

                <div className="mt-3 grid grid-cols-3 gap-1.5 rounded-xl bg-[#ebe3d7]/40 border border-[#e5ded4] p-2.5 text-center text-xs">
                  <div>
                    <span className="text-[10px] text-[#6c726d] font-medium">Capacity</span>
                    <p className="font-bold text-[#1f2421] text-[11px] mt-0.5">{hall.capacity} Guests</p>
                  </div>
                  <div>
                    <span className="text-[10px] text-[#6c726d] font-medium">Weekday</span>
                    <p className="font-bold text-[#1f2421] text-[11px] mt-0.5">PKR {Number(hall.priceWeekday).toLocaleString()}</p>
                  </div>
                  <div>
                    <span className="text-[10px] text-[#6c726d] font-medium">Weekend</span>
                    <p className="font-bold text-[#1f2421] text-[11px] mt-0.5">PKR {Number(hall.priceWeekend).toLocaleString()}</p>
                  </div>
                </div>

                <div className="mt-2.5">
                  <div className="flex flex-wrap gap-1">
                    {Array.isArray(hall.amenities) && hall.amenities.length > 0 ? (
                      hall.amenities.slice(0, 4).map((am, idx) => (
                        <span
                          key={idx}
                          className="rounded-lg bg-[#ebe3d7]/60 border border-[#d6cec3]/60 px-2 py-0.5 text-[10px] font-semibold text-[#1f2421]"
                        >
                          {am}
                        </span>
                      ))
                    ) : (
                      <span className="text-[11px] text-[#6c726d] font-medium">No amenities listed</span>
                    )}
                    {Array.isArray(hall.amenities) && hall.amenities.length > 4 && (
                      <span className="rounded-lg bg-[#ebe3d7] px-1.5 py-0.5 text-[10px] font-bold text-[#6c726d]">
                        +{hall.amenities.length - 4}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Action Buttons: Calendar link, then 3 buttons in exactly ONE row */}
              <div className="mt-4 pt-3 border-t border-[#e5ded4] space-y-2">
                <Link
                  href={`/dashboard/calendar?hallId=${hall.id}`}
                  className="flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-xl bg-[#ebe3d7]/40 hover:bg-[#ebe3d7] border border-[#d6cec3] text-xs font-bold text-[#1e382b] transition"
                >
                  <CalendarDays className="h-3.5 w-3.5" />
                  <span>Open Availability Calendar &rarr;</span>
                </Link>

                <div className="grid grid-cols-3 gap-1.5">
                  {/* Edit Button */}
                  <button
                    onClick={() => openEditModal(hall)}
                    className="flex items-center justify-center gap-1 py-1.5 px-2 rounded-xl border border-[#d6cec3] bg-white hover:bg-[#ebe3d7] text-[#1f2421] font-bold text-xs transition cursor-pointer"
                  >
                    <Edit2 className="h-3.5 w-3.5 text-[#6c726d]" />
                    <span>Edit</span>
                  </button>

                  {/* Disable / Enable Button */}
                  {hall.status === "APPROVED" || hall.status === "PENDING" ? (
                    <button
                      onClick={() => statusMutation.mutate({ id: hall.id, status: "SUSPENDED" })}
                      disabled={statusMutation.isPending}
                      title="Disable this hall"
                      className="flex items-center justify-center gap-1 py-1.5 px-2 rounded-xl border border-amber-200 bg-amber-50 hover:bg-amber-100 text-amber-700 font-bold text-xs transition cursor-pointer"
                    >
                      <PowerOff className="h-3.5 w-3.5 text-amber-600" />
                      <span>Disable</span>
                    </button>
                  ) : (
                    <button
                      onClick={() => statusMutation.mutate({ id: hall.id, status: "APPROVED" })}
                      disabled={statusMutation.isPending}
                      title="Enable this hall"
                      className="flex items-center justify-center gap-1 py-1.5 px-2 rounded-xl border border-emerald-200 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold text-xs transition cursor-pointer"
                    >
                      <Power className="h-3.5 w-3.5 text-emerald-600" />
                      <span>Enable</span>
                    </button>
                  )}

                  {/* Delete Button */}
                  <button
                    onClick={() => {
                      setDeleteConfirmHall(hall);
                      setDeleteError(null);
                    }}
                    title="Delete this hall"
                    className="flex items-center justify-center gap-1 py-1.5 px-2 rounded-xl border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-xs transition cursor-pointer"
                  >
                    <Trash2 className="h-3.5 w-3.5 text-rose-600" />
                    <span>Delete</span>
                  </button>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="col-span-full rounded-2xl border border-slate-200/80 bg-white p-12 text-center text-sm text-gray-500">
            You have not registered any halls yet. Click <strong>Add New Hall</strong> to submit your first hall!
          </div>
        )}
      </div>

      {/* Create / Edit Modal */}
      <Modal
        isOpen={createModalOpen || !!editingHall}
        onClose={() => {
          setCreateModalOpen(false);
          setEditingHall(null);
        }}
        maxWidth="max-w-xl"
      >
        <div className="flex items-center justify-between border-b border-gray-100 pb-3 mb-4">
          <h3 className="font-extrabold text-gray-900 text-lg">
            {editingHall ? `Edit ${editingHall.name}` : "Add New Wedding Hall"}
          </h3>
          <button
            onClick={() => {
              setCreateModalOpen(false);
              setEditingHall(null);
            }}
            className="text-gray-400 hover:text-gray-600 rounded-lg p-1"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {formError && (
          <div className="mb-4 flex items-center gap-2 rounded-xl bg-rose-50 p-3.5 text-xs text-rose-700 border border-rose-200">
            <AlertCircle className="h-4 w-4 shrink-0 text-rose-600" />
            <span>{formError}</span>
          </div>
        )}

        <form onSubmit={editingHall ? handleEditSubmit : handleCreateSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-gray-700">Hall Name</label>
            <input
              type="text"
              required
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="e.g. Royal Marquee Chamkani"
              className="mt-1 w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm text-gray-900 focus:border-[#3b3c44] focus:ring-2 focus:ring-slate-300 focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-gray-700">City</label>
              <input
                type="text"
                required
                value={form.city}
                onChange={(e) => setForm({ ...form, city: e.target.value })}
                className="mt-1 w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm text-gray-900 focus:border-[#3b3c44] focus:ring-2 focus:ring-slate-300 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-700">Area</label>
              <input
                type="text"
                required
                value={form.area}
                onChange={(e) => setForm({ ...form, area: e.target.value })}
                className="mt-1 w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm text-gray-900 focus:border-[#3b3c44] focus:ring-2 focus:ring-slate-300 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700">Physical Address</label>
            <input
              type="text"
              required
              value={form.address}
              onChange={(e) => setForm({ ...form, address: e.target.value })}
              placeholder="Main GT Road, Near Chamkani Interchange"
              className="mt-1 w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm text-gray-900 focus:border-[#3b3c44] focus:ring-2 focus:ring-slate-300 focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-bold text-gray-700">Capacity (Guests)</label>
              <input
                type="number"
                required
                placeholder="0"
                value={form.capacity === 0 || form.capacity === "" ? "" : form.capacity}
                onChange={(e) => setForm({ ...form, capacity: e.target.value === "" ? "" : Number(e.target.value) })}
                className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-gray-900 focus:border-[#3b3c44] focus:ring-2 focus:ring-slate-300 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-700">Weekday Price (PKR)</label>
              <input
                type="number"
                required
                placeholder="0"
                value={form.priceWeekday === 0 || form.priceWeekday === "" ? "" : form.priceWeekday}
                onChange={(e) => setForm({ ...form, priceWeekday: e.target.value === "" ? "" : Number(e.target.value) })}
                className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-gray-900 focus:border-[#3b3c44] focus:ring-2 focus:ring-slate-300 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-700">Weekend Price (PKR)</label>
              <input
                type="number"
                required
                placeholder="0"
                value={form.priceWeekend === 0 || form.priceWeekend === "" ? "" : form.priceWeekend}
                onChange={(e) => setForm({ ...form, priceWeekend: e.target.value === "" ? "" : Number(e.target.value) })}
                className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-gray-900 focus:border-[#3b3c44] focus:ring-2 focus:ring-slate-300 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700">Amenities (Comma-separated)</label>
            <input
              type="text"
              value={form.amenities}
              onChange={(e) => setForm({ ...form, amenities: e.target.value })}
              placeholder="AC, Backup Generator, Parking, Stage Decor"
              className="mt-1 w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm text-gray-900 focus:border-[#3b3c44] focus:ring-2 focus:ring-slate-300 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700">Description / Policies</label>
            <textarea
              rows={2}
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="Grand ballroom with central heating, elegant bridal room..."
              className="mt-1 w-full rounded-xl border border-slate-200 p-3 text-xs text-gray-900 focus:border-[#3b3c44] focus:ring-2 focus:ring-slate-300 focus:outline-none"
            />
          </div>

          <div className="flex justify-end gap-2.5 pt-3 border-t border-gray-100">
            <button
              type="button"
              onClick={() => {
                setCreateModalOpen(false);
                setEditingHall(null);
              }}
              className="rounded-xl border border-gray-200 px-4 py-2.5 text-xs font-bold text-gray-600 hover:bg-gray-50 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={createMutation.isPending || updateMutation.isPending}
              className="rounded-xl bg-[#3b3c44] px-5 py-2.5 text-xs font-bold text-white hover:bg-[#2b2c33] disabled:opacity-50 active:scale-95 transition"
            >
              {createMutation.isPending || updateMutation.isPending ? "Saving..." : "Save Hall"}
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={!!deleteConfirmHall}
        onClose={() => setDeleteConfirmHall(null)}
        maxWidth="max-w-md"
        title="Delete Wedding Hall"
      >
        <div className="space-y-4">
          <div className="flex items-start gap-3 p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs">
            <AlertTriangle className="h-5 w-5 text-rose-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-rose-900">Are you sure you want to delete this hall?</p>
              <p className="mt-1 text-rose-700">
                You are about to delete <strong className="underline">{deleteConfirmHall?.name}</strong>. This action cannot be undone.
              </p>
            </div>
          </div>

          {deleteError && (
            <div className="p-3 rounded-xl bg-rose-100 border border-rose-300 text-rose-900 text-xs font-semibold">
              {deleteError}
            </div>
          )}

          <div className="flex justify-end gap-2.5 pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setDeleteConfirmHall(null)}
              className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={deleteMutation.isPending}
              onClick={() => deleteConfirmHall && deleteMutation.mutate(deleteConfirmHall.id)}
              className="rounded-xl bg-rose-600 px-4 py-2 text-xs font-bold text-white hover:bg-rose-700 disabled:opacity-50 transition cursor-pointer"
            >
              {deleteMutation.isPending ? "Deleting..." : "Yes, Delete Hall"}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
