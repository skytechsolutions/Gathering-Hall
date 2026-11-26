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
  Building2,
  Lock,
  Sun,
  Moon,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  Calendar as CalendarIcon,
  CalendarDays,
  ArrowRight,
  ChevronDown,
  X,
  AlertCircle,
} from "lucide-react";

type CalendarViewMode = "month" | "week" | "agenda";
type SessionType = "DAY" | "NIGHT";

export default function AvailabilityCalendarPage() {
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();

  // Hall Selection
  const [selectedHallId, setSelectedHallId] = useState<string>(searchParams.get("hallId") || "");

  // Calendar State: Defaults to 2 November 2026 to mirror target screenshot
  const [currentDate, setCurrentDate] = useState<Date>(new Date(2026, 10, 2));
  const [viewMode, setViewMode] = useState<CalendarViewMode>("month");
  const [activeSession, setActiveSession] = useState<SessionType>("DAY");

  // Selected date key for the active day popover card (e.g., Day 02 in screenshot)
  const [selectedDateKey, setSelectedDateKey] = useState<string>("2026-11-02");

  // Quick date jump popover
  const [showDatePicker, setShowDatePicker] = useState<boolean>(false);
  const [quickDateInput, setQuickDateInput] = useState<string>("");

  // New Booking Modal State
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
    eventDate: "2026-11-02",
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
    date: "2026-11-02",
    session: "BOTH" as "DAY" | "NIGHT" | "BOTH",
    reason: "Renovation / Hall Maintenance",
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
  const { data: availabilityData, refetch: refetchAvailability } = useQuery({
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

  // Monthly Statistics Breakdown (Current session & Month)
  const monthStats = useMemo(() => {
    const startM = startOfMonth(currentDate);
    const endM = endOfMonth(currentDate);
    const daysInMonth = eachDayOfInterval({ start: startM, end: endM });

    let availableCount = 0;
    let bookedCount = 0;
    let holdCount = 0;
    let blockedCount = 0;

    for (const day of daysInMonth) {
      const dateKey = format(day, "yyyy-MM-dd");
      const dayData = availabilityMap.get(dateKey);
      const sessionEvt = dayData?.[activeSession];

      if (!sessionEvt) {
        availableCount++;
      } else if (sessionEvt.status === "CONFIRMED") {
        bookedCount++;
      } else if (sessionEvt.status === "HOLD") {
        holdCount++;
      } else if (sessionEvt.status === "BLOCKED") {
        blockedCount++;
      } else {
        availableCount++;
      }
    }

    return {
      availableCount,
      bookedCount,
      holdCount,
      blockedCount,
      totalDays: daysInMonth.length,
    };
  }, [currentDate, activeSession, availabilityMap]);

  // Navigation handlers (Exactly 1 Month shift)
  const handlePrev = () => {
    if (viewMode === "month") {
      const prevM = subMonths(currentDate, 1);
      setCurrentDate(prevM);
      setSelectedDateKey(format(prevM, "yyyy-MM-02"));
    } else if (viewMode === "week") {
      setCurrentDate(subWeeks(currentDate, 1));
    } else {
      const prevM = subMonths(currentDate, 1);
      setCurrentDate(prevM);
      setSelectedDateKey(format(prevM, "yyyy-MM-02"));
    }
  };

  const handleNext = () => {
    if (viewMode === "month") {
      const nextM = addMonths(currentDate, 1);
      setCurrentDate(nextM);
      // Automatically updates selected day into the target month (e.g. December 2026)
      setSelectedDateKey(format(nextM, "yyyy-MM-02"));
    } else if (viewMode === "week") {
      setCurrentDate(addWeeks(currentDate, 1));
    } else {
      const nextM = addMonths(currentDate, 1);
      setCurrentDate(nextM);
      setSelectedDateKey(format(nextM, "yyyy-MM-02"));
    }
  };

  // Date jump picker handler
  const handleDateJump = (targetDateStr: string) => {
    try {
      const parsed = parseISO(targetDateStr);
      if (isValid(parsed)) {
        setCurrentDate(parsed);
        setSelectedDateKey(targetDateStr);
        setShowDatePicker(false);
      }
    } catch {
      // ignore
    }
  };

  // Helper to open booking modal for a specific date and session
  const openBookingFor = (dateStr: string, session: SessionType = activeSession) => {
    setBookingForm((prev) => ({
      ...prev,
      eventDate: dateStr,
      session,
    }));
    setBookingError(null);
    setBookingModalOpen(true);
  };

  // Helper to open block modal for a specific date
  const openBlockFor = (dateStr: string, session: "DAY" | "NIGHT" | "BOTH" = activeSession) => {
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

  // Popover target day details
  const selectedDayDetails = useMemo(() => {
    if (!selectedDateKey) return null;
    const dayData = availabilityMap.get(selectedDateKey);
    const dayEvt = dayData?.DAY;
    const nightEvt = dayData?.NIGHT;

    return {
      dateKey: selectedDateKey,
      dayEvt,
      nightEvt,
      dayStatus: !dayEvt ? "Available" : dayEvt.status === "CONFIRMED" ? "Confirmed" : dayEvt.status,
      nightStatus: !nightEvt ? "Available" : nightEvt.status === "CONFIRMED" ? "Confirmed" : nightEvt.status,
    };
  }, [selectedDateKey, availabilityMap]);

  return (
    <div className="h-full flex-1 min-h-0 flex flex-col justify-between space-y-1.5 lg:space-y-2 max-w-[1600px] w-full mx-auto select-none overflow-hidden">
      {/* ============================================================== */}
      {/* 1. HEADER SECTION (Top Row)                                   */}
      {/* ============================================================== */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 shrink-0">
        {/* Title & Icon */}
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-xl bg-slate-100 text-[#3b3c44] shrink-0">
            <CalendarIcon className="h-4.5 w-4.5 sm:h-5 sm:w-5 stroke-[2.2]" />
          </div>
          <div>
            <h1 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight leading-none">
              Availability Calendar
            </h1>
            <p className="text-[11px] text-slate-500 font-medium mt-0.5">
              Manage hall reservations and block dates easily
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Hall Selector Pill Dropdown */}
          <div className="relative">
            <div className="flex items-center gap-2 rounded-full border border-slate-200/90 bg-white px-3 py-1.5 text-xs font-bold text-slate-800 hover:border-slate-300">
              <Building2 className="h-3.5 w-3.5 text-slate-700 shrink-0" />
              <select
                value={activeHallId}
                onChange={(e) => setSelectedHallId(e.target.value)}
                className="bg-transparent pr-1 font-bold text-slate-800 outline-none cursor-pointer text-xs"
              >
                {hallsData && hallsData.length > 0 ? (
                  hallsData.map((hall) => (
                    <option key={hall.id} value={hall.id}>
                      {hall.name} ({hall.city})
                    </option>
                  ))
                ) : (
                  <option value="">No Active Halls Available</option>
                )}
              </select>
              <ChevronDown className="h-3 w-3 text-slate-500 shrink-0" />
            </div>
          </div>

          {/* Block Date Pill Button */}
          <button
            onClick={() => openBlockFor(selectedDateKey, activeSession)}
            className="flex items-center gap-1.5 rounded-full border border-slate-200/90 bg-white px-3.5 py-1.5 text-xs font-bold text-slate-800 hover:bg-slate-50 transition cursor-pointer"
          >
            <Lock className="h-3.5 w-3.5 text-slate-700" />
            <span>Block Date</span>
          </button>

          {/* Book Date Solid Blue Pill Button */}
          <button
            onClick={() => openBookingFor(selectedDateKey, activeSession)}
            className="flex items-center gap-1.5 rounded-full bg-[#3b3c44] hover:bg-[#2b2c33] text-white px-4 py-1.5 text-xs font-bold transition cursor-pointer"
          >
            <CalendarIcon className="h-3.5 w-3.5" />
            <span>Book Date</span>
          </button>
        </div>
      </div>

      {/* ============================================================== */}
      {/* 2. LEGEND BAR                                                  */}
      {/* ============================================================== */}
      <div className="rounded-xl bg-white border border-slate-200/80 px-4 py-1.5 flex flex-wrap items-center justify-center gap-4 sm:gap-8 text-[11px] sm:text-xs font-bold text-slate-700 shrink-0">
        <div className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-[#10b981]" />
          <span>Available</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-[#ef4444]" />
          <span>Confirmed</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-[#f59e0b]" />
          <span>Hold / Token</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-[#0f172a]" />
          <span>Blocked</span>
        </div>
      </div>

      {/* ============================================================== */}
      {/* 3. CALENDAR CONTROLS & DAY / NIGHT SEGMENTED SELECTOR          */}
      {/* ============================================================== */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 shrink-0">
        {/* Left: View Mode Pills (Month, Week, Agenda) */}
        <div className="flex items-center gap-1 bg-white p-0.5 rounded-full border border-slate-200/80 self-start">
          <button
            onClick={() => setViewMode("month")}
            className={`flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold transition cursor-pointer ${
              viewMode === "month"
                ? "bg-[#3b3c44] text-white"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <CalendarIcon className="h-3 w-3" />
            <span>Month</span>
          </button>
          <button
            onClick={() => setViewMode("week")}
            className={`flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold transition cursor-pointer ${
              viewMode === "week"
                ? "bg-[#3b3c44] text-white"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <CalendarDays className="h-3 w-3" />
            <span>Week</span>
          </button>
          <button
            onClick={() => setViewMode("agenda")}
            className={`flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold transition cursor-pointer ${
              viewMode === "agenda"
                ? "bg-[#3b3c44] text-white"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <span>≡ Agenda</span>
          </button>
        </div>

        {/* Center: Month Navigation (< [icon] Month Year >) */}
        <div className="relative flex items-center justify-center gap-2">
          <button
            onClick={handlePrev}
            className="p-1 rounded-full text-slate-700 hover:text-slate-950 hover:bg-slate-100 transition cursor-pointer"
            aria-label="Previous month"
            title="Previous month"
          >
            <ChevronLeft className="h-4.5 w-4.5 stroke-[2.5]" />
          </button>

          <button
            onClick={() => setShowDatePicker(!showDatePicker)}
            className="flex items-center gap-1.5 text-sm sm:text-base font-extrabold text-slate-900 hover:text-[#3b3c44] transition cursor-pointer px-2 py-0.5 rounded-lg hover:bg-slate-50"
            title="Click to jump to date"
          >
            <CalendarIcon className="h-4 w-4 text-slate-800 stroke-[2.2]" />
            <span>{format(currentDate, "MMMM yyyy")}</span>
          </button>

          <button
            onClick={handleNext}
            className="p-1 rounded-full text-slate-700 hover:text-slate-950 hover:bg-slate-100 transition cursor-pointer"
            aria-label="Next month"
            title="Next month"
          >
            <ChevronRight className="h-4.5 w-4.5 stroke-[2.5]" />
          </button>

          {/* Quick Date Jump Popover */}
          {showDatePicker && (
            <div className="absolute top-9 z-50 rounded-xl bg-white p-3 border border-slate-200 text-xs space-y-2 w-64 animate-fadeIn">
              <p className="font-bold text-slate-800">Jump directly to month / date:</p>
              <input
                type="date"
                value={quickDateInput}
                onChange={(e) => {
                  setQuickDateInput(e.target.value);
                  if (e.target.value) handleDateJump(e.target.value);
                }}
                className="w-full rounded-xl border border-slate-200 p-2 text-xs text-slate-800 outline-none focus:border-[#3b3c44]"
              />
              <div className="flex justify-between items-center pt-1 border-t border-slate-100">
                <button
                  onClick={() => {
                    setCurrentDate(new Date(2026, 10, 2));
                    setSelectedDateKey("2026-11-02");
                    setShowDatePicker(false);
                  }}
                  className="text-[#3b3c44] font-bold hover:underline"
                >
                  Nov 2026
                </button>
                <button
                  onClick={() => {
                    setCurrentDate(new Date(2026, 11, 2));
                    setSelectedDateKey("2026-12-02");
                    setShowDatePicker(false);
                  }}
                  className="text-[#3b3c44] font-bold hover:underline"
                >
                  Dec 2026
                </button>
                <button
                  onClick={() => setShowDatePicker(false)}
                  className="text-slate-400 hover:text-slate-600"
                >
                  Close
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Right: DAY / NIGHT SEGMENTED SELECTOR */}
        <div className="flex items-center gap-1 bg-white p-0.5 rounded-full border border-slate-200/80 self-start sm:self-auto">
          <button
            onClick={() => setActiveSession("DAY")}
            className={`flex items-center gap-1 px-3.5 sm:px-4 py-1 rounded-full text-xs font-bold transition-all cursor-pointer ${
              activeSession === "DAY"
                ? "bg-[#3b3c44] text-white"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <Sun className={`h-3.5 w-3.5 ${activeSession === "DAY" ? "text-amber-300 fill-amber-300" : "text-amber-500"}`} />
            <span>Day</span>
          </button>
          <button
            onClick={() => setActiveSession("NIGHT")}
            className={`flex items-center gap-1 px-3.5 sm:px-4 py-1 rounded-full text-xs font-bold transition-all cursor-pointer ${
              activeSession === "NIGHT"
                ? "bg-[#3b3c44] text-white"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <Moon className={`h-3.5 w-3.5 ${activeSession === "NIGHT" ? "text-indigo-200 fill-indigo-200" : "text-indigo-500"}`} />
            <span>Night</span>
          </button>
        </div>
      </div>

      {/* ============================================================== */}
      {/* 4. MAIN CALENDAR GRID + RIGHT COLUMN (Fitted in Screen)         */}
      {/* ============================================================== */}
      <div className="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-4 gap-2.5 lg:gap-3 items-stretch">
        {/* Calendar Grid Container (3 Columns on Desktop) */}
        <div className="lg:col-span-3 rounded-2xl border border-slate-200/80 bg-white flex flex-col relative h-full min-h-0">
          {/* Day of Week Headers */}
          <div className="grid grid-cols-7 border-b border-slate-200/80 bg-slate-50/70 text-center text-[11px] sm:text-xs font-bold text-slate-800 py-1.5 shrink-0 select-none">
            <div>Mon</div>
            <div>Tue</div>
            <div>Wed</div>
            <div>Thu</div>
            <div>Fri</div>
            <div>Sat</div>
            <div>Sun</div>
          </div>

          {/* Month View Grid: Exactly 1 Month focused with no pills on out-of-month days */}
          {viewMode === "month" && (
            <div
              className="grid grid-cols-7 divide-x divide-y divide-slate-100 flex-1 min-h-0 h-full relative"
              style={{
                gridTemplateRows: `repeat(${monthDays.length / 7}, minmax(0, 1fr))`,
              }}
            >
              {monthDays.map((day, idx) => {
                const dateKey = format(day, "yyyy-MM-dd");
                const dayNumStr = format(day, "dd");
                const isCurrentMonth = isSameMonth(day, currentDate);
                const rowIndex = Math.floor(idx / 7);
                const colIndex = idx % 7;

                // Is this date selected
                const isSelected = selectedDateKey === dateKey && isCurrentMonth;

                // Lookup session status
                const daySessions = availabilityMap.get(dateKey);
                const currentSessionEvent = daySessions?.[activeSession];

                // Status logic for current month days only
                const status = !currentSessionEvent ? "AVAILABLE" : currentSessionEvent.status;

                let pillBg = "bg-[#ecfdf5]";
                let pillText = "text-[#059669]";
                let dotColor = "bg-[#10b981]";
                let label = "Available";

                if (status === "CONFIRMED") {
                  pillBg = "bg-[#fef2f2]";
                  pillText = "text-[#dc2626]";
                  dotColor = "bg-[#ef4444]";
                  label = "Booked";
                } else if (status === "HOLD") {
                  pillBg = "bg-[#fffbeb]";
                  pillText = "text-[#d97706]";
                  dotColor = "bg-[#f59e0b]";
                  label = "Hold";
                } else if (status === "BLOCKED") {
                  pillBg = "bg-slate-100";
                  pillText = "text-slate-800";
                  dotColor = "bg-[#0f172a]";
                  label = "Blocked";
                }

                return (
                  <div
                    key={idx}
                    onClick={() => {
                      if (isCurrentMonth) setSelectedDateKey(dateKey);
                    }}
                    className={`relative p-1 sm:p-1.5 min-h-0 h-full flex flex-col justify-between transition-all select-none ${
                      !isCurrentMonth
                        ? "bg-slate-50/20 text-slate-300 pointer-events-none"
                        : "bg-white text-slate-800 cursor-pointer"
                    } ${
                      isSelected
                        ? "border-2 border-[#3b3c44] rounded-xl bg-slate-100/40 z-40"
                        : isCurrentMonth
                        ? "hover:bg-slate-50/80 z-10"
                        : "z-0"
                    }`}
                  >
                    {/* Top Row: Day Number in top-right */}
                    <div className="flex items-center justify-end leading-none">
                      <span
                        className={`text-[11px] sm:text-xs font-extrabold ${
                          isSelected
                            ? "text-[#3b3c44]"
                            : isCurrentMonth
                            ? "text-slate-800"
                            : "text-slate-300"
                        }`}
                      >
                        {dayNumStr}
                      </span>
                    </div>

                    {/* Bottom Row: Status Pill (ONLY rendered on Current Month days!) */}
                    {isCurrentMonth ? (
                      <div className="mt-auto flex items-center">
                        <div
                          className={`inline-flex items-center gap-1 sm:gap-1.5 px-1.5 sm:px-2 py-0.5 rounded-full text-[9px] sm:text-[10px] font-bold ${pillBg} ${pillText} leading-tight truncate max-w-full`}
                        >
                          <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${dotColor}`} />
                          <span className="truncate">{label}</span>
                        </div>
                      </div>
                    ) : (
                      <div className="h-4" />
                    )}

                    {/* Popover Card (Matches Screenshot 1 Floating Over Selected Day with Smart Positioning) */}
                    {isSelected && selectedDayDetails && (
                      <div
                        onClick={(e) => e.stopPropagation()}
                        className={`absolute z-50 w-56 sm:w-60 rounded-2xl bg-white p-3.5 sm:p-4 border border-slate-200 animate-fadeIn ${
                          rowIndex >= 3 ? "bottom-2 sm:bottom-4" : "top-9 sm:top-11"
                        } ${colIndex >= 4 ? "right-2 sm:right-4" : "left-3 sm:left-5"}`}
                      >
                        <h4 className="text-xs font-black text-slate-900 mb-2.5 flex items-center justify-between">
                          <span>{format(parseISO(selectedDayDetails.dateKey), "dd MMMM yyyy")}</span>
                        </h4>

                        <div className="space-y-2 text-xs mb-3">
                          {/* Day Session Info */}
                          <div className="rounded-xl p-2 bg-slate-50 border border-slate-100 space-y-1">
                            <div className="flex items-center justify-between font-bold">
                              <div className="flex items-center gap-1.5">
                                <Sun className="h-3.5 w-3.5 text-amber-500 fill-amber-500" />
                                <span className="text-slate-700">Day Session:</span>
                              </div>
                              <span
                                className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                                  selectedDayDetails.dayEvt?.status === "CONFIRMED"
                                    ? "bg-red-50 text-red-600 border border-red-200"
                                    : selectedDayDetails.dayEvt?.status === "HOLD"
                                    ? "bg-amber-50 text-amber-600 border border-amber-200"
                                    : selectedDayDetails.dayEvt?.status === "BLOCKED"
                                    ? "bg-slate-200 text-slate-800"
                                    : "bg-emerald-50 text-[#059669] border border-emerald-200"
                                }`}
                              >
                                {selectedDayDetails.dayEvt?.status === "CONFIRMED" ? "Booked" : selectedDayDetails.dayStatus}
                              </span>
                            </div>
                            {selectedDayDetails.dayEvt && (
                              <div className="text-[11px] text-slate-500 pl-5 leading-tight">
                                <span className="font-bold text-slate-800">{selectedDayDetails.dayEvt.customerName}</span>
                                {selectedDayDetails.dayEvt.bookingNumber && (
                                  <span className="text-[10px] text-slate-400 block font-mono">
                                    {selectedDayDetails.dayEvt.bookingNumber}
                                  </span>
                                )}
                              </div>
                            )}
                          </div>

                          {/* Night Session Info */}
                          <div className="rounded-xl p-2 bg-slate-50 border border-slate-100 space-y-1">
                            <div className="flex items-center justify-between font-bold">
                              <div className="flex items-center gap-1.5">
                                <Moon className="h-3.5 w-3.5 text-indigo-500 fill-indigo-500" />
                                <span className="text-slate-700">Night Session:</span>
                              </div>
                              <span
                                className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                                  selectedDayDetails.nightEvt?.status === "CONFIRMED"
                                    ? "bg-red-50 text-red-600 border border-red-200"
                                    : selectedDayDetails.nightEvt?.status === "HOLD"
                                    ? "bg-amber-50 text-amber-600 border border-amber-200"
                                    : selectedDayDetails.nightEvt?.status === "BLOCKED"
                                    ? "bg-slate-200 text-slate-800"
                                    : "bg-emerald-50 text-[#059669] border border-emerald-200"
                                }`}
                              >
                                {selectedDayDetails.nightEvt?.status === "CONFIRMED" ? "Booked" : selectedDayDetails.nightStatus}
                              </span>
                            </div>
                            {selectedDayDetails.nightEvt && (
                              <div className="text-[11px] text-slate-500 pl-5 leading-tight">
                                <span className="font-bold text-slate-800">{selectedDayDetails.nightEvt.customerName}</span>
                                {selectedDayDetails.nightEvt.bookingNumber && (
                                  <span className="text-[10px] text-slate-400 block font-mono">
                                    {selectedDayDetails.nightEvt.bookingNumber}
                                  </span>
                                )}
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Action Button: Book available session or indicate reserved */}
                        {(() => {
                          const currentEvt = activeSession === "DAY" ? selectedDayDetails.dayEvt : selectedDayDetails.nightEvt;
                          const otherSession = activeSession === "DAY" ? "NIGHT" : "DAY";
                          const otherEvt = otherSession === "DAY" ? selectedDayDetails.dayEvt : selectedDayDetails.nightEvt;

                          if (!currentEvt) {
                            return (
                              <button
                                onClick={() => openBookingFor(selectedDayDetails.dateKey, activeSession)}
                                className="w-full flex items-center justify-center gap-1.5 rounded-xl bg-[#3b3c44] hover:bg-[#2b2c33] text-white py-1.5 sm:py-2 px-3 text-xs font-bold transition cursor-pointer"
                              >
                                <span>Book {activeSession === "DAY" ? "Day" : "Night"} Session</span>
                                <ArrowRight className="h-3.5 w-3.5" />
                              </button>
                            );
                          } else if (!otherEvt) {
                            return (
                              <button
                                onClick={() => openBookingFor(selectedDayDetails.dateKey, otherSession)}
                                className="w-full flex items-center justify-center gap-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white py-1.5 sm:py-2 px-3 text-xs font-bold transition cursor-pointer"
                              >
                                <span>Book {otherSession === "DAY" ? "Day" : "Night"} Session</span>
                                <ArrowRight className="h-3.5 w-3.5" />
                              </button>
                            );
                          } else {
                            return (
                              <div className="w-full py-2 text-center rounded-xl bg-slate-100 text-slate-500 text-xs font-bold border border-slate-200">
                                Fully Reserved
                              </div>
                            );
                          }
                        })()}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* Week View Grid */}
          {viewMode === "week" && (
            <div className="grid grid-cols-7 divide-x divide-slate-100 flex-1 min-h-0 p-2">
              {weekDays.map((day, idx) => {
                const dateKey = format(day, "yyyy-MM-dd");
                const daySessions = availabilityMap.get(dateKey);
                const currentSessionEvent = daySessions?.[activeSession];
                const status = !currentSessionEvent ? "AVAILABLE" : currentSessionEvent.status;

                return (
                  <div
                    key={idx}
                    onClick={() => setSelectedDateKey(dateKey)}
                    className="p-2 sm:p-3 flex flex-col justify-between rounded-xl hover:bg-slate-50 cursor-pointer transition min-h-0"
                  >
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-400">{format(day, "EEE")}</span>
                        <span className="text-sm font-black text-slate-900">{format(day, "dd")}</span>
                      </div>
                      <div className="mt-2.5">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold ${
                            status === "AVAILABLE"
                              ? "bg-emerald-50 text-emerald-700"
                              : status === "CONFIRMED"
                              ? "bg-red-50 text-red-700"
                              : status === "HOLD"
                              ? "bg-amber-50 text-amber-700"
                              : "bg-slate-100 text-slate-800"
                          }`}
                        >
                          <span
                            className={`h-1.5 w-1.5 rounded-full ${
                              status === "AVAILABLE"
                                ? "bg-emerald-500"
                                : status === "CONFIRMED"
                                ? "bg-red-500"
                                : status === "HOLD"
                                ? "bg-amber-400"
                                : "bg-slate-900"
                            }`}
                          />
                          <span>{status}</span>
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Agenda View */}
          {viewMode === "agenda" && (
            <div className="p-3 sm:p-4 space-y-2 flex-1 min-h-0 overflow-y-auto">
              {availabilityData?.events && availabilityData.events.length > 0 ? (
                availabilityData.events
                  .filter((e) => e.session === activeSession)
                  .map((evt) => (
                    <div
                      key={evt.id}
                      className="flex items-center justify-between p-2.5 sm:p-3 rounded-xl border border-slate-200 hover:bg-slate-50 cursor-pointer transition text-xs"
                    >
                      <div className="flex items-center gap-2.5">
                        <span
                          className={`h-2.5 w-2.5 rounded-full ${
                            evt.color === "RED"
                              ? "bg-red-500"
                              : evt.color === "YELLOW"
                              ? "bg-amber-400"
                              : "bg-slate-900"
                          }`}
                        />
                        <div>
                          <p className="font-bold text-slate-900">{evt.title}</p>
                          <p className="text-[11px] text-slate-500">
                            {evt.start} • {evt.session === "NIGHT" ? "🌙 Night" : "☀️ Day"}
                          </p>
                        </div>
                      </div>
                      <span className="font-bold text-[#3b3c44]">Details &rarr;</span>
                    </div>
                  ))
              ) : (
                <div className="py-8 text-center text-xs text-slate-400 font-medium">
                  No reservations or blocked dates found for this session.
                </div>
              )}
            </div>
          )}
        </div>

        {/* ============================================================== */}
        {/* 5. RIGHT SIDE SUMMARY COLUMN (Exact 100% Match from Screenshot)*/}
        {/* ============================================================== */}
        <div className="flex flex-col justify-between gap-2 h-full min-h-0">
          {/* Card 1: Gradient Blue Available Days Card */}
          <div className="rounded-2xl bg-gradient-to-br from-[#3b3c44] via-[#2f3037] to-[#25262c] p-3 sm:p-4 text-white relative overflow-hidden flex flex-col justify-center">
            <div className="relative z-10">
              {/* Calendar Icon inside Soft Square */}
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-white/20 text-white mb-1.5">
                <CalendarIcon className="h-4.5 w-4.5 stroke-[2.2]" />
              </div>
              {/* Big bold number */}
              <h3 className="text-2xl sm:text-3xl font-black tracking-tight leading-none">
                {monthStats.availableCount}
              </h3>
              {/* Title */}
              <p className="text-xs font-bold text-white/95 mt-1">
                Available Days
              </p>
            </div>
            {/* Soft decorative wave in bottom right */}
            <div className="absolute -right-6 -bottom-6 w-24 h-24 rounded-xl bg-white/10 blur-xl pointer-events-none" />
          </div>

          {/* Card 2: Breakdown Card */}
          <div className="rounded-2xl border border-slate-200/80 bg-white p-3 space-y-1.5 sm:space-y-2">
            <div className="flex items-center justify-between text-xs font-bold text-slate-700">
              <span className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-[#10b981]" />
                <span>Available Days</span>
              </span>
              <span className="font-extrabold text-slate-900">{monthStats.availableCount} Days</span>
            </div>

            <div className="flex items-center justify-between text-xs font-bold text-slate-700">
              <span className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-[#ef4444]" />
                <span>Booked Days</span>
              </span>
              <span className="font-extrabold text-slate-900">{monthStats.bookedCount} Days</span>
            </div>

            <div className="flex items-center justify-between text-xs font-bold text-slate-700">
              <span className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-[#f59e0b]" />
                <span>Hold Days</span>
              </span>
              <span className="font-extrabold text-slate-900">{monthStats.holdCount} Days</span>
            </div>

            <div className="flex items-center justify-between text-xs font-bold text-slate-700">
              <span className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-[#0f172a]" />
                <span>Blocked Days</span>
              </span>
              <span className="font-extrabold text-slate-900">{monthStats.blockedCount} Day</span>
            </div>
          </div>

          {/* Card 3: Secure & Reliable Card */}
          <div className="rounded-2xl border border-[#a7f3d0] bg-[#ecfdf5] p-2.5 sm:p-3 flex items-center gap-2.5">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-[#10b981] text-white">
              <ShieldCheck className="h-4.5 w-4.5 stroke-[2.2]" />
            </div>
            <div>
              <p className="text-xs font-black text-slate-900 leading-tight">Secure & Reliable</p>
              <p className="text-[10px] text-slate-500 font-medium mt-0.5">Your data is safe with us</p>
            </div>
          </div>
        </div>
      </div>

      {/* ============================================================== */}
      {/* 6. MODALS (Create Booking & Block Date)                         */}
      {/* ============================================================== */}
      {/* Create Booking Modal */}
      <Modal
        isOpen={bookingModalOpen}
        onClose={() => setBookingModalOpen(false)}
        maxWidth="max-w-xl"
      >
        <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
          <div>
            <h3 className="font-extrabold text-slate-900 text-lg">Book Wedding Hall Date</h3>
            <p className="text-xs text-slate-400 font-medium">Create confirmed reservation or temporary token hold</p>
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
                className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs font-bold transition border ${
                  bookingForm.session === "DAY"
                    ? "bg-[#3b3c44] text-white border-[#3b3c44]"
                    : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
                }`}
              >
                <Sun className="h-4 w-4" />
                <span>☀️ Day Session (11am - 4pm)</span>
              </button>

              <button
                type="button"
                onClick={() => setBookingForm((prev) => ({ ...prev, session: "NIGHT" }))}
                className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs font-bold transition border ${
                  bookingForm.session === "NIGHT"
                    ? "bg-[#3b3c44] text-white border-[#3b3c44]"
                    : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
                }`}
              >
                <Moon className="h-4 w-4" />
                <span>🌙 Night Session (6pm - 12am)</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700">Customer Name</label>
              <input
                type="text"
                required
                value={bookingForm.customerName}
                onChange={(e) => setBookingForm({ ...bookingForm, customerName: e.target.value })}
                placeholder="Haji Farooq"
                className="mt-1 w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm text-slate-900 focus:border-[#3b3c44] focus:ring-2 focus:ring-slate-300 focus:outline-none"
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
                className="mt-1 w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm text-slate-900 focus:border-[#3b3c44] focus:ring-2 focus:ring-slate-300 focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700">Event Date</label>
              <input
                type="date"
                required
                value={bookingForm.eventDate}
                onChange={(e) => setBookingForm({ ...bookingForm, eventDate: e.target.value })}
                className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-900 focus:border-[#3b3c44] focus:ring-2 focus:ring-slate-300 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700">Event Type</label>
              <select
                value={bookingForm.eventType}
                onChange={(e) => setBookingForm({ ...bookingForm, eventType: e.target.value })}
                className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-900 focus:border-[#3b3c44] focus:ring-2 focus:ring-slate-300 focus:outline-none"
              >
                <option value="BARAT">Barat</option>
                <option value="WALIMA">Walima</option>
                <option value="MEHNDI">Mehndi</option>
                <option value="OTHER">Other</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700">Booking Status</label>
              <select
                value={bookingForm.status}
                onChange={(e) => setBookingForm({ ...bookingForm, status: e.target.value as any })}
                className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-900 focus:border-[#3b3c44] focus:ring-2 focus:ring-slate-300 focus:outline-none"
              >
                <option value="CONFIRMED">Confirmed</option>
                <option value="HOLD">Hold / Token</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700">Total Amount (PKR)</label>
              <input
                type="number"
                required
                placeholder="0"
                value={bookingForm.totalAmount === 0 || bookingForm.totalAmount === "" ? "" : bookingForm.totalAmount}
                onChange={(e) => setBookingForm({ ...bookingForm, totalAmount: e.target.value === "" ? "" : Number(e.target.value) })}
                className="mt-1 w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm text-slate-900 focus:border-[#3b3c44] focus:ring-2 focus:ring-slate-300 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700">Advance Paid (PKR)</label>
              <input
                type="number"
                placeholder="0"
                value={bookingForm.advanceAmount === 0 || bookingForm.advanceAmount === "" ? "" : bookingForm.advanceAmount}
                onChange={(e) => setBookingForm({ ...bookingForm, advanceAmount: e.target.value === "" ? "" : Number(e.target.value) })}
                className="mt-1 w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm text-slate-900 focus:border-[#3b3c44] focus:ring-2 focus:ring-slate-300 focus:outline-none"
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
              className="mt-1 w-full rounded-xl border border-slate-200 p-3 text-xs text-slate-900 focus:border-[#3b3c44] focus:ring-2 focus:ring-slate-300 focus:outline-none"
            />
          </div>

          <div className="flex justify-end gap-2.5 pt-3 border-t border-slate-100">
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
              className="rounded-xl bg-[#3b3c44] px-5 py-2.5 text-xs font-bold text-white hover:bg-[#2b2c33] disabled:opacity-50 active:scale-95 transition"
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
        <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
          <h3 className="font-extrabold text-slate-900 text-lg">Block Hall Date / Session</h3>
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
              className="mt-1 w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm text-slate-900 focus:border-[#3b3c44] focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700">Session to Block</label>
            <select
              value={blockForm.session}
              onChange={(e) => setBlockForm({ ...blockForm, session: e.target.value as any })}
              className="mt-1 w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm text-slate-900 focus:border-[#3b3c44] focus:outline-none"
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
              className="mt-1 w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm text-slate-900 focus:border-[#3b3c44] focus:outline-none"
            />
          </div>

          <div className="flex justify-end gap-2.5 pt-3 border-t border-slate-100">
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
              className="rounded-xl bg-slate-900 px-5 py-2.5 text-xs font-bold text-white hover:bg-black disabled:opacity-50 transition"
            >
              {blockDateMutation.isPending ? "Blocking..." : "Block Session"}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
