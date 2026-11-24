"use client";

import { useState, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Calendar as BigCalendar, dateFnsLocalizer, Views } from "react-big-calendar";
import { format, parse, startOfWeek, getDay } from "date-fns";
import { enUS } from "date-fns/locale";
import { hallApi, Hall } from "@/services/api/hall.api";
import { bookingApi, CalendarAvailabilityEvent } from "@/services/api/booking.api";
import {
  CalendarDays,
  Building2,
  Lock,
  PlusCircle,
  Clock,
  User,
  Phone,
  CheckCircle2,
  XCircle,
  AlertCircle,
  X,
  CreditCard,
} from "lucide-react";

const locales = {
  "en-US": enUS,
};

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek: () => startOfWeek(new Date(), { weekStartsOn: 1 }),
  getDay,
  locales,
});

export default function AvailabilityCalendarPage() {
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();

  const [selectedHallId, setSelectedHallId] = useState<string>(searchParams.get("hallId") || "");
  const [selectedEvent, setSelectedEvent] = useState<CalendarAvailabilityEvent | null>(null);

  // New Booking Modal State
  const [bookingModalOpen, setBookingModalOpen] = useState(false);
  const [bookingForm, setBookingForm] = useState({
    customerName: "",
    customerPhone: "",
    customerEmail: "",
    customerAddress: "",
    eventDate: new Date().toISOString().slice(0, 10),
    eventType: "BARAT",
    status: "HOLD" as "HOLD" | "CONFIRMED",
    totalAmount: 150000,
    advanceAmount: 30000,
    holdHours: 48,
    notes: "",
  });
  const [bookingError, setBookingError] = useState<string | null>(null);

  // Block Date Modal State
  const [blockModalOpen, setBlockModalOpen] = useState(false);
  const [blockForm, setBlockForm] = useState({
    date: new Date().toISOString().slice(0, 10),
    reason: "Renovation / Hall Maintenance",
  });
  const [blockError, setBlockError] = useState<string | null>(null);

  // Fetch Owner's Halls
  const { data: hallsData, isLoading: hallsLoading } = useQuery({
    queryKey: ["owner-halls-calendar"],
    queryFn: async () => {
      const res = await hallApi.getAll();
      const halls = (res as any)?.halls || [];
      if (halls.length > 0 && !selectedHallId) {
        setSelectedHallId(halls[0].id);
      }
      return halls as Hall[];
    },
  });

  const activeHallId = selectedHallId || (hallsData && hallsData[0]?.id) || "";

  // Fetch Availability for Selected Hall
  const { data: availabilityData, isLoading: availabilityLoading } = useQuery({
    queryKey: ["hall-availability", activeHallId],
    queryFn: async () => {
      if (!activeHallId) return null;
      const res = await bookingApi.getAvailability(activeHallId);
      return res as unknown as { hall: Hall; events: CalendarAvailabilityEvent[] };
    },
    enabled: !!activeHallId,
  });

  // Calendar events mapper
  const events = useMemo(() => {
    if (!availabilityData?.events) return [];
    return availabilityData.events.map((evt) => {
      const [year, month, day] = evt.start.split("-").map(Number);
      const d = new Date(year, month - 1, day);
      return {
        ...evt,
        start: d,
        end: d,
        allDay: true,
      };
    });
  }, [availabilityData]);

  // Mutations
  const createBookingMutation = useMutation({
    mutationFn: (data: any) => bookingApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["hall-availability"] });
      queryClient.invalidateQueries({ queryKey: ["owner-overview"] });
      setBookingModalOpen(false);
      setBookingError(null);
    },
    onError: (err: any) => {
      setBookingError(err.message || "Failed to create booking.");
    },
  });

  const blockDateMutation = useMutation({
    mutationFn: (data: { hallId: string; date: string; reason: string }) =>
      bookingApi.blockDate(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["hall-availability"] });
      setBlockModalOpen(false);
      setBlockError(null);
    },
    onError: (err: any) => {
      setBlockError(err.message || "Failed to block date.");
    },
  });

  const confirmBookingMutation = useMutation({
    mutationFn: ({ id, advanceAmount }: { id: string; advanceAmount: number }) =>
      bookingApi.confirm(id, { advanceAmount }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["hall-availability"] });
      queryClient.invalidateQueries({ queryKey: ["owner-overview"] });
      setSelectedEvent(null);
    },
  });

  const cancelBookingMutation = useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) =>
      bookingApi.cancel(id, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["hall-availability"] });
      queryClient.invalidateQueries({ queryKey: ["owner-overview"] });
      setSelectedEvent(null);
    },
  });

  const handleSelectSlot = ({ start }: { start: Date }) => {
    const formattedDate = format(start, "yyyy-MM-dd");
    setBookingForm((prev) => ({
      ...prev,
      eventDate: formattedDate,
    }));
    setBookingError(null);
    setBookingModalOpen(true);
  };

  const handleBookingSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeHallId) return;
    setBookingError(null);

    createBookingMutation.mutate({
      hallId: activeHallId,
      customerName: bookingForm.customerName,
      customerPhone: bookingForm.customerPhone,
      customerEmail: bookingForm.customerEmail || undefined,
      customerAddress: bookingForm.customerAddress || undefined,
      eventDate: bookingForm.eventDate,
      eventType: bookingForm.eventType,
      status: bookingForm.status,
      totalAmount: Number(bookingForm.totalAmount),
      advanceAmount: Number(bookingForm.advanceAmount),
      holdHours: Number(bookingForm.holdHours),
      notes: bookingForm.notes || undefined,
    });
  };

  const handleBlockSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeHallId) return;
    setBlockError(null);
    blockDateMutation.mutate({
      hallId: activeHallId,
      date: blockForm.date,
      reason: blockForm.reason,
    });
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">Availability Calendar</h1>
          <p className="text-sm text-gray-500">Live 4-color status scheduler with instant reservation and date blocking</p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Hall Selector */}
          <div className="flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-3 py-1.5 shadow-sm">
            <Building2 className="h-4 w-4 text-red-600" />
            <select
              value={activeHallId}
              onChange={(e) => setSelectedHallId(e.target.value)}
              className="border-none bg-transparent text-sm font-bold text-gray-900 focus:outline-none"
            >
              {hallsData?.map((hall) => (
                <option key={hall.id} value={hall.id}>
                  {hall.name} ({hall.city})
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={() => {
              setBlockError(null);
              setBlockModalOpen(true);
            }}
            className="inline-flex items-center gap-2 rounded-xl border border-gray-300 bg-white px-3.5 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50 transition shadow-sm"
          >
            <Lock className="h-3.5 w-3.5 text-gray-500" />
            Block Date
          </button>

          <button
            onClick={() => {
              setBookingError(null);
              setBookingModalOpen(true);
            }}
            className="inline-flex items-center gap-2 rounded-xl bg-red-600 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-red-700 transition"
          >
            <PlusCircle className="h-4 w-4" />
            Book Date
          </button>
        </div>
      </div>

      {/* 4-Color Calendar Legend */}
      <div className="flex flex-wrap items-center gap-4 rounded-2xl border border-gray-200 bg-white px-5 py-3 shadow-sm text-xs">
        <span className="font-semibold text-gray-500 uppercase tracking-wider">Status Colors:</span>
        <div className="flex items-center gap-2">
          <span className="h-3 w-3 rounded-full bg-emerald-500 ring-2 ring-emerald-200" />
          <span className="font-medium text-gray-700">GREEN = AVAILABLE</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="h-3 w-3 rounded-full bg-red-600 ring-2 ring-red-200" />
          <span className="font-medium text-gray-700">RED = CONFIRMED</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="h-3 w-3 rounded-full bg-amber-500 ring-2 ring-amber-200" />
          <span className="font-medium text-gray-700">YELLOW = HOLD / TOKEN</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="h-3 w-3 rounded-full bg-gray-900 ring-2 ring-gray-400" />
          <span className="font-medium text-gray-700">BLACK = BLOCKED</span>
        </div>
      </div>

      {/* Big Calendar Container */}
      <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm min-h-[680px]">
        {availabilityLoading ? (
          <div className="flex h-96 items-center justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-red-600 border-t-transparent" />
          </div>
        ) : (
          <BigCalendar
            localizer={localizer}
            events={events}
            startAccessor="start"
            endAccessor="end"
            selectable
            onSelectSlot={handleSelectSlot}
            onSelectEvent={(event) => setSelectedEvent(event as unknown as CalendarAvailabilityEvent)}
            views={[Views.MONTH, Views.WEEK, Views.AGENDA]}
            defaultView={Views.MONTH}
            style={{ height: 600 }}
            eventPropGetter={(event: any) => {
              let bg = "#10b981"; // GREEN
              let text = "#ffffff";
              let border = "1px solid #059669";

              if (event.status === "CONFIRMED") {
                bg = "#dc2626"; // RED
                text = "#ffffff";
                border = "1px solid #b91c1c";
              } else if (event.status === "HOLD") {
                bg = "#eab308"; // YELLOW
                text = "#713f12";
                border = "1px solid #ca8a04";
              } else if (event.status === "BLOCKED") {
                bg = "#111827"; // BLACK
                text = "#ffffff";
                border = "1px solid #000000";
              }

              return {
                style: {
                  backgroundColor: bg,
                  color: text,
                  borderRadius: "6px",
                  border,
                  fontWeight: 600,
                  fontSize: "11px",
                  padding: "2px 6px",
                },
              };
            }}
          />
        )}
      </div>

      {/* Selected Event Details Modal */}
      {selectedEvent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl">
            <div className="flex items-center justify-between border-b pb-3 mb-4">
              <div>
                <span className="text-xs font-semibold uppercase tracking-wider text-red-600">
                  {selectedEvent.status}
                </span>
                <h3 className="font-bold text-gray-900 text-lg">{selectedEvent.title}</h3>
              </div>
              <button onClick={() => setSelectedEvent(null)} className="text-gray-400 hover:text-gray-600">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-3 text-sm">
              <div className="rounded-xl bg-gray-50 p-3 grid grid-cols-2 gap-2 text-xs">
                <div>
                  <span className="text-gray-400">Date</span>
                  <p className="font-bold text-gray-900">{String(selectedEvent.start).slice(0, 15)}</p>
                </div>
                <div>
                  <span className="text-gray-400">Booking #</span>
                  <p className="font-mono font-bold text-gray-900">{selectedEvent.bookingNumber || "N/A"}</p>
                </div>
                {selectedEvent.customerName && (
                  <div>
                    <span className="text-gray-400">Customer</span>
                    <p className="font-semibold text-gray-900">{selectedEvent.customerName}</p>
                  </div>
                )}
                {selectedEvent.customerPhone && (
                  <div>
                    <span className="text-gray-400">Phone</span>
                    <p className="font-semibold text-gray-900">{selectedEvent.customerPhone}</p>
                  </div>
                )}
              </div>

              {selectedEvent.totalAmount !== undefined && (
                <div className="rounded-xl border border-gray-200 p-3 text-xs space-y-1.5">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Total Rent</span>
                    <span className="font-bold text-gray-900">
                      PKR {Number(selectedEvent.totalAmount).toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between text-green-700">
                    <span>Advance Received</span>
                    <span className="font-bold">
                      PKR {Number(selectedEvent.advanceAmount || 0).toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between text-amber-700">
                    <span>Remaining Due</span>
                    <span className="font-bold">
                      PKR {Number(selectedEvent.remainingAmount || 0).toLocaleString()}
                    </span>
                  </div>
                </div>
              )}

              {selectedEvent.status === "HOLD" && selectedEvent.holdExpiresAt && (
                <div className="rounded-xl bg-amber-50 p-3 text-xs text-amber-800 flex items-center gap-2">
                  <Clock className="h-4 w-4 shrink-0 text-amber-600" />
                  <span>
                    Hold expires:{" "}
                    <strong>{new Date(selectedEvent.holdExpiresAt).toLocaleString()}</strong>
                  </span>
                </div>
              )}

              {selectedEvent.reason && (
                <div className="rounded-xl bg-gray-100 p-3 text-xs text-gray-700">
                  <span className="font-bold">Reason:</span> {selectedEvent.reason}
                </div>
              )}
            </div>

            {/* Action buttons if HOLD */}
            {selectedEvent.status === "HOLD" && selectedEvent.id && (
              <div className="mt-6 flex items-center justify-end gap-2 border-t pt-3">
                <button
                  onClick={() => {
                    if (confirm("Cancel this hold and release date?")) {
                      cancelBookingMutation.mutate({ id: selectedEvent.id, reason: "Cancelled by owner" });
                    }
                  }}
                  className="rounded-xl border border-red-200 px-3 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-50"
                >
                  Release Hold
                </button>
                <button
                  onClick={() =>
                    confirmBookingMutation.mutate({
                      id: selectedEvent.id,
                      advanceAmount: selectedEvent.advanceAmount || 0,
                    })
                  }
                  className="rounded-xl bg-green-600 px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-green-700"
                >
                  Confirm Reservation
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Create Booking Modal */}
      {bookingModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-xl rounded-2xl bg-white p-6 shadow-xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b pb-3 mb-4">
              <div>
                <h3 className="font-bold text-gray-900 text-lg">Create Booking / Token Hold</h3>
                <p className="text-xs text-gray-500">Event date: {bookingForm.eventDate}</p>
              </div>
              <button onClick={() => setBookingModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                <X className="h-5 w-5" />
              </button>
            </div>

            {bookingError && (
              <div className="mb-4 flex items-center gap-2 rounded-xl bg-red-50 p-3 text-xs text-red-700 border border-red-200">
                <AlertCircle className="h-4 w-4 shrink-0 text-red-600" />
                <span>{bookingError}</span>
              </div>
            )}

            <form onSubmit={handleBookingSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700">Customer Name</label>
                  <input
                    type="text"
                    required
                    value={bookingForm.customerName}
                    onChange={(e) => setBookingForm({ ...bookingForm, customerName: e.target.value })}
                    placeholder="Muhammad Bilal"
                    className="mt-1 w-full rounded-xl border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-red-600 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700">Customer Phone</label>
                  <input
                    type="tel"
                    required
                    value={bookingForm.customerPhone}
                    onChange={(e) => setBookingForm({ ...bookingForm, customerPhone: e.target.value })}
                    placeholder="0312-3456789"
                    className="mt-1 w-full rounded-xl border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-red-600 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700">Event Date</label>
                  <input
                    type="date"
                    required
                    value={bookingForm.eventDate}
                    onChange={(e) => setBookingForm({ ...bookingForm, eventDate: e.target.value })}
                    className="mt-1 w-full rounded-xl border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-red-600 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700">Event Type</label>
                  <select
                    value={bookingForm.eventType}
                    onChange={(e) => setBookingForm({ ...bookingForm, eventType: e.target.value })}
                    className="mt-1 w-full rounded-xl border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-red-600 focus:outline-none"
                  >
                    <option value="BARAT">Barat</option>
                    <option value="WALIMA">Walima</option>
                    <option value="MEHNDI">Mehndi</option>
                    <option value="OTHER">Other / Corporate</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700">Booking Type</label>
                  <select
                    value={bookingForm.status}
                    onChange={(e) => setBookingForm({ ...bookingForm, status: e.target.value as any })}
                    className="mt-1 w-full rounded-xl border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-red-600 focus:outline-none"
                  >
                    <option value="HOLD">Temporary Hold (Token)</option>
                    <option value="CONFIRMED">Confirmed Reservation</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700">Total Amount (PKR)</label>
                  <input
                    type="number"
                    required
                    value={bookingForm.totalAmount}
                    onChange={(e) => setBookingForm({ ...bookingForm, totalAmount: Number(e.target.value) })}
                    className="mt-1 w-full rounded-xl border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-red-600 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700">Advance Paid (PKR)</label>
                  <input
                    type="number"
                    value={bookingForm.advanceAmount}
                    onChange={(e) => setBookingForm({ ...bookingForm, advanceAmount: Number(e.target.value) })}
                    className="mt-1 w-full rounded-xl border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-red-600 focus:outline-none"
                  />
                </div>
              </div>

              {bookingForm.status === "HOLD" && (
                <div>
                  <label className="block text-xs font-semibold text-gray-700">Hold Duration</label>
                  <select
                    value={bookingForm.holdHours}
                    onChange={(e) => setBookingForm({ ...bookingForm, holdHours: Number(e.target.value) })}
                    className="mt-1 w-full rounded-xl border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-red-600 focus:outline-none"
                  >
                    <option value={24}>24 Hours</option>
                    <option value={48}>48 Hours</option>
                    <option value={72}>72 Hours</option>
                  </select>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-gray-700">Special Notes</label>
                <textarea
                  rows={2}
                  value={bookingForm.notes}
                  onChange={(e) => setBookingForm({ ...bookingForm, notes: e.target.value })}
                  placeholder="Stage decor theme, DJ sound timing, catering details..."
                  className="mt-1 w-full rounded-xl border border-gray-300 p-2.5 text-xs text-gray-900 focus:border-red-600 focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setBookingModalOpen(false)}
                  className="rounded-xl border border-gray-200 px-4 py-2 text-xs font-semibold text-gray-600 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createBookingMutation.isPending}
                  className="rounded-xl bg-red-600 px-4 py-2 text-xs font-semibold text-white hover:bg-red-700 disabled:opacity-50"
                >
                  {createBookingMutation.isPending ? "Creating..." : "Save Booking"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Block Date Modal */}
      {blockModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
            <div className="flex items-center justify-between border-b pb-3 mb-4">
              <h3 className="font-bold text-gray-900 text-lg">Block Date for Maintenance</h3>
              <button onClick={() => setBlockModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                <X className="h-5 w-5" />
              </button>
            </div>

            {blockError && (
              <div className="mb-4 flex items-center gap-2 rounded-xl bg-red-50 p-3 text-xs text-red-700 border border-red-200">
                <AlertCircle className="h-4 w-4 shrink-0 text-red-600" />
                <span>{blockError}</span>
              </div>
            )}

            <form onSubmit={handleBlockSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700">Date to Block</label>
                <input
                  type="date"
                  required
                  value={blockForm.date}
                  onChange={(e) => setBlockForm({ ...blockForm, date: e.target.value })}
                  className="mt-1 w-full rounded-xl border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-red-600 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700">Reason</label>
                <input
                  type="text"
                  required
                  value={blockForm.reason}
                  onChange={(e) => setBlockForm({ ...blockForm, reason: e.target.value })}
                  placeholder="e.g. Annual painting, deep cleaning, personal event"
                  className="mt-1 w-full rounded-xl border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-red-600 focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setBlockModalOpen(false)}
                  className="rounded-xl border border-gray-200 px-4 py-2 text-xs font-semibold text-gray-600 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={blockDateMutation.isPending}
                  className="rounded-xl bg-gray-900 px-4 py-2 text-xs font-semibold text-white hover:bg-black disabled:opacity-50"
                >
                  {blockDateMutation.isPending ? "Blocking..." : "Block Date"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
