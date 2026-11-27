"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { hallApi, Hall } from "@/services/api/hall.api";
import { Modal } from "@/components/ui/modal";
import {
  Plus,
  CalendarDays,
  MapPin,
  Edit2,
  AlertCircle,
  X,
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
    <div className="space-y-6 select-none font-sans">
      {/* ============================================================== */}
      {/* 1. TOP TITLE HEADER (Matches editorial luxury styling)         */}
      {/* ============================================================== */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div>
          <h1 className="font-serif text-2xl sm:text-3xl text-[#1f2421] font-normal tracking-tight">
            My Wedding Halls
          </h1>
          <p className="text-xs text-[#7a6f60] font-normal mt-0.5">
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
          className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 rounded-lg bg-[#1e382b] hover:bg-[#162a20] px-4 py-2 text-xs sm:text-sm font-semibold text-white transition shadow-xs active:scale-[0.98] cursor-pointer"
        >
          <Plus className="h-4 w-4" />
          <span>Add New Hall</span>
        </button>
      </div>

      {/* ============================================================== */}
      {/* 2. HALLS GRID (3-column layout on Desktop)                     */}
      {/* ============================================================== */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {isLoading ? (
          <div className="col-span-full py-16 text-center">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-3 border-[#1e382b] border-t-transparent" />
          </div>
        ) : data?.halls && data.halls.length > 0 ? (
          data.halls.map((hall) => {
            const isActive = hall.status === "APPROVED" || hall.status === "PENDING";
            return (
              <div
                key={hall.id}
                className="rounded-2xl border border-[#e5ded4] bg-[#faf7f2] p-5 sm:p-6 flex flex-col justify-between hover:border-[#d6cec3] transition shadow-2xs"
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <h3 className="font-serif text-xl sm:text-2xl text-[#1f2421] font-normal truncate">
                        {hall.name}
                      </h3>
                      <p className="flex items-center gap-1 text-xs text-[#7a6f60] font-normal mt-0.5 truncate">
                        <MapPin className="h-3 w-3 text-[#7a6f60] shrink-0" />
                        <span className="truncate">{hall.address ? `${hall.address}, ` : ""}{hall.area}, {hall.city}</span>
                      </p>
                    </div>

                    <span className="shrink-0 inline-flex items-center gap-1.5 text-xs font-semibold whitespace-nowrap">
                      {isActive ? (
                        <>
                          <span className="w-2 h-2 rounded-full bg-emerald-600 inline-block" />
                          <span className="text-[#1f2421]">ACTIVE</span>
                        </>
                      ) : (
                        <>
                          <span className="w-2 h-2 rounded-full border border-[#7a6f60] inline-block" />
                          <span className="text-[#7a6f60]">DISABLED</span>
                        </>
                      )}
                    </span>
                  </div>

                  {/* Pricing and Capacity 3-Box */}
                  <div className="mt-4 grid grid-cols-3 gap-2 rounded-xl bg-white/70 border border-[#e5ded4] p-3 text-center">
                    <div>
                      <span className="text-[10px] text-[#7a6f60] font-bold uppercase tracking-wider">Capacity</span>
                      <p className="font-serif text-base text-[#1f2421] mt-0.5">{hall.capacity} Guests</p>
                    </div>
                    <div>
                      <span className="text-[10px] text-[#7a6f60] font-bold uppercase tracking-wider">Weekday</span>
                      <p className="font-semibold text-xs text-[#1f2421] mt-0.5">
                        PKR {Number(hall.priceWeekday).toLocaleString()}
                      </p>
                    </div>
                    <div>
                      <span className="text-[10px] text-[#7a6f60] font-bold uppercase tracking-wider">Weekend</span>
                      <p className="font-semibold text-xs text-[#c28e36] mt-0.5">
                        PKR {Number(hall.priceWeekend).toLocaleString()}
                      </p>
                    </div>
                  </div>

                  {/* Amenities List */}
                  <div className="mt-3.5">
                    <div className="flex flex-wrap gap-1.5">
                      {Array.isArray(hall.amenities) && hall.amenities.length > 0 ? (
                        hall.amenities.slice(0, 4).map((am, idx) => (
                          <span
                            key={idx}
                            className="rounded-md bg-white border border-[#e5ded4] px-2.5 py-1 text-[11px] font-medium text-[#1f2421]"
                          >
                            {am}
                          </span>
                        ))
                      ) : (
                        <span className="text-xs text-[#7a6f60]">No amenities listed</span>
                      )}
                      {Array.isArray(hall.amenities) && hall.amenities.length > 4 && (
                        <span className="rounded-md bg-white border border-[#e5ded4] px-2 py-1 text-[11px] font-bold text-[#7a6f60]">
                          +{hall.amenities.length - 4}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Actions: Open Calendar link and row of actions */}
                <div className="mt-5 pt-3.5 border-t border-[#e5ded4] space-y-2">
                  <Link
                    href={`/dashboard/calendar?hallId=${hall.id}`}
                    className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg border border-[#d6cec3] bg-white hover:bg-[#faf7f2] text-xs font-semibold text-[#1f2421] transition shadow-2xs"
                  >
                    <CalendarDays className="h-3.5 w-3.5 text-[#1e382b]" />
                    <span>Open Availability Calendar &rarr;</span>
                  </Link>

                  <div className="grid grid-cols-3 gap-2">
                    {/* Edit */}
                    <button
                      onClick={() => openEditModal(hall)}
                      className="flex items-center justify-center gap-1 py-1.5 px-2 rounded-lg border border-[#d6cec3] bg-white hover:bg-[#ebe3d7] text-[#1f2421] font-semibold text-xs transition cursor-pointer"
                    >
                      <Edit2 className="h-3.5 w-3.5 text-[#7a6f60]" />
                      <span>Edit</span>
                    </button>

                    {/* Enable / Disable */}
                    {isActive ? (
                      <button
                        onClick={() => statusMutation.mutate({ id: hall.id, status: "SUSPENDED" })}
                        disabled={statusMutation.isPending}
                        title="Disable this hall"
                        className="flex items-center justify-center gap-1 py-1.5 px-2 rounded-lg border border-amber-200/80 bg-amber-50/70 hover:bg-amber-100 text-amber-800 font-semibold text-xs transition cursor-pointer"
                      >
                        <PowerOff className="h-3.5 w-3.5 text-amber-700" />
                        <span>Disable</span>
                      </button>
                    ) : (
                      <button
                        onClick={() => statusMutation.mutate({ id: hall.id, status: "APPROVED" })}
                        disabled={statusMutation.isPending}
                        title="Enable this hall"
                        className="flex items-center justify-center gap-1 py-1.5 px-2 rounded-lg border border-emerald-200/80 bg-emerald-50/70 hover:bg-emerald-100 text-emerald-800 font-semibold text-xs transition cursor-pointer"
                      >
                        <Power className="h-3.5 w-3.5 text-emerald-700" />
                        <span>Enable</span>
                      </button>
                    )}

                    {/* Delete */}
                    <button
                      onClick={() => {
                        setDeleteConfirmHall(hall);
                        setDeleteError(null);
                      }}
                      title="Delete this hall"
                      className="flex items-center justify-center gap-1 py-1.5 px-2 rounded-lg border border-rose-200/80 bg-rose-50/70 hover:bg-rose-100 text-rose-700 font-semibold text-xs transition cursor-pointer"
                    >
                      <Trash2 className="h-3.5 w-3.5 text-rose-600" />
                      <span>Delete</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        ) : (
          <div className="col-span-full rounded-2xl border border-[#e5ded4] bg-[#faf7f2] p-12 text-center text-xs text-[#7a6f60]">
            You have not registered any halls yet. Click <strong>Add New Hall</strong> to submit your first venue!
          </div>
        )}
      </div>

      {/* ============================================================== */}
      {/* 3. CREATE / EDIT MODAL                                         */}
      {/* ============================================================== */}
      <Modal
        isOpen={createModalOpen || !!editingHall}
        onClose={() => {
          setCreateModalOpen(false);
          setEditingHall(null);
        }}
        maxWidth="max-w-xl"
      >
        <div className="font-sans">
          <div className="flex items-center justify-between border-b border-[#e5ded4] pb-3 mb-4">
            <div>
              <h3 className="font-serif text-xl text-[#1f2421] font-normal">
                {editingHall ? `Edit ${editingHall.name}` : "Add New Wedding Hall"}
              </h3>
              <p className="text-xs text-[#7a6f60] font-normal">Venue specifications, pricing, and guest capacity</p>
            </div>
            <button
              onClick={() => {
                setCreateModalOpen(false);
                setEditingHall(null);
              }}
              className="text-[#7a6f60] hover:text-[#1f2421] rounded-lg p-1 cursor-pointer"
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
              <label className="block text-xs font-bold text-[#1f2421]">Hall Name</label>
              <input
                type="text"
                required
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="e.g. Royal Marquee Chamkani"
                className="mt-1 w-full rounded-lg border border-[#d6cec3] bg-white px-3.5 py-2 text-xs text-[#1f2421] focus:border-[#1e382b] focus:outline-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-[#1f2421]">City</label>
                <input
                  type="text"
                  required
                  value={form.city}
                  onChange={(e) => setForm({ ...form, city: e.target.value })}
                  className="mt-1 w-full rounded-lg border border-[#d6cec3] bg-white px-3.5 py-2 text-xs text-[#1f2421] focus:border-[#1e382b] focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-[#1f2421]">Area</label>
                <input
                  type="text"
                  required
                  value={form.area}
                  onChange={(e) => setForm({ ...form, area: e.target.value })}
                  className="mt-1 w-full rounded-lg border border-[#d6cec3] bg-white px-3.5 py-2 text-xs text-[#1f2421] focus:border-[#1e382b] focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#1f2421]">Physical Address</label>
              <input
                type="text"
                required
                value={form.address}
                onChange={(e) => setForm({ ...form, address: e.target.value })}
                placeholder="Main GT Road, Near Chamkani Interchange"
                className="mt-1 w-full rounded-lg border border-[#d6cec3] bg-white px-3.5 py-2 text-xs text-[#1f2421] focus:border-[#1e382b] focus:outline-none"
              />
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-bold text-[#1f2421]">Capacity (Guests)</label>
                <input
                  type="number"
                  required
                  placeholder="0"
                  value={form.capacity === 0 || form.capacity === "" ? "" : form.capacity}
                  onChange={(e) => setForm({ ...form, capacity: e.target.value === "" ? "" : Number(e.target.value) })}
                  className="mt-1 w-full rounded-lg border border-[#d6cec3] bg-white px-3 py-2 text-xs text-[#1f2421] focus:border-[#1e382b] focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-[#1f2421]">Weekday Price (PKR)</label>
                <input
                  type="number"
                  required
                  placeholder="0"
                  value={form.priceWeekday === 0 || form.priceWeekday === "" ? "" : form.priceWeekday}
                  onChange={(e) => setForm({ ...form, priceWeekday: e.target.value === "" ? "" : Number(e.target.value) })}
                  className="mt-1 w-full rounded-lg border border-[#d6cec3] bg-white px-3 py-2 text-xs text-[#1f2421] focus:border-[#1e382b] focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-[#1f2421]">Weekend Price (PKR)</label>
                <input
                  type="number"
                  required
                  placeholder="0"
                  value={form.priceWeekend === 0 || form.priceWeekend === "" ? "" : form.priceWeekend}
                  onChange={(e) => setForm({ ...form, priceWeekend: e.target.value === "" ? "" : Number(e.target.value) })}
                  className="mt-1 w-full rounded-lg border border-[#d6cec3] bg-white px-3 py-2 text-xs text-[#1f2421] focus:border-[#1e382b] focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#1f2421]">Amenities (Comma-separated)</label>
              <input
                type="text"
                value={form.amenities}
                onChange={(e) => setForm({ ...form, amenities: e.target.value })}
                placeholder="AC, Backup Generator, Parking, Stage Decor"
                className="mt-1 w-full rounded-lg border border-[#d6cec3] bg-white px-3.5 py-2 text-xs text-[#1f2421] focus:border-[#1e382b] focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#1f2421]">Description / Policies</label>
              <textarea
                rows={2}
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="Grand ballroom with central heating, elegant bridal room..."
                className="mt-1 w-full rounded-lg border border-[#d6cec3] bg-white p-2.5 text-xs text-[#1f2421] focus:border-[#1e382b] focus:outline-none"
              />
            </div>

            <div className="flex justify-end gap-2.5 pt-3 border-t border-[#e5ded4]">
              <button
                type="button"
                onClick={() => {
                  setCreateModalOpen(false);
                  setEditingHall(null);
                }}
                className="rounded-lg border border-[#d6cec3] bg-white px-4 py-2 text-xs font-semibold text-[#1f2421] hover:bg-[#faf7f2] transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={createMutation.isPending || updateMutation.isPending}
                className="rounded-lg bg-[#1e382b] hover:bg-[#162a20] px-5 py-2 text-xs font-semibold text-white disabled:opacity-50 active:scale-95 transition cursor-pointer shadow-xs"
              >
                {createMutation.isPending || updateMutation.isPending ? "Saving..." : "Save Hall"}
              </button>
            </div>
          </form>
        </div>
      </Modal>

      {/* ============================================================== */}
      {/* 4. DELETE CONFIRMATION MODAL                                   */}
      {/* ============================================================== */}
      <Modal
        isOpen={!!deleteConfirmHall}
        onClose={() => setDeleteConfirmHall(null)}
        maxWidth="max-w-md"
        title="Delete Wedding Hall"
      >
        <div className="space-y-4 font-sans">
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

          <div className="flex justify-end gap-2.5 pt-2 border-t border-[#e5ded4]">
            <button
              type="button"
              onClick={() => setDeleteConfirmHall(null)}
              className="rounded-lg border border-[#d6cec3] bg-white px-4 py-2 text-xs font-semibold text-[#1f2421] hover:bg-[#faf7f2] transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={deleteMutation.isPending}
              onClick={() => deleteConfirmHall && deleteMutation.mutate(deleteConfirmHall.id)}
              className="rounded-lg bg-rose-600 px-4 py-2 text-xs font-semibold text-white hover:bg-rose-700 disabled:opacity-50 transition cursor-pointer shadow-xs"
            >
              {deleteMutation.isPending ? "Deleting..." : "Yes, Delete Hall"}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
