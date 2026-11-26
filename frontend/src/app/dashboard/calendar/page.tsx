"use client";

import { useState, useMemo, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  format,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameMonth,
  addMonths,
  subMonths,
  addWeeks,
  subWeeks,
  parseISO,
  isValid,
} from "date-fns";
import { hallApi, Hall } from "@/services/api/hall.api";
import { bookingApi, CalendarAvailabilityEvent } from "@/services/api/booking.api";
import { Modal } from "@/components/ui/modal";
import {
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  X,
  AlertCircle,
  SunMedium,
  Moon,
} from "lucide-react";

type CalendarViewMode = "month" | "week" | "agenda";
type SessionType = "DAY" | "NIGHT";

export default function AvailabilityCalendarPage() {
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();

  // Hall Selection
  const [selectedHallId, setSelectedHallId] = useState<string>(searchParams.get("hallId") || "");

  // Calendar State: Defaults to 13 January 2027 to mirror 100% the reference design
  const [currentDate, setCurrentDate] = useState<Date>(new Date(2027, 0, 13));
  const [viewMode, setViewMode] = useState<CalendarViewMode>("month");
  const [activeSession, setActiveSession] = useState<SessionType>("DAY");

  // Selected date key (e.g. 13 January 2027 in reference)
  const [selectedDateKey, setSelectedDateKey] = useState<string>("2027-01-13");

  // Booking Modal State
  const [bookingModalOpen, setBookingModalOpen] = useState(false);
  const [bookingForm, setBookingForm] = useState<{
    customerName: string;
    customerPhone: string;
    customerEmail: string;
    customerAddress: string;
    eventDate: string;
    session: SessionType;
    eventType: string;
    status: "HOLD" | "CONFIRMED";
    totalAmount: number | "";
    advanceAmount: number | "";
    holdHours: number;
    notes: string;
  }>({
    customerName: "",
    customerPhone: "",
    customerEmail: "",
    customerAddress: "",
    eventDate: "2027-01-13",
    session: "DAY" as SessionType,
    eventType: "BARAT",
    status: "CONFIRMED" as "HOLD" | "CONFIRMED",
    totalAmount: 150000,
    advanceAmount: 30000,
    holdHours: 48,
    notes: "",
  });
  const [bookingError, setBookingError] = useState<string | null>(null);

  // Block Date Modal State
  const [blockModalOpen, setBlockModalOpen] = useState(false);
  const [blockForm, setBlockForm] = useState({
    date: "2027-01-13",
    session: "BOTH" as "DAY" | "NIGHT" | "BOTH",
    reason: "Hall Maintenance",
  });
  const [blockError, setBlockError] = useState<string | null>(null);

  // Fetch Owner's Halls (Active Only)
  const { data: hallsData } = useQuery({
    queryKey: ["owner-halls-calendar"],
    queryFn: async () => {
      const res = await hallApi.getAll();
      const allHalls = (res as any)?.halls || [];
      const activeOnly = allHalls.filter((h: any) => h.status === "APPROVED");
      return activeOnly as Hall[];
    },
  });

  // Ensure active hall selection always points to an active hall
  useEffect(() => {
    if (hallsData && hallsData.length > 0) {
      if (!selectedHallId || !hallsData.some((h) => h.id === selectedHallId)) {
        setSelectedHallId(hallsData[0].id);
      }
    } else if (hallsData && hallsData.length === 0) {
      setSelectedHallId("");
    }
  }, [hallsData, selectedHallId]);

  const activeHallId = selectedHallId || (hallsData && hallsData[0]?.id) || "";

  // Fetch Availability for Selected Hall
  const { data: availabilityData } = useQuery({
    queryKey: ["hall-availability", activeHallId],
    queryFn: async () => {
      if (!activeHallId) return null;
      const res = await bookingApi.getAvailability(activeHallId);
      return res as unknown as { hall: Hall; events: CalendarAvailabilityEvent[] };
    },
    enabled: !!activeHallId,
    staleTime: 0,
    refetchOnMount: "always",
    refetchOnWindowFocus: true,
  });

  // Map of date string "YYYY-MM-DD" -> { DAY?: event, NIGHT?: event }
  const availabilityMap = useMemo(() => {
    const map = new Map<string, { DAY?: CalendarAvailabilityEvent; NIGHT?: CalendarAvailabilityEvent }>();
    if (!availabilityData?.events) return map;

    for (const evt of availabilityData.events) {
      const dateKey = evt.start; // "YYYY-MM-DD"
      const session = evt.session || "DAY";
      const existing = map.get(dateKey) || {};
      existing[session] = evt;
      map.set(dateKey, existing);
    }
    return map;
  }, [availabilityData]);

  // Calendar dates calculation for Month View (Monday start)
  const monthDays = useMemo(() => {
    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(currentDate);
    const startDate = startOfWeek(monthStart, { weekStartsOn: 1 });
    const endDate = endOfWeek(monthEnd, { weekStartsOn: 1 });
    return eachDayOfInterval({ start: startDate, end: endDate });
  }, [currentDate]);

  // Calendar dates calculation for Week View
  const weekDays = useMemo(() => {
    const startDate = startOfWeek(currentDate, { weekStartsOn: 1 });
    const endDate = endOfWeek(currentDate, { weekStartsOn: 1 });
    return eachDayOfInterval({ start: startDate, end: endDate });
  }, [currentDate]);

  // Monthly 2x2 Overview Statistics (Available days, Booked, On hold, Blocked)
  const monthStats = useMemo(() => {
    const startM = startOfMonth(currentDate);
    const endM = endOfMonth(currentDate);
    const daysInMonth = eachDayOfInterval({ start: startM, end: endM });

    let availableDays = 0;
    let bookedDays = 0;
    let holdDays = 0;
    let blockedDays = 0;

    for (const day of daysInMonth) {
      const dateKey = format(day, "yyyy-MM-dd");
      const dayData = availabilityMap.get(dateKey);
      const dayEvt = dayData?.DAY;
      const nightEvt = dayData?.NIGHT;

      const hasConfirmed = dayEvt?.status === "CONFIRMED" || nightEvt?.status === "CONFIRMED";
      const hasHold = dayEvt?.status === "HOLD" || nightEvt?.status === "HOLD";
      const hasBlocked = dayEvt?.status === "BLOCKED" || nightEvt?.status === "BLOCKED";

      if (hasConfirmed) {
        bookedDays++;
      } else if (hasHold) {
        holdDays++;
      } else if (hasBlocked) {
        blockedDays++;
      } else {
        availableDays++;
      }
    }

    return {
      availableDays,
      bookedDays,
      holdDays,
      blockedDays,
      totalDays: daysInMonth.length,
    };
  }, [currentDate, availabilityMap]);

  // Navigation handlers
  const handlePrev = () => {
    if (viewMode === "month") {
      const prevM = subMonths(currentDate, 1);
      setCurrentDate(prevM);
      setSelectedDateKey(format(prevM, "yyyy-MM-13"));
    } else if (viewMode === "week") {
      setCurrentDate(subWeeks(currentDate, 1));
    } else {
      const prevM = subMonths(currentDate, 1);
      setCurrentDate(prevM);
      setSelectedDateKey(format(prevM, "yyyy-MM-13"));
    }
  };

  const handleNext = () => {
    if (viewMode === "month") {
      const nextM = addMonths(currentDate, 1);
      setCurrentDate(nextM);
      setSelectedDateKey(format(nextM, "yyyy-MM-13"));
    } else if (viewMode === "week") {
      setCurrentDate(addWeeks(currentDate, 1));
    } else {
      const nextM = addMonths(currentDate, 1);
      setCurrentDate(nextM);
      setSelectedDateKey(format(nextM, "yyyy-MM-13"));
    }
  };

  // Helper to open booking modal for a specific date and session
  const openBookingFor = (dateStr: string, session: SessionType = "DAY") => {
    setBookingForm((prev) => ({
      ...prev,
      eventDate: dateStr,
      session,
    }));
    setBookingError(null);
    setBookingModalOpen(true);
  };

  // Helper to open block modal for a specific date
  const openBlockFor = (dateStr: string, session: "DAY" | "NIGHT" | "BOTH" = "BOTH") => {
    setBlockForm((prev) => ({
      ...prev,
      date: dateStr,
      session,
    }));
    setBlockError(null);
    setBlockModalOpen(true);
  };

  // Mutations
  const createBookingMutation = useMutation({
    mutationFn: (data: any) => bookingApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["hall-availability", activeHallId] });
      queryClient.invalidateQueries({ queryKey: ["owner-bookings"] });
      queryClient.invalidateQueries({ queryKey: ["owner-overview"] });
      setBookingModalOpen(false);
    },
    onError: (err: any) => {
      setBookingError(err?.response?.data?.message || err?.message || "Failed to create booking.");
    },
  });

  const blockDateMutation = useMutation({
    mutationFn: (data: any) => bookingApi.blockDate(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["hall-availability", activeHallId] });
      setBlockModalOpen(false);
    },
    onError: (err: any) => {
      setBlockError(err?.response?.data?.message || err?.message || "Failed to block date.");
    },
  });

  const handleBookingSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setBookingError(null);
    if (!activeHallId) {
      setBookingError("Please select a hall first.");
      return;
    }
    createBookingMutation.mutate({
      ...bookingForm,
      totalAmount: Number(bookingForm.totalAmount) || 0,
      advanceAmount: Number(bookingForm.advanceAmount) || 0,
      hallId: activeHallId,
    });
  };

  const handleBlockSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setBlockError(null);
    if (!activeHallId) {
      setBlockError("Please select a hall first.");
      return;
    }
    blockDateMutation.mutate({
      hallId: activeHallId,
      date: blockForm.date,
      reason: blockForm.reason,
      session: blockForm.session,
    });
  };

  // Target Selected Day Data for Right Sidebar Card
  const selectedDate = useMemo(() => {
    if (!selectedDateKey) return currentDate;
    try {
      const parsed = parseISO(selectedDateKey);
      return isValid(parsed) ? parsed : currentDate;
    } catch {
      return currentDate;
    }
  }, [selectedDateKey, currentDate]);

  const selectedDayOfWeek = useMemo(() => {
    return format(selectedDate, "EEEE").toUpperCase();
  }, [selectedDate]);

  const selectedFormattedDate = useMemo(() => {
    return format(selectedDate, "d MMMM yyyy");
  }, [selectedDate]);

  const selectedDaySessions = useMemo(() => {
    if (!selectedDateKey) return null;
    return availabilityMap.get(selectedDateKey) || null;
  }, [selectedDateKey, availabilityMap]);

  const selDayEvt = selectedDaySessions?.DAY;
  const selNightEvt = selectedDaySessions?.NIGHT;

  return (
    <div className="min-h-full p-4 sm:p-6 lg:p-8 bg-[#f5f0e8] text-[#1f2421] space-y-6 select-none font-sans">
      {/* ============================================================== */}
      {/* 1. TOP HEADER SECTION (Title, Subtitle, Hall Dropdown, Actions)*/}
      {/* ============================================================== */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="font-serif text-3xl sm:text-4xl font-normal text-[#1f2421] tracking-tight">
            Availability
          </h1>
          <p className="text-xs sm:text-sm text-[#6c726d] font-normal mt-1">
            Day and night sessions for every date, at a glance.
          </p>
        </div>

        {/* Right Controls: Hall Select, Block date, New booking */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Hall Selector Dropdown */}
          <div className="relative">
            <select
              value={activeHallId}
              onChange={(e) => setSelectedHallId(e.target.value)}
              className="appearance-none rounded-lg border border-[#d6cec3] bg-white pl-3.5 pr-8 py-2 text-sm text-[#1f2421] font-medium outline-none cursor-pointer hover:border-[#b8ad9e] transition shadow-2xs"
            >
              {hallsData && hallsData.length > 0 ? (
                hallsData.map((hall) => (
                  <option key={hall.id} value={hall.id}>
                    {hall.name}, {hall.city}
                  </option>
                ))
              ) : (
                <option value="">No Active Halls Available</option>
              )}
            </select>
            <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#7a7368]" />
          </div>

          {/* Block Date Button */}
          <button
            onClick={() => openBlockFor(selectedDateKey || format(currentDate, "yyyy-MM-dd"), "BOTH")}
            className="rounded-lg border border-[#1f2421]/80 bg-transparent px-4 py-2 text-sm font-medium text-[#1f2421] hover:bg-black/5 transition cursor-pointer"
          >
            Block date
          </button>

          {/* New Booking Button */}
          <button
            onClick={() => openBookingFor(selectedDateKey || format(currentDate, "yyyy-MM-dd"), "DAY")}
            className="rounded-lg bg-[#1e382b] hover:bg-[#162a20] px-4 py-2 text-sm font-medium text-white transition cursor-pointer shadow-xs active:scale-[0.98]"
          >
            New booking
          </button>
        </div>
      </div>

      {/* ============================================================== */}
      {/* 2. SUB-HEADER BAR (Month/Week/Agenda Tabs + Month Navigation)   */}
      {/* ============================================================== */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        {/* Left: View Mode Segmented Switcher */}
        <div className="inline-flex items-center gap-1 rounded-lg bg-[#ebe3d7] p-1 self-start">
          <button
            onClick={() => setViewMode("month")}
            className={`rounded-md px-3.5 py-1.5 text-xs sm:text-sm font-medium transition cursor-pointer ${
              viewMode === "month"
                ? "bg-white text-[#1f2421] shadow-2xs"
                : "text-[#5c564d] hover:text-[#1f2421]"
            }`}
          >
            Month
          </button>
          <button
            onClick={() => setViewMode("week")}
            className={`rounded-md px-3.5 py-1.5 text-xs sm:text-sm font-medium transition cursor-pointer ${
              viewMode === "week"
                ? "bg-white text-[#1f2421] shadow-2xs"
                : "text-[#5c564d] hover:text-[#1f2421]"
            }`}
          >
            Week
          </button>
          <button
            onClick={() => setViewMode("agenda")}
            className={`rounded-md px-3.5 py-1.5 text-xs sm:text-sm font-medium transition cursor-pointer ${
              viewMode === "agenda"
                ? "bg-white text-[#1f2421] shadow-2xs"
                : "text-[#5c564d] hover:text-[#1f2421]"
            }`}
          >
            Agenda
          </button>
        </div>

        {/* Center/Right: Month Navigation (< January 2027 >) */}
        <div className="flex items-center justify-center sm:justify-start gap-4">
          <button
            onClick={handlePrev}
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-[#d6cec3] bg-white text-[#1f2421] hover:bg-[#f7f3ec] transition cursor-pointer shadow-2xs"
            aria-label="Previous month"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>

          <h2 className="font-serif text-xl sm:text-2xl font-normal text-[#1f2421] min-w-[160px] text-center select-none">
            {format(currentDate, "MMMM yyyy")}
          </h2>

          <button
            onClick={handleNext}
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-[#d6cec3] bg-white text-[#1f2421] hover:bg-[#f7f3ec] transition cursor-pointer shadow-2xs"
            aria-label="Next month"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* ============================================================== */}
      {/* 3. MAIN BODY (Calendar Card on Left, Sidebar on Right)         */}
      {/* ============================================================== */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* Left Column (8 cols): Calendar Grid Card */}
        <div className="lg:col-span-8 rounded-2xl border border-[#e5ded4] bg-[#faf7f2] overflow-hidden shadow-2xs">
          {/* Day Names Header */}
          <div className="grid grid-cols-7 border-b border-[#e5ded4] bg-[#faf7f2] text-center text-[11px] font-semibold tracking-wider text-[#6b655b] py-3 select-none">
            <div>MON</div>
            <div>TUE</div>
            <div>WED</div>
            <div>THU</div>
            <div>FRI</div>
            <div>SAT</div>
            <div>SUN</div>
          </div>

          {/* Month View Grid */}
          {viewMode === "month" && (
            <div className="grid grid-cols-7 divide-x divide-y divide-[#e5ded4]">
              {monthDays.map((day, idx) => {
                const dateKey = format(day, "yyyy-MM-dd");
                const dayNum = format(day, "d");
                const isCurrentMonth = isSameMonth(day, currentDate);
                const isSelected = selectedDateKey === dateKey && isCurrentMonth;

                const dayData = availabilityMap.get(dateKey);
                const dayEvt = dayData?.DAY;
                const nightEvt = dayData?.NIGHT;

                const isDayConfirmed = dayEvt?.status === "CONFIRMED";
                const isNightConfirmed = nightEvt?.status === "CONFIRMED";
                const hasBooking = isDayConfirmed || isNightConfirmed;

                let bookedLabel: string | null = null;
                if (isDayConfirmed && isNightConfirmed) {
                  bookedLabel = "Fully booked";
                } else if (isDayConfirmed) {
                  bookedLabel = "Day booked";
                } else if (isNightConfirmed) {
                  bookedLabel = "Night booked";
                } else if (dayEvt?.status === "HOLD" || nightEvt?.status === "HOLD") {
                  bookedLabel = "On hold";
                } else if (dayEvt?.status === "BLOCKED" || nightEvt?.status === "BLOCKED") {
                  bookedLabel = "Blocked";
                }

                return (
                  <div
                    key={idx}
                    onClick={() => {
                      if (isCurrentMonth) setSelectedDateKey(dateKey);
                    }}
                    className={`relative p-2 sm:p-2.5 min-h-[74px] sm:min-h-[92px] flex flex-col justify-between transition select-none ${
                      !isCurrentMonth
                        ? "bg-[#f5f0e8]/40 text-[#a8a29e] pointer-events-none"
                        : isSelected
                        ? "bg-white ring-2 ring-[#1e382b] ring-inset z-10 cursor-pointer"
                        : hasBooking
                        ? "bg-[#faebe8] hover:bg-[#f7e3df] cursor-pointer"
                        : "bg-[#faf7f2] hover:bg-[#f3ede3] cursor-pointer"
                    }`}
                  >
                    {/* Top Row: Date Number and Optional Booked Label */}
                    <div>
                      <span
                        className={`text-xs sm:text-sm font-semibold leading-none ${
                          !isCurrentMonth
                            ? "text-[#a8a29e]"
                            : hasBooking
                            ? "text-[#8c2d25]"
                            : "text-[#1f2421]"
                        }`}
                      >
                        {dayNum}
                      </span>
                      {isCurrentMonth && bookedLabel && (
                        <span className="text-[10px] sm:text-[11px] font-medium text-[#8c2d25] block leading-tight mt-1 truncate">
                          {bookedLabel}
                        </span>
                      )}
                    </div>

                    {/* Bottom Row: Left dot (Day) & Right dot (Night) */}
                    {isCurrentMonth ? (
                      <div className="flex items-center gap-1.5 mt-auto pt-2">
                        {/* Left dot: Day Session */}
                        <span
                          title={`Day Session: ${dayEvt ? dayEvt.status : "Available"}`}
                          className={
                            !dayEvt
                              ? "h-2 w-2 sm:h-2.5 sm:w-2.5 rounded-full border border-[#8c857b] bg-transparent"
                              : dayEvt.status === "CONFIRMED"
                              ? "h-2 w-2 sm:h-2.5 sm:w-2.5 rounded-full bg-[#a83226]"
                              : dayEvt.status === "HOLD"
                              ? "h-2 w-2 sm:h-2.5 sm:w-2.5 rounded-full bg-[#d97706]"
                              : "h-2 w-2 sm:h-2.5 sm:w-2.5 rounded-xs bg-[#1f2421]"
                          }
                        />

                        {/* Right dot: Night Session */}
                        <span
                          title={`Night Session: ${nightEvt ? nightEvt.status : "Available"}`}
                          className={
                            !nightEvt
                              ? "h-2 w-2 sm:h-2.5 sm:w-2.5 rounded-full border border-[#8c857b] bg-transparent"
                              : nightEvt.status === "CONFIRMED"
                              ? "h-2 w-2 sm:h-2.5 sm:w-2.5 rounded-full bg-[#a83226]"
                              : nightEvt.status === "HOLD"
                              ? "h-2 w-2 sm:h-2.5 sm:w-2.5 rounded-full bg-[#d97706]"
                              : "h-2 w-2 sm:h-2.5 sm:w-2.5 rounded-xs bg-[#1f2421]"
                          }
                        />
                      </div>
                    ) : (
                      <div className="h-2.5" />
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* Week View */}
          {viewMode === "week" && (
            <div className="grid grid-cols-7 divide-x divide-[#e5ded4] p-2">
              {weekDays.map((day, idx) => {
                const dateKey = format(day, "yyyy-MM-dd");
                const daySessions = availabilityMap.get(dateKey);
                const dayEvt = daySessions?.DAY;
                const nightEvt = daySessions?.NIGHT;

                return (
                  <div
                    key={idx}
                    onClick={() => setSelectedDateKey(dateKey)}
                    className={`p-3 min-h-[140px] flex flex-col justify-between rounded-xl cursor-pointer transition ${
                      selectedDateKey === dateKey ? "bg-white ring-2 ring-[#1e382b]" : "hover:bg-[#f3ede3]"
                    }`}
                  >
                    <div>
                      <span className="text-[11px] font-semibold text-[#7a7368] uppercase">{format(day, "EEE")}</span>
                      <h4 className="text-base font-bold text-[#1f2421]">{format(day, "d")}</h4>
                    </div>
                    <div className="space-y-1.5 mt-3 text-[11px]">
                      <div className="flex items-center gap-1.5">
                        <span
                          className={
                            !dayEvt
                              ? "h-2 w-2 rounded-full border border-[#8c857b]"
                              : dayEvt.status === "CONFIRMED"
                              ? "h-2 w-2 rounded-full bg-[#a83226]"
                              : "h-2 w-2 rounded-full bg-[#d97706]"
                          }
                        />
                        <span className="text-[#5c564d] truncate">Day</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span
                          className={
                            !nightEvt
                              ? "h-2 w-2 rounded-full border border-[#8c857b]"
                              : nightEvt.status === "CONFIRMED"
                              ? "h-2 w-2 rounded-full bg-[#a83226]"
                              : "h-2 w-2 rounded-full bg-[#d97706]"
                          }
                        />
                        <span className="text-[#5c564d] truncate">Night</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Agenda View */}
          {viewMode === "agenda" && (
            <div className="p-4 space-y-2 max-h-[500px] overflow-y-auto divide-y divide-[#e5ded4]">
              {availabilityData?.events && availabilityData.events.length > 0 ? (
                availabilityData.events.map((evt) => (
                  <div
                    key={evt.id}
                    onClick={() => setSelectedDateKey(evt.start)}
                    className="pt-2.5 pb-2.5 flex items-center justify-between hover:bg-[#f3ede3] px-2 rounded-lg cursor-pointer transition text-xs"
                  >
                    <div>
                      <p className="font-bold text-sm text-[#1f2421]">{evt.title}</p>
                      <p className="text-[11px] text-[#7a7368]">
                        {evt.start} • {evt.session === "NIGHT" ? "🌙 Night" : "☀️ Day"}
                      </p>
                    </div>
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${
                        evt.status === "CONFIRMED"
                          ? "bg-[#faebe8] text-[#a83226]"
                          : evt.status === "HOLD"
                          ? "bg-amber-50 text-amber-700"
                          : "bg-slate-200 text-slate-800"
                      }`}
                    >
                      {evt.status}
                    </span>
                  </div>
                ))
              ) : (
                <div className="py-12 text-center text-xs text-[#7a7368]">
                  No reservations or blocked dates recorded for this month.
                </div>
              )}
            </div>
          )}

          {/* Bottom Legend Bar */}
          <div className="border-t border-[#e5ded4] px-4 py-3 bg-[#faf7f2] flex flex-wrap items-center gap-x-6 gap-y-2 text-xs text-[#5c564d] select-none">
            <span className="font-medium text-[#1f2421]">Left dot: day session</span>
            <span className="font-medium text-[#1f2421]">Right dot: night session</span>
            <span className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full border border-[#8c857b] bg-transparent" />
              <span>Available</span>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full bg-[#a83226]" />
              <span>Confirmed</span>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full bg-[#d97706]" />
              <span>Hold / token</span>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-xs bg-[#1f2421]" />
              <span>Blocked</span>
            </span>
          </div>
        </div>

        {/* Right Column (4 cols): Selected Day Card + 2x2 Overview Card */}
        <div className="lg:col-span-4 space-y-5">
          {/* Card 1: Selected Day Details Card */}
          <div className="rounded-2xl border border-[#e5ded4] bg-[#faf7f2] p-5 shadow-2xs">
            <span className="text-[11px] font-semibold text-[#7a7368] uppercase tracking-wider block">
              {selectedDayOfWeek}
            </span>
            <h3 className="font-serif text-2xl font-normal text-[#1f2421] mt-0.5 pb-4 border-b border-[#e5ded4]">
              {selectedFormattedDate}
            </h3>

            {/* Sessions List */}
            <div className="space-y-4 py-4">
              {/* Day Session */}
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h4 className="font-bold text-sm text-[#1f2421]">Day session</h4>
                  <p className="text-xs text-[#7a7368] mt-0.5">
                    {!selDayEvt
                      ? "Open for booking"
                      : selDayEvt.status === "CONFIRMED"
                      ? `Booked • ${selDayEvt.customerName || "Customer"}`
                      : selDayEvt.status === "HOLD"
                      ? `Hold • ${selDayEvt.customerName || "Customer"}`
                      : "Blocked session"}
                  </p>
                </div>
                <div>
                  {!selDayEvt ? (
                    <span className="inline-block rounded-full border border-[#7a7368]/60 px-3 py-1 text-xs font-medium text-[#1f2421]">
                      Available
                    </span>
                  ) : selDayEvt.status === "CONFIRMED" ? (
                    <span className="inline-block rounded-full bg-[#faebe8] border border-[#a83226]/40 text-[#a83226] px-3 py-1 text-xs font-semibold">
                      Booked
                    </span>
                  ) : selDayEvt.status === "HOLD" ? (
                    <span className="inline-block rounded-full bg-amber-50 border border-amber-300 text-amber-700 px-3 py-1 text-xs font-semibold">
                      Hold
                    </span>
                  ) : (
                    <span className="inline-block rounded-full bg-slate-200 text-slate-800 px-3 py-1 text-xs font-semibold">
                      Blocked
                    </span>
                  )}
                </div>
              </div>

              {/* Night Session */}
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h4 className="font-bold text-sm text-[#1f2421]">Night session</h4>
                  <p className="text-xs text-[#7a7368] mt-0.5">
                    {!selNightEvt
                      ? "Open for booking"
                      : selNightEvt.status === "CONFIRMED"
                      ? `Booked • ${selNightEvt.customerName || "Customer"}`
                      : selNightEvt.status === "HOLD"
                      ? `Hold • ${selNightEvt.customerName || "Customer"}`
                      : "Blocked session"}
                  </p>
                </div>
                <div>
                  {!selNightEvt ? (
                    <span className="inline-block rounded-full border border-[#7a7368]/60 px-3 py-1 text-xs font-medium text-[#1f2421]">
                      Available
                    </span>
                  ) : selNightEvt.status === "CONFIRMED" ? (
                    <span className="inline-block rounded-full bg-[#faebe8] border border-[#a83226]/40 text-[#a83226] px-3 py-1 text-xs font-semibold">
                      Booked
                    </span>
                  ) : selNightEvt.status === "HOLD" ? (
                    <span className="inline-block rounded-full bg-amber-50 border border-amber-300 text-amber-700 px-3 py-1 text-xs font-semibold">
                      Hold
                    </span>
                  ) : (
                    <span className="inline-block rounded-full bg-slate-200 text-slate-800 px-3 py-1 text-xs font-semibold">
                      Blocked
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Action Button: Book this date */}
            {!selDayEvt || !selNightEvt ? (
              <button
                onClick={() =>
                  openBookingFor(
                    selectedDateKey || format(currentDate, "yyyy-MM-dd"),
                    !selDayEvt ? "DAY" : "NIGHT"
                  )
                }
                className="w-full mt-2 rounded-xl bg-[#1e382b] hover:bg-[#162a20] text-white py-3 text-sm font-semibold transition text-center shadow-xs cursor-pointer active:scale-[0.99]"
              >
                Book this date
              </button>
            ) : (
              <button
                disabled
                className="w-full mt-2 rounded-xl bg-slate-200 text-slate-500 py-3 text-sm font-semibold text-center cursor-not-allowed"
              >
                Fully booked
              </button>
            )}
          </div>

          {/* Card 2: 2x2 Monthly Statistics Card */}
          <div className="rounded-2xl border border-[#e5ded4] bg-[#faf7f2] overflow-hidden shadow-2xs divide-y divide-[#e5ded4]">
            <div className="grid grid-cols-2 divide-x divide-[#e5ded4]">
              <div className="p-4 sm:p-5">
                <div className="font-serif text-3xl sm:text-4xl font-normal text-[#1f2421]">
                  {monthStats.availableDays}
                </div>
                <p className="text-xs text-[#7a7368] mt-1 font-medium">Available days</p>
              </div>
              <div className="p-4 sm:p-5">
                <div className="font-serif text-3xl sm:text-4xl font-normal text-[#1f2421]">
                  {monthStats.bookedDays}
                </div>
                <p className="text-xs text-[#7a7368] mt-1 font-medium">Booked</p>
              </div>
            </div>
            <div className="grid grid-cols-2 divide-x divide-[#e5ded4]">
              <div className="p-4 sm:p-5">
                <div className="font-serif text-3xl sm:text-4xl font-normal text-[#1f2421]">
                  {monthStats.holdDays}
                </div>
                <p className="text-xs text-[#7a7368] mt-1 font-medium">On hold</p>
              </div>
              <div className="p-4 sm:p-5">
                <div className="font-serif text-3xl sm:text-4xl font-normal text-[#1f2421]">
                  {monthStats.blockedDays}
                </div>
                <p className="text-xs text-[#7a7368] mt-1 font-medium">Blocked</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ============================================================== */}
      {/* 4. MODALS (Create Booking & Block Date)                         */}
      {/* ============================================================== */}
      {/* Create Booking Modal */}
      <Modal
        isOpen={bookingModalOpen}
        onClose={() => setBookingModalOpen(false)}
        maxWidth="max-w-xl"
      >
        <div className="flex items-center justify-between border-b border-[#e5ded4] pb-3 mb-4">
          <div>
            <h3 className="font-serif text-xl text-[#1f2421]">Book Wedding Hall Date</h3>
            <p className="text-xs text-[#7a7368]">Create confirmed reservation or temporary token hold</p>
          </div>
          <button
            onClick={() => setBookingModalOpen(false)}
            className="text-slate-400 hover:text-slate-600 rounded-lg p-1"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {bookingError && (
          <div className="mb-4 flex items-center gap-2 rounded-xl bg-rose-50 p-3.5 text-xs text-rose-700 border border-rose-200">
            <AlertCircle className="h-4 w-4 shrink-0 text-rose-600" />
            <span>{bookingError}</span>
          </div>
        )}

        <form onSubmit={handleBookingSubmit} className="space-y-4">
          {/* Session Selector (Day / Night) */}
          <div>
            <label className="block text-xs font-bold text-slate-700">Booking Session</label>
            <div className="grid grid-cols-2 gap-2.5 mt-1.5">
              <button
                type="button"
                onClick={() => setBookingForm((prev) => ({ ...prev, session: "DAY" }))}
                className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs font-bold transition border cursor-pointer ${
                  bookingForm.session === "DAY"
                    ? "bg-[#1e382b] text-white border-[#1e382b]"
                    : "bg-white text-gray-700 border-gray-200 hover:bg-gray-50"
                }`}
              >
                <SunMedium className="h-4 w-4" />
                <span>☀️ Day Session (11am - 4pm)</span>
              </button>

              <button
                type="button"
                onClick={() => setBookingForm((prev) => ({ ...prev, session: "NIGHT" }))}
                className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs font-bold transition border cursor-pointer ${
                  bookingForm.session === "NIGHT"
                    ? "bg-[#1e382b] text-white border-[#1e382b]"
                    : "bg-white text-gray-700 border-gray-200 hover:bg-gray-50"
                }`}
              >
                <Moon className="h-4 w-4" />
                <span>🌙 Night Session (6pm - 12am)</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-xs font-bold text-slate-700">Customer Name</label>
              <input
                type="text"
                required
                value={bookingForm.customerName}
                onChange={(e) => setBookingForm({ ...bookingForm, customerName: e.target.value })}
                placeholder="Full Name"
                className="mt-1 w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm text-slate-900 focus:border-[#1e382b] focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700">Phone Number</label>
              <input
                type="tel"
                required
                value={bookingForm.customerPhone}
                onChange={(e) => setBookingForm({ ...bookingForm, customerPhone: e.target.value })}
                placeholder="0300-1234567"
                className="mt-1 w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm text-slate-900 focus:border-[#1e382b] focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
            <div>
              <label className="block text-xs font-bold text-slate-700">Event Date</label>
              <input
                type="date"
                required
                value={bookingForm.eventDate}
                onChange={(e) => setBookingForm({ ...bookingForm, eventDate: e.target.value })}
                className="mt-1 w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm text-slate-900 focus:border-[#1e382b] focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700">Event Type</label>
              <select
                value={bookingForm.eventType}
                onChange={(e) => setBookingForm({ ...bookingForm, eventType: e.target.value })}
                className="mt-1 w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm text-slate-900 focus:border-[#1e382b] focus:outline-none"
              >
                <option value="BARAT">Barat</option>
                <option value="WALIMA">Walima</option>
                <option value="MEHNDI">Mehndi</option>
                <option value="ENGAGEMENT">Engagement</option>
                <option value="CORPORATE">Corporate</option>
                <option value="OTHER">Other</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700">Booking Status</label>
              <select
                value={bookingForm.status}
                onChange={(e) => setBookingForm({ ...bookingForm, status: e.target.value as "HOLD" | "CONFIRMED" })}
                className="mt-1 w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm text-slate-900 focus:border-[#1e382b] focus:outline-none"
              >
                <option value="CONFIRMED">Confirmed</option>
                <option value="HOLD">Temporary Hold (Token)</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-xs font-bold text-slate-700">Total Rent (PKR)</label>
              <input
                type="number"
                required
                value={bookingForm.totalAmount}
                onChange={(e) => setBookingForm({ ...bookingForm, totalAmount: Number(e.target.value) })}
                className="mt-1 w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm text-slate-900 focus:border-[#1e382b] focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700">Advance Paid (PKR)</label>
              <input
                type="number"
                placeholder="0"
                value={bookingForm.advanceAmount === 0 || bookingForm.advanceAmount === "" ? "" : bookingForm.advanceAmount}
                onChange={(e) => setBookingForm({ ...bookingForm, advanceAmount: e.target.value === "" ? "" : Number(e.target.value) })}
                className="mt-1 w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm text-slate-900 focus:border-[#1e382b] focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700">Special Notes</label>
            <textarea
              rows={2}
              value={bookingForm.notes}
              onChange={(e) => setBookingForm({ ...bookingForm, notes: e.target.value })}
              placeholder="Stage decoration, catering, sound system requirements..."
              className="mt-1 w-full rounded-xl border border-slate-200 p-3 text-xs text-slate-900 focus:border-[#1e382b] focus:outline-none"
            />
          </div>

          <div className="flex justify-end gap-2.5 pt-3 border-t border-[#e5ded4]">
            <button
              type="button"
              onClick={() => setBookingModalOpen(false)}
              className="rounded-xl border border-slate-200 px-4 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-50 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={createBookingMutation.isPending}
              className="rounded-xl bg-[#1e382b] hover:bg-[#162a20] px-5 py-2.5 text-xs font-bold text-white disabled:opacity-50 transition cursor-pointer"
            >
              {createBookingMutation.isPending ? "Booking..." : "Confirm Booking"}
            </button>
          </div>
        </form>
      </Modal>

      {/* Block Date Modal */}
      <Modal
        isOpen={blockModalOpen}
        onClose={() => setBlockModalOpen(false)}
        maxWidth="max-w-md"
      >
        <div className="flex items-center justify-between border-b border-[#e5ded4] pb-3 mb-4">
          <h3 className="font-serif text-xl text-[#1f2421]">Block Hall Date / Session</h3>
          <button
            onClick={() => setBlockModalOpen(false)}
            className="text-slate-400 hover:text-slate-600 rounded-lg p-1"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {blockError && (
          <div className="mb-4 flex items-center gap-2 rounded-xl bg-rose-50 p-3 text-xs text-rose-700 border border-rose-200">
            <AlertCircle className="h-4 w-4 shrink-0 text-rose-600" />
            <span>{blockError}</span>
          </div>
        )}

        <form onSubmit={handleBlockSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700">Date to Block</label>
            <input
              type="date"
              required
              value={blockForm.date}
              onChange={(e) => setBlockForm({ ...blockForm, date: e.target.value })}
              className="mt-1 w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm text-slate-900 focus:border-[#1e382b] focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700">Session to Block</label>
            <select
              value={blockForm.session}
              onChange={(e) => setBlockForm({ ...blockForm, session: e.target.value as any })}
              className="mt-1 w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm text-slate-900 focus:border-[#1e382b] focus:outline-none"
            >
              <option value="BOTH">Full Day (Day & Night)</option>
              <option value="DAY">☀️ Day Session Only</option>
              <option value="NIGHT">🌙 Night Session Only</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700">Reason</label>
            <input
              type="text"
              required
              value={blockForm.reason}
              onChange={(e) => setBlockForm({ ...blockForm, reason: e.target.value })}
              className="mt-1 w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm text-slate-900 focus:border-[#1e382b] focus:outline-none"
            />
          </div>

          <div className="flex justify-end gap-2.5 pt-3 border-t border-[#e5ded4]">
            <button
              type="button"
              onClick={() => setBlockModalOpen(false)}
              className="rounded-xl border border-slate-200 px-4 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-50 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={blockDateMutation.isPending}
              className="rounded-xl bg-[#1e382b] hover:bg-[#162a20] px-5 py-2.5 text-xs font-bold text-white disabled:opacity-50 transition cursor-pointer"
            >
              {blockDateMutation.isPending ? "Blocking..." : "Block Session"}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
