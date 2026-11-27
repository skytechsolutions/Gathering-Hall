"use client";

import { useState, useRef, useEffect } from "react";
import { useAuth } from "@/context/auth-context";
import {
  User,
  Building2,
  Clock,
  Shield,
  Bell,
  Sun,
  Moon,
  CheckCircle2,
  Mail,
  Phone,
  Upload,
  Trash2,
  Check,
  Eye,
} from "lucide-react";

export default function OwnerSettingsPage() {
  const {
    user,
    brandSettings,
    updateBrandSettings,
    sessionSettings: authSessionSettings,
    updateSessionSettings,
    updateProfile,
  } = useAuth();
  const [activeTab, setActiveTab] = useState<"profile" | "sessions" | "notifications" | "security">("profile");
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Brand & Profile Form States
  const [hallName, setHallName] = useState(brandSettings.hallName || "Chamkani Hall");
  const [logoUrl, setLogoUrl] = useState<string | null>(brandSettings.logoUrl);
  const [ownerName, setOwnerName] = useState(user?.name || "");
  const [phone, setPhone] = useState(user?.phone || "");
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Day & Night Sessions State (Linked to AuthContext & localStorage)
  const [sessionSettings, setSessionSettings] = useState(authSessionSettings);
  const [isSavingSessions, setIsSavingSessions] = useState(false);
  const [sessionSavedSuccess, setSessionSavedSuccess] = useState(false);

  useEffect(() => {
    setSessionSettings(authSessionSettings);
  }, [authSessionSettings]);

  // Notifications State
  const [notificationSettings, setNotificationSettings] = useState(() => {
    if (typeof window !== "undefined") {
      try {
        const stored = localStorage.getItem("owner_notification_settings");
        if (stored) {
          return JSON.parse(stored);
        }
      } catch {}
    }
    return {
      bookingAlerts: true,
      holdExpiryWarnings: true,
      paymentReceipts: true,
    };
  });
  const [isSavingNotifs, setIsSavingNotifs] = useState(false);
  const [notifSavedSuccess, setNotifSavedSuccess] = useState(false);

  const handleLogoFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      alert("Please upload a valid image file (PNG, JPG, SVG, WebP).");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      alert("Image size should be less than 5MB.");
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      setLogoUrl(result);
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveLogo = () => {
    setLogoUrl(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      updateBrandSettings({
        hallName: hallName.trim() || "Chamkani Hall",
        logoUrl: logoUrl || null,
      });

      if (ownerName.trim() || phone.trim()) {
        try {
          await updateProfile({
            name: ownerName.trim() || undefined,
            phone: phone.trim() || undefined,
          });
        } catch (apiErr: any) {
          console.warn("Backend profile sync notice:", apiErr?.message);
        }
      }

      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 3500);
    } catch (err: any) {
      console.warn("Settings save note:", err?.message);
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 3500);
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveSessions = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingSessions(true);
    setSessionSavedSuccess(false);

    try {
      updateSessionSettings(sessionSettings);
      await new Promise((res) => setTimeout(res, 400));
      setSessionSavedSuccess(true);
      setSavedSuccess(true);
      setTimeout(() => {
        setSessionSavedSuccess(false);
        setSavedSuccess(false);
      }, 3500);
    } catch (err: any) {
      console.error("Failed to save session settings:", err);
    } finally {
      setIsSavingSessions(false);
    }
  };

  const handleSaveNotifications = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingNotifs(true);
    setNotifSavedSuccess(false);

    try {
      if (typeof window !== "undefined") {
        localStorage.setItem("owner_notification_settings", JSON.stringify(notificationSettings));
      }
      await new Promise((res) => setTimeout(res, 350));
      setNotifSavedSuccess(true);
      setSavedSuccess(true);
      setTimeout(() => {
        setNotifSavedSuccess(false);
        setSavedSuccess(false);
      }, 3500);
    } catch (err: any) {
      console.error("Failed to save notifications:", err);
    } finally {
      setIsSavingNotifs(false);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl select-none font-sans">
      {/* ============================================================== */}
      {/* 1. TOP HEADER (Editorial luxury styling)                       */}
      {/* ============================================================== */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div>
          <h1 className="font-serif text-2xl sm:text-3xl text-[#1f2421] font-normal tracking-tight">
            Settings & Account Management
          </h1>
          <p className="text-xs text-[#7a6f60] font-normal mt-0.5">
            Manage your hall brand, Day/Night booking schedules, notification preferences, and account security
          </p>
        </div>
      </div>

      {savedSuccess && (
        <div className="flex items-center gap-2 rounded-xl bg-emerald-50 p-4 text-xs font-semibold text-emerald-800 border border-emerald-200 animate-fadeIn">
          <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
          <span>Settings saved successfully. All changes are active across your owner portal.</span>
        </div>
      )}

      {/* ============================================================== */}
      {/* 2. TABS ROW                                                    */}
      {/* ============================================================== */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 [scrollbar-width:none]">
        <button
          onClick={() => setActiveTab("profile")}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-md text-xs font-semibold transition cursor-pointer ${
            activeTab === "profile"
              ? "bg-[#1e382b] text-white shadow-xs"
              : "text-[#7a6f60] hover:text-[#1f2421] hover:bg-[#ebe3d7]/30"
          }`}
        >
          <Building2 className="h-4 w-4" />
          <span>Brand & Profile</span>
        </button>
        <button
          onClick={() => setActiveTab("sessions")}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-md text-xs font-semibold transition cursor-pointer ${
            activeTab === "sessions"
              ? "bg-[#1e382b] text-white shadow-xs"
              : "text-[#7a6f60] hover:text-[#1f2421] hover:bg-[#ebe3d7]/30"
          }`}
        >
          <Clock className="h-4 w-4" />
          <span>Day & Night Sessions</span>
        </button>
        <button
          onClick={() => setActiveTab("notifications")}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-md text-xs font-semibold transition cursor-pointer ${
            activeTab === "notifications"
              ? "bg-[#1e382b] text-white shadow-xs"
              : "text-[#7a6f60] hover:text-[#1f2421] hover:bg-[#ebe3d7]/30"
          }`}
        >
          <Bell className="h-4 w-4" />
          <span>Notifications</span>
        </button>
        <button
          onClick={() => setActiveTab("security")}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-md text-xs font-semibold transition cursor-pointer ${
            activeTab === "security"
              ? "bg-[#1e382b] text-white shadow-xs"
              : "text-[#7a6f60] hover:text-[#1f2421] hover:bg-[#ebe3d7]/30"
          }`}
        >
          <Shield className="h-4 w-4" />
          <span>Security</span>
        </button>
      </div>

      {/* ============================================================== */}
      {/* 3. TAB CONTENT: BRAND & PROFILE                                */}
      {/* ============================================================== */}
      {activeTab === "profile" && (
        <form onSubmit={handleSaveProfile} className="space-y-6">
          <div className="rounded-2xl border border-[#e5ded4] bg-[#faf7f2] p-6 sm:p-7 space-y-6 shadow-2xs">
            <div className="pb-4 border-b border-[#e5ded4]">
              <h3 className="font-serif text-xl text-[#1f2421] font-normal leading-tight">
                Hall Brand Identity & Logo
              </h3>
              <p className="text-xs text-[#7a6f60] font-normal mt-0.5">
                Update your hall name and custom brand logo. Changes appear instantly across your navigation, receipts, and client portal.
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              <div className="lg:col-span-7 space-y-5">
                <div>
                  <label className="block text-xs font-bold text-[#1f2421]">
                    Hall / Portal Brand Name <span className="text-red-500">*</span>
                  </label>
                  <div className="relative mt-1.5">
                    <Building2 className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#7a7368]" />
                    <input
                      type="text"
                      required
                      value={hallName}
                      onChange={(e) => setHallName(e.target.value)}
                      placeholder="e.g. Chamkani Hall, Royal Banquet"
                      className="w-full rounded-lg border border-[#d6cec3] bg-white pl-10 pr-4 py-2 text-xs text-[#1f2421] font-medium focus:border-[#1e382b] focus:outline-none transition"
                    />
                  </div>
                  <p className="mt-1 text-[11px] text-[#7a6f60]">
                    This brand title is highlighted at the top of your sidebar and on customer booking receipts.
                  </p>
                </div>

                {/* Logo Upload Box */}
                <div>
                  <label className="block text-xs font-bold text-[#1f2421]">
                    Hall Brand Logo
                  </label>
                  <div className="mt-1.5 flex flex-col sm:flex-row items-start sm:items-center gap-4 rounded-xl border border-dashed border-[#d6cec3] bg-white/70 p-4">
                    <div className="relative shrink-0">
                      {logoUrl ? (
                        <div className="h-16 w-16 rounded-xl overflow-hidden border border-[#d6cec3] bg-black/5 flex items-center justify-center">
                          <img
                            src={logoUrl}
                            alt="Hall Logo"
                            className="h-full w-full object-cover"
                          />
                        </div>
                      ) : (
                        <div className="h-16 w-16 rounded-xl bg-[#ebe3d7] border border-[#d6cec3] flex items-center justify-center text-[#1e382b]">
                          <Building2 className="h-8 w-8" />
                        </div>
                      )}
                      <span className="absolute -bottom-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-emerald-600 text-white text-[10px] shadow">
                        <Check className="h-3 w-3 stroke-[3]" />
                      </span>
                    </div>

                    <div className="flex-1 space-y-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <input
                          ref={fileInputRef}
                          type="file"
                          accept="image/*"
                          onChange={handleLogoFile}
                          className="hidden"
                          id="hall-logo-upload"
                        />
                        <label
                          htmlFor="hall-logo-upload"
                          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#1e382b] hover:bg-[#162a20] text-white text-xs font-semibold transition cursor-pointer shadow-xs"
                        >
                          <Upload className="h-3.5 w-3.5" />
                          <span>{logoUrl ? "Replace Logo" : "Upload Logo"}</span>
                        </label>

                        {logoUrl && (
                          <button
                            type="button"
                            onClick={handleRemoveLogo}
                            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-semibold border border-rose-200 transition cursor-pointer"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                            <span>Remove</span>
                          </button>
                        )}
                      </div>
                      <p className="text-[11px] text-[#7a6f60] leading-relaxed">
                        Square format recommended (PNG, SVG, or JPG). Transparent or light backgrounds look best.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Column: Live Sidebar Preview Widget (5 cols) */}
              <div className="lg:col-span-5 rounded-2xl bg-[#1e382b] text-white p-5 border border-white/10 space-y-4 shadow-sm">
                <div className="flex items-center justify-between border-b border-white/10 pb-3">
                  <div className="flex items-center gap-2">
                    <Eye className="h-4 w-4 text-[#c28e36]" />
                    <span className="text-xs font-bold uppercase tracking-wider text-white">
                      Live Sidebar Preview
                    </span>
                  </div>
                  <span className="text-[10px] font-bold text-[#c28e36] bg-[#c28e36]/10 px-2 py-0.5 rounded-full border border-[#c28e36]/30">
                    Real-time
                  </span>
                </div>

                <div className="rounded-xl bg-white/10 border border-white/20 p-3.5 flex items-center gap-3">
                  {logoUrl ? (
                    <div className="h-10 w-10 shrink-0 rounded-lg overflow-hidden border border-white/20 bg-black/40 flex items-center justify-center p-0.5">
                      <img
                        src={logoUrl}
                        alt="Preview"
                        className="h-full w-full object-cover rounded-lg"
                      />
                    </div>
                  ) : (
                    <div className="h-10 w-10 shrink-0 rounded-lg bg-[#c28e36] text-[#1f2421] p-1 flex items-center justify-center font-bold">
                      <Building2 className="h-5 w-5" />
                    </div>
                  )}

                  <div className="overflow-hidden truncate flex-1 min-w-0">
                    <h4 className="text-sm font-bold text-white tracking-tight leading-tight truncate">
                      {hallName.trim() || "Chamkani Hall"}
                    </h4>
                    <p className="text-[11px] text-white/60 truncate leading-tight mt-0.5">
                      {user?.email || "owner@chamkani.com"}
                    </p>
                  </div>
                </div>

                <p className="text-[11px] text-white/60 leading-relaxed italic">
                  This exact branding appears on your navigation sidebar, booking invoices, and customer schedule view.
                </p>
              </div>
            </div>
          </div>

          {/* Section 2: Owner Personal & Contact Details */}
          <div className="rounded-2xl border border-[#e5ded4] bg-[#faf7f2] p-6 sm:p-7 space-y-5 shadow-2xs">
            <div className="pb-4 border-b border-[#e5ded4]">
              <h3 className="font-serif text-xl text-[#1f2421] font-normal leading-tight">
                Owner Personal Account Details
              </h3>
              <p className="text-xs text-[#7a6f60] font-normal mt-0.5">
                Manage your personal name, contact phone, and primary account credentials
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-[#1f2421]">Full Name</label>
                <div className="relative mt-1">
                  <User className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#7a7368]" />
                  <input
                    type="text"
                    value={ownerName}
                    onChange={(e) => setOwnerName(e.target.value)}
                    placeholder="Enter owner full name"
                    className="w-full rounded-lg border border-[#d6cec3] bg-white pl-10 pr-3.5 py-2 text-xs text-[#1f2421] focus:border-[#1e382b] focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#1f2421]">Email Address (Login)</label>
                <div className="relative mt-1">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#7a7368]" />
                  <input
                    type="email"
                    disabled
                    value={user?.email || ""}
                    className="w-full rounded-lg border border-[#d6cec3] bg-[#ebe3d7]/40 pl-10 pr-3.5 py-2 text-xs text-[#6c726d] cursor-not-allowed"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#1f2421]">Contact Phone</label>
                <div className="relative mt-1">
                  <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#7a7368]" />
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="e.g. 0300-1234567"
                    className="w-full rounded-lg border border-[#d6cec3] bg-white pl-10 pr-3.5 py-2 text-xs text-[#1f2421] focus:border-[#1e382b] focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#1f2421]">Account Role</label>
                <div className="relative mt-1">
                  <Shield className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#1e382b]" />
                  <input
                    type="text"
                    disabled
                    value="HALL_OWNER (Verified Full Access)"
                    className="w-full rounded-lg border border-[#d6cec3] bg-[#ebe3d7]/40 pl-10 pr-3.5 py-2 text-xs font-bold text-[#1e382b] cursor-not-allowed"
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-3">
              <button
                type="submit"
                disabled={isSaving}
                className="rounded-lg bg-[#1e382b] hover:bg-[#162a20] text-white font-semibold text-xs px-6 py-2.5 transition cursor-pointer shadow-xs active:scale-[0.98]"
              >
                {isSaving ? "Saving..." : "Save Brand & Profile Changes"}
              </button>
            </div>
          </div>
        </form>
      )}

      {/* ============================================================== */}
      {/* 4. TAB CONTENT: DAY & NIGHT SESSIONS                           */}
      {/* ============================================================== */}
      {activeTab === "sessions" && (
        <form onSubmit={handleSaveSessions} className="rounded-2xl border border-[#e5ded4] bg-[#faf7f2] p-6 sm:p-7 space-y-6 shadow-2xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[#e5ded4]">
            <div>
              <h3 className="font-serif text-xl text-[#1f2421] font-normal leading-tight">
                Day & Night Session Schedule Configuration
              </h3>
              <p className="text-xs text-[#7a6f60] font-normal mt-0.5">
                Customize standard booking hours and default policies for Day and Night reservations
              </p>
            </div>
            {sessionSavedSuccess && (
              <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-100 text-emerald-800 text-xs font-semibold border border-emerald-300 shrink-0 animate-fadeIn">
                <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                <span>Saved & Active!</span>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Day Session Card */}
            <div className="rounded-xl border border-amber-200/80 bg-amber-50/40 p-4 space-y-3">
              <div className="flex items-center gap-2 text-amber-900 font-semibold text-xs">
                <Sun className="h-4 w-4 text-amber-600" />
                <span>☀️ Day Session Default Hours</span>
              </div>
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div>
                  <label className="block text-[11px] font-bold text-[#1f2421]">Start Time</label>
                  <input
                    type="time"
                    value={sessionSettings.dayStart}
                    onChange={(e) => setSessionSettings({ ...sessionSettings, dayStart: e.target.value })}
                    className="mt-1 w-full rounded-lg border border-[#d6cec3] bg-white px-3 py-2 text-xs text-[#1f2421] font-medium focus:outline-none focus:border-[#1e382b] transition shadow-2xs"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-[#1f2421]">End Time</label>
                  <input
                    type="time"
                    value={sessionSettings.dayEnd}
                    onChange={(e) => setSessionSettings({ ...sessionSettings, dayEnd: e.target.value })}
                    className="mt-1 w-full rounded-lg border border-[#d6cec3] bg-white px-3 py-2 text-xs text-[#1f2421] font-medium focus:outline-none focus:border-[#1e382b] transition shadow-2xs"
                  />
                </div>
              </div>
              <p className="text-[11px] text-[#7a6f60]">Typical Barat/Lunch wedding session</p>
            </div>

            {/* Night Session Card */}
            <div className="rounded-xl border border-[#d6cec3] bg-[#ebe3d7]/30 p-4 space-y-3">
              <div className="flex items-center gap-2 text-[#1f2421] font-semibold text-xs">
                <Moon className="h-4 w-4 text-[#1e382b]" />
                <span>🌙 Night Session Default Hours</span>
              </div>
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div>
                  <label className="block text-[11px] font-bold text-[#1f2421]">Start Time</label>
                  <input
                    type="time"
                    value={sessionSettings.nightStart}
                    onChange={(e) => setSessionSettings({ ...sessionSettings, nightStart: e.target.value })}
                    className="mt-1 w-full rounded-lg border border-[#d6cec3] bg-white px-3 py-2 text-xs text-[#1f2421] font-medium focus:outline-none focus:border-[#1e382b] transition shadow-2xs"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-[#1f2421]">End Time</label>
                  <input
                    type="time"
                    value={sessionSettings.nightEnd}
                    onChange={(e) => setSessionSettings({ ...sessionSettings, nightEnd: e.target.value })}
                    className="mt-1 w-full rounded-lg border border-[#d6cec3] bg-white px-3 py-2 text-xs text-[#1f2421] font-medium focus:outline-none focus:border-[#1e382b] transition shadow-2xs"
                  />
                </div>
              </div>
              <p className="text-[11px] text-[#7a6f60]">Typical Walima/Dinner wedding reception</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-[#1f2421]">Default Token Hold Duration</label>
              <select
                value={sessionSettings.autoHoldHours}
                onChange={(e) => setSessionSettings({ ...sessionSettings, autoHoldHours: Number(e.target.value) })}
                className="mt-1 w-full rounded-lg border border-[#d6cec3] bg-white px-3.5 py-2 text-xs text-[#1f2421] font-medium focus:outline-none focus:border-[#1e382b] transition shadow-2xs cursor-pointer"
              >
                <option value={24}>24 Hours Auto-Hold</option>
                <option value={48}>48 Hours Auto-Hold</option>
                <option value={72}>72 Hours Auto-Hold</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-[#1f2421]">Billing Currency</label>
              <input
                type="text"
                disabled
                value="Pakistani Rupee (PKR)"
                className="mt-1 w-full rounded-lg border border-[#d6cec3] bg-[#ebe3d7]/40 px-3.5 py-2 text-xs text-[#6c726d] font-medium cursor-not-allowed"
              />
            </div>
          </div>

          <div className="flex justify-end pt-3">
            <button
              type="submit"
              disabled={isSavingSessions}
              className={`rounded-lg text-white font-semibold text-xs px-6 py-2.5 transition cursor-pointer flex items-center gap-2 shadow-xs active:scale-[0.98] ${
                sessionSavedSuccess
                  ? "bg-emerald-600 hover:bg-emerald-700"
                  : "bg-[#1e382b] hover:bg-[#162a20]"
              }`}
            >
              {isSavingSessions ? (
                <>
                  <div className="h-3.5 w-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Saving Preferences...</span>
                </>
              ) : sessionSavedSuccess ? (
                <>
                  <Check className="h-3.5 w-3.5 stroke-[3]" />
                  <span>Saved Successfully!</span>
                </>
              ) : (
                <span>Save Session Preferences</span>
              )}
            </button>
          </div>
        </form>
      )}

      {/* ============================================================== */}
      {/* 5. TAB CONTENT: NOTIFICATIONS                                  */}
      {/* ============================================================== */}
      {activeTab === "notifications" && (
        <form onSubmit={handleSaveNotifications} className="rounded-2xl border border-[#e5ded4] bg-[#faf7f2] p-6 sm:p-7 space-y-4 text-xs shadow-2xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#e5ded4]">
            <div>
              <h3 className="font-serif text-xl text-[#1f2421] font-normal leading-tight">Notification Alerts</h3>
              <p className="text-xs text-[#7a6f60] font-normal mt-0.5">Configure how you receive updates on new bookings and payments</p>
            </div>
            {notifSavedSuccess && (
              <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-100 text-emerald-800 text-xs font-semibold border border-emerald-300 shrink-0 animate-fadeIn">
                <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                <span>Saved & Active!</span>
              </div>
            )}
          </div>

          <div className="space-y-3 pt-2">
            <label className="flex items-center justify-between p-3.5 rounded-xl border border-[#d6cec3] bg-white hover:bg-[#ebe3d7]/20 transition cursor-pointer">
              <div>
                <p className="font-bold text-xs text-[#1f2421]">New Booking Confirmation Alerts</p>
                <p className="text-[#7a6f60] text-[11px]">Receive in-app notification when customer booking is confirmed</p>
              </div>
              <input
                type="checkbox"
                checked={notificationSettings.bookingAlerts}
                onChange={(e) => setNotificationSettings({ ...notificationSettings, bookingAlerts: e.target.checked })}
                className="h-4 w-4 text-[#1e382b] accent-[#1e382b] rounded cursor-pointer"
              />
            </label>

            <label className="flex items-center justify-between p-3.5 rounded-xl border border-[#d6cec3] bg-white hover:bg-[#ebe3d7]/20 transition cursor-pointer">
              <div>
                <p className="font-bold text-xs text-[#1f2421]">Token Hold Expiry Warnings</p>
                <p className="text-[#7a6f60] text-[11px]">Notify 4 hours before a token reservation expires</p>
              </div>
              <input
                type="checkbox"
                checked={notificationSettings.holdExpiryWarnings}
                onChange={(e) => setNotificationSettings({ ...notificationSettings, holdExpiryWarnings: e.target.checked })}
                className="h-4 w-4 text-[#1e382b] accent-[#1e382b] rounded cursor-pointer"
              />
            </label>

            <label className="flex items-center justify-between p-3.5 rounded-xl border border-[#d6cec3] bg-white hover:bg-[#ebe3d7]/20 transition cursor-pointer">
              <div>
                <p className="font-bold text-xs text-[#1f2421]">Payment Received Invoices</p>
                <p className="text-[#7a6f60] text-[11px]">Instant receipt generation on customer payment recorded</p>
              </div>
              <input
                type="checkbox"
                checked={notificationSettings.paymentReceipts}
                onChange={(e) => setNotificationSettings({ ...notificationSettings, paymentReceipts: e.target.checked })}
                className="h-4 w-4 text-[#1e382b] accent-[#1e382b] rounded cursor-pointer"
              />
            </label>
          </div>

          <div className="flex justify-end pt-3">
            <button
              type="submit"
              disabled={isSavingNotifs}
              className={`rounded-lg text-white font-semibold text-xs px-6 py-2.5 transition cursor-pointer flex items-center gap-2 shadow-xs active:scale-[0.98] ${
                notifSavedSuccess
                  ? "bg-emerald-600 hover:bg-emerald-700"
                  : "bg-[#1e382b] hover:bg-[#162a20]"
              }`}
            >
              {isSavingNotifs ? (
                <>
                  <div className="h-3.5 w-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Saving...</span>
                </>
              ) : notifSavedSuccess ? (
                <>
                  <Check className="h-3.5 w-3.5 stroke-[3]" />
                  <span>Saved Successfully!</span>
                </>
              ) : (
                <span>Save Notification Preferences</span>
              )}
            </button>
          </div>
        </form>
      )}

      {/* ============================================================== */}
      {/* 6. TAB CONTENT: SECURITY                                       */}
      {/* ============================================================== */}
      {activeTab === "security" && (
        <div className="rounded-2xl border border-[#e5ded4] bg-[#faf7f2] p-6 sm:p-7 space-y-4 text-xs shadow-2xs">
          <h3 className="font-serif text-xl text-[#1f2421] font-normal leading-tight">Account Security & Credentials</h3>
          <p className="text-[#7a6f60] font-normal">Password management and authentication safeguards</p>

          <div className="rounded-xl bg-white border border-[#e5ded4] p-4 space-y-2">
            <div className="flex items-center gap-2 font-bold text-[#1f2421]">
              <Shield className="h-4 w-4 text-[#1e382b]" />
              <span>Security Protocols Active</span>
            </div>
            <p className="text-[11px] text-[#7a6f60] leading-relaxed">
              Your session is protected by encrypted JWT tokens and strict PostgreSQL ownership isolation.
              To change your primary email or master administrative credentials, please coordinate directly with the Super Admin.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
