"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { reportApi } from "@/services/api/report.api";
import { bookingApi } from "@/services/api/booking.api";
import {
  Bell,
  Clock,
  CalendarDays,
  CheckCircle2,
  Users,
  Building2,
  Percent,
  X,
  Check,
  Trash2,
  RotateCcw,
  ArrowLeft,
  Sparkles,
} from "lucide-react";

export interface NotificationItem {
  id: string;
  title: string;
  message: string;
  time: string;
  type: "warning" | "info" | "success" | "alert";
  link: string;
  icon: any;
}

interface NotificationBellProps {
  role: "HALL_OWNER" | "SUPER_ADMIN";
}

export function NotificationBell({ role }: NotificationBellProps) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [view, setView] = useState<"active" | "trash">("active");
  const [readIds, setReadIds] = useState<string[]>([]);
  const [trashedIds, setTrashedIds] = useState<string[]>([]);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const readStorageKey = `gathering_hall_read_notifications_${role}`;
  const trashStorageKey = `gathering_hall_trashed_notifications_${role}`;

  // Load read & trashed notification IDs from localStorage on mount
  useEffect(() => {
    try {
      const storedRead = localStorage.getItem(readStorageKey);
      if (storedRead) setReadIds(JSON.parse(storedRead));

      const storedTrash = localStorage.getItem(trashStorageKey);
      if (storedTrash) setTrashedIds(JSON.parse(storedTrash));
    } catch {
      // Ignore storage errors
    }
  }, [readStorageKey, trashStorageKey]);

  // Click outside and escape key handling
  useEffect(() => {
    if (!isOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
        setView("active");
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setIsOpen(false);
        setView("active");
      }
    };

    window.addEventListener("mousedown", handleClickOutside);
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("mousedown", handleClickOutside);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  // Query live overview metrics
  const { data: overviewData } = useQuery({
    queryKey: [role === "SUPER_ADMIN" ? "super-admin-overview" : "owner-overview"],
    queryFn: async () => {
      const res = await reportApi.getOverview();
      return res as any;
    },
    staleTime: 30000,
  });

  // Query active holds for Hall Owner
  const { data: holdsData } = useQuery({
    queryKey: ["owner-active-holds-notifications"],
    queryFn: async () => {
      if (role !== "HALL_OWNER") return [];
      const res = await bookingApi.getAll({ status: "HOLD", limit: 5 });
      return (res as any)?.bookings || [];
    },
    enabled: role === "HALL_OWNER",
    staleTime: 30000,
  });

  // Synthesize notifications from live data
  const allNotifications: NotificationItem[] = [];

  if (role === "HALL_OWNER") {
    // 1. Expiring Holds alerts
    if (holdsData && holdsData.length > 0) {
      holdsData.forEach((b: any) => {
        const isNight = b.notes?.includes("[SESSION:NIGHT]");
        allNotifications.push({
          id: `hold-${b.id}`,
          title: "Temporary Hold Active",
          message: `${b.customerName} on ${b.eventDate} (${isNight ? "🌙 Night" : "☀️ Day"}) requires confirmation.`,
          time: b.holdExpiresAt
            ? `Expires: ${new Date(b.holdExpiresAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`
            : "Active Hold",
          type: "warning",
          link: "/dashboard/bookings",
          icon: Clock,
        });
      });
    }

    // 2. Upcoming events from overview
    if (overviewData?.upcomingEvents && overviewData.upcomingEvents.length > 0) {
      overviewData.upcomingEvents.slice(0, 3).forEach((evt: any) => {
        const isNight = evt.notes?.includes("[SESSION:NIGHT]");
        allNotifications.push({
          id: `evt-${evt.id}`,
          title: `Upcoming ${evt.eventType || "Wedding"} Event`,
          message: `${evt.customerName} scheduled at ${evt.hall?.name || "venue"} (${isNight ? "🌙 Night" : "☀️ Day"}).`,
          time: `Date: ${evt.eventDate}`,
          type: "info",
          link: "/dashboard/calendar",
          icon: CalendarDays,
        });
      });
    }

    // 3. Hall readiness alert
    allNotifications.push({
      id: "owner-venue-ready",
      title: "Venue & Calendar Live",
      message: "Real-time Day/Night slot reservations and customer ledger are synchronized.",
      time: "System Live",
      type: "success",
      link: "/dashboard/calendar",
      icon: CheckCircle2,
    });
  } else {
    // SUPER_ADMIN Notifications: Hall Owner & System Administration
    if (overviewData?.pendingOwners > 0) {
      allNotifications.push({
        id: `sa-pending-owners-${overviewData.pendingOwners}`,
        title: "Pending Owner Approvals",
        message: `${overviewData.pendingOwners} new hall owner registration(s) require verification.`,
        time: "Action Required",
        type: "warning",
        link: "/super-admin/owners",
        icon: Users,
      });
    }

    allNotifications.push({
      id: "sa-owners-directory-live",
      title: "Owner Accounts Active",
      message: `${overviewData?.approvedOwners || overviewData?.totalOwners || 0} registered hall owner account(s) active on the platform.`,
      time: "Accounts Synced",
      type: "success",
      link: "/super-admin/owners",
      icon: Users,
    });

    allNotifications.push({
      id: "sa-all-systems-live",
      title: "Super Admin Platform Active",
      message: "System administration and owner account controls operational.",
      time: "All Systems Operational",
      type: "info",
      link: "/super-admin",
      icon: CheckCircle2,
    });
  }

  // Split into active and trashed lists
  const activeNotifications = allNotifications.filter((n) => !trashedIds.includes(n.id));
  const trashedNotifications = allNotifications.filter((n) => trashedIds.includes(n.id));

  // Count unread strictly among active notifications
  const unreadCount = activeNotifications.filter((n) => !readIds.includes(n.id)).length;

  const markAllAsRead = () => {
    const allActiveIds = activeNotifications.map((n) => n.id);
    const updated = Array.from(new Set([...readIds, ...allActiveIds]));
    setReadIds(updated);
    try {
      localStorage.setItem(readStorageKey, JSON.stringify(updated));
    } catch {}
  };

  const handleNotificationClick = (item: NotificationItem) => {
    if (!readIds.includes(item.id)) {
      const updated = [...readIds, item.id];
      setReadIds(updated);
      try {
        localStorage.setItem(readStorageKey, JSON.stringify(updated));
      } catch {}
    }
    setIsOpen(false);
    setView("active");
    router.push(item.link);
  };

  // Move single notification to Recycle Bin
  const moveToTrash = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updatedTrash = Array.from(new Set([...trashedIds, id]));
    setTrashedIds(updatedTrash);
    try {
      localStorage.setItem(trashStorageKey, JSON.stringify(updatedTrash));
    } catch {}
  };

  // Restore single notification from Recycle Bin back to Active
  const restoreFromTrash = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updatedTrash = trashedIds.filter((tId) => tId !== id);
    setTrashedIds(updatedTrash);
    try {
      localStorage.setItem(trashStorageKey, JSON.stringify(updatedTrash));
    } catch {}
  };

  // Restore all trashed notifications
  const restoreAllFromTrash = () => {
    setTrashedIds([]);
    try {
      localStorage.setItem(trashStorageKey, JSON.stringify([]));
    } catch {}
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Trigger Button */}
      <button
        onClick={() => {
          setIsOpen((prev) => !prev);
          setView("active");
        }}
        title={unreadCount > 0 ? `${unreadCount} unread notifications` : "Notifications"}
        className="relative p-2 rounded-full bg-slate-100 hover:bg-slate-200/70 text-slate-600 transition cursor-pointer"
        aria-expanded={isOpen}
      >
        <Bell className="h-4 w-4" />
        {unreadCount > 0 && (
          <span className="absolute top-0.5 right-0.5 h-3.5 w-3.5 rounded-full bg-red-600 text-white text-[8px] font-bold flex items-center justify-center animate-pulse">
            {unreadCount}
          </span>
        )}
      </button>

      {/* Floating Notification Popover Panel */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-2xl bg-white border border-slate-200/90 shadow-2xl z-50 overflow-hidden animate-fadeIn text-slate-800">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-slate-100 p-3.5 sm:p-4 bg-slate-50/50">
            {view === "active" ? (
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-sm text-slate-900">Notifications</span>
                {unreadCount > 0 && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-50 text-red-600 border border-red-200">
                    {unreadCount} New
                  </span>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setView("active")}
                  className="flex items-center gap-1 text-xs font-bold text-slate-600 hover:text-slate-900 transition p-1 hover:bg-slate-100 rounded-lg cursor-pointer"
                  title="Back to notifications"
                >
                  <ArrowLeft className="h-3.5 w-3.5" />
                  <span>Back</span>
                </button>
                <span className="font-extrabold text-sm text-slate-900 flex items-center gap-1.5">
                  <Trash2 className="h-3.5 w-3.5 text-slate-500" />
                  Recycle Bin
                </span>
              </div>
            )}

            {/* Header Right Actions */}
            <div className="flex items-center gap-1.5">
              {view === "active" ? (
                <>
                  {unreadCount > 0 && (
                    <button
                      onClick={markAllAsRead}
                      className="text-[11px] font-bold text-[#3b3c44] hover:underline flex items-center gap-1 px-1.5 py-1 rounded-md hover:bg-slate-100 transition cursor-pointer"
                      title="Mark all as read"
                    >
                      <Check className="h-3 w-3" />
                      <span className="hidden sm:inline">Mark read</span>
                    </button>
                  )}

                  {/* Recycle Bin Icon Button with Count Pill */}
                  <button
                    onClick={() => setView("trash")}
                    title={`Recycle Bin (${trashedNotifications.length} deleted items)`}
                    className="relative flex items-center gap-1 px-2 py-1 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 text-slate-600 hover:text-slate-900 text-xs font-semibold transition cursor-pointer"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    <span className="text-[11px] font-mono font-bold">
                      {trashedNotifications.length}
                    </span>
                  </button>
                </>
              ) : (
                trashedNotifications.length > 0 && (
                  <button
                    onClick={restoreAllFromTrash}
                    className="text-[11px] font-bold text-emerald-700 hover:text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200/60 px-2.5 py-1 rounded-lg transition cursor-pointer flex items-center gap-1"
                    title="Restore all deleted notifications"
                  >
                    <RotateCcw className="h-3 w-3" />
                    <span>Restore All</span>
                  </button>
                )
              )}
            </div>
          </div>

          {/* Body Content */}
          <div className="max-h-80 overflow-y-auto divide-y divide-slate-100 p-1">
            {view === "active" ? (
              // ACTIVE NOTIFICATIONS LIST
              activeNotifications.length > 0 ? (
                activeNotifications.map((item) => {
                  const Icon = item.icon;
                  const isUnread = !readIds.includes(item.id);

                  return (
                    <div
                      key={item.id}
                      onClick={() => handleNotificationClick(item)}
                      className={`group relative flex items-start gap-3 p-3 rounded-xl transition cursor-pointer ${
                        isUnread
                          ? "bg-slate-50/90 hover:bg-slate-100"
                          : "hover:bg-slate-50/50 opacity-80 hover:opacity-100"
                      }`}
                    >
                      {/* Left Category Icon */}
                      <div
                        className={`h-8 w-8 shrink-0 rounded-xl flex items-center justify-center mt-0.5 ${
                          item.type === "warning"
                            ? "bg-amber-100 text-amber-700"
                            : item.type === "info"
                            ? "bg-indigo-100 text-indigo-700"
                            : item.type === "alert"
                            ? "bg-red-100 text-red-700"
                            : "bg-emerald-100 text-emerald-700"
                        }`}
                      >
                        <Icon className="h-4 w-4" />
                      </div>

                      {/* Notification Content */}
                      <div className="flex-1 min-w-0 pr-6">
                        <div className="flex items-center gap-1.5">
                          <p
                            className={`text-xs truncate ${
                              isUnread ? "font-bold text-slate-900" : "font-semibold text-slate-700"
                            }`}
                          >
                            {item.title}
                          </p>
                          {isUnread && <span className="h-1.5 w-1.5 rounded-full bg-red-500 shrink-0" />}
                        </div>
                        <p className="text-[11px] text-slate-500 line-clamp-2 mt-0.5 leading-snug">
                          {item.message}
                        </p>
                        <span className="text-[10px] text-slate-400 font-semibold block mt-1">
                          {item.time}
                        </span>
                      </div>

                      {/* Individual Cross Button -> Moves to Recycle Bin */}
                      <button
                        onClick={(e) => moveToTrash(item.id, e)}
                        title="Dismiss to Recycle Bin"
                        className="absolute right-2 top-3 h-6 w-6 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 flex items-center justify-center transition cursor-pointer"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  );
                })
              ) : (
                <div className="py-10 text-center text-xs text-slate-400">
                  <CheckCircle2 className="h-8 w-8 text-emerald-500 mx-auto mb-2 opacity-80" />
                  <p className="font-bold text-slate-700">All notifications cleared</p>
                  <p className="text-[11px] mt-0.5 text-slate-400">
                    Dismissed items are stored in the Recycle Bin.
                  </p>
                  {trashedNotifications.length > 0 && (
                    <button
                      onClick={() => setView("trash")}
                      className="mt-3 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-50 transition cursor-pointer"
                    >
                      <Trash2 className="h-3.5 w-3.5 text-slate-500" />
                      <span>View Recycle Bin ({trashedNotifications.length})</span>
                    </button>
                  )}
                </div>
              )
            ) : (
              // RECYCLE BIN VIEW
              trashedNotifications.length > 0 ? (
                trashedNotifications.map((item) => {
                  const Icon = item.icon;
                  return (
                    <div
                      key={item.id}
                      className="flex items-start gap-3 p-3 rounded-xl bg-slate-50/60 hover:bg-slate-100/60 transition group"
                    >
                      <div className="h-8 w-8 shrink-0 rounded-xl bg-slate-200/80 text-slate-600 flex items-center justify-center mt-0.5">
                        <Icon className="h-4 w-4" />
                      </div>

                      <div className="flex-1 min-w-0 pr-2">
                        <p className="text-xs font-bold text-slate-700 truncate line-through opacity-80">
                          {item.title}
                        </p>
                        <p className="text-[11px] text-slate-500 line-clamp-2 mt-0.5 leading-snug">
                          {item.message}
                        </p>
                        <span className="text-[10px] text-slate-400 font-semibold block mt-1">
                          {item.time}
                        </span>
                      </div>

                      {/* Restore Button */}
                      <button
                        onClick={(e) => restoreFromTrash(item.id, e)}
                        title="Restore to active notifications"
                        className="h-7 w-7 rounded-lg text-emerald-600 hover:bg-emerald-100/70 border border-emerald-200/60 flex items-center justify-center transition cursor-pointer shrink-0 mt-1"
                      >
                        <RotateCcw className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  );
                })
              ) : (
                <div className="py-10 text-center text-xs text-slate-400">
                  <Trash2 className="h-8 w-8 text-slate-300 mx-auto mb-2" />
                  <p className="font-bold text-slate-700">Recycle Bin is empty</p>
                  <p className="text-[11px] mt-0.5 text-slate-400">
                    Click the (✕) cross button on any notification to send it here.
                  </p>
                  <button
                    onClick={() => setView("active")}
                    className="mt-3 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-50 transition cursor-pointer"
                  >
                    <ArrowLeft className="h-3.5 w-3.5 text-slate-500" />
                    <span>Back to Notifications</span>
                  </button>
                </div>
              )
            )}
          </div>

          {/* Footer View All / Dismiss */}
          <div className="border-t border-slate-100 p-2.5 px-3 bg-slate-50/50 flex items-center justify-between text-xs">
            <span className="text-[11px] text-slate-500 font-medium">
              {view === "active"
                ? `${activeNotifications.length} active notification${activeNotifications.length === 1 ? "" : "s"}`
                : `${trashedNotifications.length} item${trashedNotifications.length === 1 ? "" : "s"} in recycle bin`}
            </span>
            <button
              onClick={() => {
                setIsOpen(false);
                setView("active");
              }}
              className="text-[11px] font-bold text-slate-600 hover:text-slate-900 cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
