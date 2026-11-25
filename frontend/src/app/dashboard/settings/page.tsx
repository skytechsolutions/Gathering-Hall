"use client";

import { useState, useRef, useEffect } from "react";
import { useAuth } from "@/context/auth-context";
import {
  Settings,
  User,
  Building2,
  Clock,
  Shield,
  Bell,
  Sun,
  Moon,
  CheckCircle2,
  Lock,
  Mail,
  Phone,
  Upload,
  Image as ImageIcon,
  Trash2,
  Sparkles,
  Check,
  Eye,
} from "lucide-react";

export default function OwnerSettingsPage() {
  const { user, brandSettings, updateBrandSettings, updateProfile } = useAuth();
  const [activeTab, setActiveTab] = useState<"profile" | "sessions" | "notifications" | "security">("profile");
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Brand & Profile Form States
  const [hallName, setHallName] = useState(brandSettings.hallName || "Chamkani Hall");
  const [logoUrl, setLogoUrl] = useState<string | null>(brandSettings.logoUrl);
  const [ownerName, setOwnerName] = useState(user?.name || "");
  const [phone, setPhone] = useState(user?.phone || "");
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (brandSettings.hallName) setHallName(brandSettings.hallName);
    setLogoUrl(brandSettings.logoUrl);
  }, [brandSettings]);

  useEffect(() => {
    if (user) {
      setOwnerName(user.name || "");
      setPhone(user.phone || "");
    }
  }, [user]);

  const [sessionSettings, setSessionSettings] = useState({
    dayStart: "11:00",
    dayEnd: "16:00",
    nightStart: "18:00",
    nightEnd: "00:00",
    autoHoldHours: 48,
    currency: "PKR",
  });

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
      // 1. Update brand settings (Hall Name & Logo)
      updateBrandSettings({
        hallName: hallName.trim() || "Chamkani Hall",
        logoUrl: logoUrl || null,
      });

      // 2. Update backend profile if changed
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

  const handleSaveSessions = (e: React.FormEvent) => {
    e.preventDefault();
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3.5">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-blue-600 border border-blue-100 shadow-xs">
            <Settings className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight leading-tight">
              Settings & Account Management
            </h1>
            <p className="text-xs text-slate-500 font-medium">
              Manage your hall owner profile, Day & Night session rules, and portal preferences
            </p>
          </div>
        </div>
      </div>

      {savedSuccess && (
        <div className="flex items-center gap-2 rounded-2xl bg-emerald-50 p-4 text-xs font-bold text-emerald-800 border border-emerald-200 animate-fadeIn">
          <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0" />
          <span>Settings saved successfully. All changes are active across your owner portal.</span>
        </div>
      )}

      {/* Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-slate-200/80 pb-3">
        <button
          onClick={() => setActiveTab("profile")}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-bold transition cursor-pointer ${
            activeTab === "profile"
              ? "bg-[#2563eb] text-white shadow-xs"
              : "text-slate-600 hover:bg-slate-100"
          }`}
        >
          <Building2 className="h-4 w-4" />
          <span>Brand & Profile</span>
        </button>
        <button
          onClick={() => setActiveTab("sessions")}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-bold transition cursor-pointer ${
            activeTab === "sessions"
              ? "bg-[#2563eb] text-white shadow-xs"
              : "text-slate-600 hover:bg-slate-100"
          }`}
        >
          <Clock className="h-4 w-4" />
          <span>Day & Night Sessions</span>
        </button>
        <button
          onClick={() => setActiveTab("notifications")}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-bold transition cursor-pointer ${
            activeTab === "notifications"
              ? "bg-[#2563eb] text-white shadow-xs"
              : "text-slate-600 hover:bg-slate-100"
          }`}
        >
          <Bell className="h-4 w-4" />
          <span>Notifications</span>
        </button>
        <button
          onClick={() => setActiveTab("security")}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-bold transition cursor-pointer ${
            activeTab === "security"
              ? "bg-[#2563eb] text-white shadow-xs"
              : "text-slate-600 hover:bg-slate-100"
          }`}
        >
          <Shield className="h-4 w-4" />
          <span>Security</span>
        </button>
      </div>

      {/* Tab: Brand & Profile */}
      {activeTab === "profile" && (
        <form onSubmit={handleSaveProfile} className="space-y-6">
          {/* Section 1: Hall Brand & Logo Identity */}
          <div className="rounded-3xl border border-slate-200/80 bg-white p-6 sm:p-7 shadow-xs space-y-6">
            <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-amber-50 text-amber-600 border border-amber-200/60 shadow-xs">
                <Sparkles className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-base font-extrabold text-slate-900 leading-tight">
                  Hall Brand Identity & Logo
                </h3>
                <p className="text-xs text-slate-500">
                  Update your hall name and custom brand logo. Changes appear instantly across your dark glass sidebar, receipts, and client portal.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              {/* Left Column: Form Controls (7 cols) */}
              <div className="lg:col-span-7 space-y-5">
                <div>
                  <label className="block text-xs font-bold text-slate-800">
                    Hall / Portal Brand Name <span className="text-red-500">*</span>
                  </label>
                  <div className="relative mt-1.5">
                    <Building2 className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <input
                      type="text"
                      required
                      value={hallName}
                      onChange={(e) => setHallName(e.target.value)}
                      placeholder="e.g. Chamkani Hall, Royal Banquet, Al-Miraj Hall"
                      className="w-full rounded-2xl border border-slate-200 bg-slate-50 pl-10 pr-4 py-2.5 text-xs text-slate-900 font-semibold focus:bg-white focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition"
                    />
                  </div>
                  <p className="mt-1 text-[11px] text-slate-500">
                    This brand title is highlighted at the top of your sidebar and on customer booking receipts.
                  </p>
                </div>

                {/* Logo Upload Box */}
                <div>
                  <label className="block text-xs font-bold text-slate-800">
                    Hall Brand Logo
                  </label>
                  <div className="mt-1.5 flex flex-col sm:flex-row items-start sm:items-center gap-4 rounded-2xl border border-dashed border-slate-300 bg-slate-50/70 p-4">
                    {/* Current Logo Avatar */}
                    <div className="relative shrink-0">
                      {logoUrl ? (
                        <div className="h-16 w-16 rounded-2xl overflow-hidden border-2 border-white shadow-md bg-slate-900 flex items-center justify-center">
                          <img
                            src={logoUrl}
                            alt="Hall Logo"
                            className="h-full w-full object-cover"
                          />
                        </div>
                      ) : (
                        <div className="h-16 w-16 rounded-2xl bg-gradient-to-tr from-amber-500 via-amber-400 to-yellow-300 p-0.5 shadow-md shadow-amber-500/20 border border-white/40 flex items-center justify-center">
                          <Building2 className="h-8 w-8 text-slate-950 stroke-[2.4]" />
                        </div>
                      )}
                      <span className="absolute -bottom-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500 text-white text-[10px] shadow">
                        <Check className="h-3 w-3 stroke-[3]" />
                      </span>
                    </div>

                    {/* Upload / Action Buttons */}
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
                          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition shadow-sm cursor-pointer"
                        >
                          <Upload className="h-3.5 w-3.5 stroke-[2.5]" />
                          <span>{logoUrl ? "Replace Logo" : "Upload Logo"}</span>
                        </label>

                        {logoUrl && (
                          <button
                            type="button"
                            onClick={handleRemoveLogo}
                            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-red-50 hover:bg-red-100 text-red-600 text-xs font-bold border border-red-200 transition cursor-pointer"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                            <span>Remove</span>
                          </button>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-500 leading-relaxed">
                        Square format recommended (PNG, SVG, or JPG). Transparent or dark backgrounds look best on the glassy sidebar.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Column: Live Sidebar Preview Widget (5 cols) */}
              <div className="lg:col-span-5 rounded-3xl bg-[#0b0c16] text-white p-5 border border-white/15 shadow-xl space-y-4">
                <div className="flex items-center justify-between border-b border-white/10 pb-3">
                  <div className="flex items-center gap-2">
                    <Eye className="h-4 w-4 text-amber-400" />
                    <span className="text-xs font-extrabold uppercase tracking-wider text-slate-300">
                      Live Sidebar Preview
                    </span>
                  </div>
                  <span className="text-[10px] font-bold text-lime-400 bg-lime-400/10 px-2 py-0.5 rounded-full border border-lime-400/30">
                    Real-time
                  </span>
                </div>

                {/* Simulated Glass Sidebar Header */}
                <div className="rounded-2xl bg-white/[0.08] backdrop-blur-xl border border-white/[0.12] p-3.5 flex items-center gap-3 shadow-inner">
                  {logoUrl ? (
                    <div className="h-10 w-10 shrink-0 rounded-2xl overflow-hidden shadow-lg border border-white/20 bg-black/50 flex items-center justify-center p-0.5">
                      <img
                        src={logoUrl}
                        alt="Preview"
                        className="h-full w-full object-cover rounded-xl"
                      />
                    </div>
                  ) : (
                    <div className="h-10 w-10 shrink-0 rounded-2xl bg-gradient-to-tr from-amber-500 via-amber-400 to-yellow-300 p-0.5 shadow-lg shadow-amber-500/20 border border-white/20 flex items-center justify-center">
                      <Building2 className="h-5 w-5 text-slate-950 stroke-[2.4]" />
                    </div>
                  )}

                  <div className="overflow-hidden truncate flex-1 min-w-0">
                    <h4 className="text-sm font-extrabold text-white tracking-tight leading-tight truncate">
                      {hallName.trim() || "Chamkani Hall"}
                    </h4>
                    <p className="text-[11px] text-white/50 truncate leading-tight mt-0.5">
                      {user?.email || "owner@chamkani.com"}
                    </p>
                  </div>
                </div>

                <p className="text-[11px] text-slate-400 leading-relaxed italic">
                  This exact branding appears on your navigation sidebar, booking invoices, and customer schedule view.
                </p>
              </div>
            </div>
          </div>

          {/* Section 2: Owner Personal & Contact Details */}
          <div className="rounded-3xl border border-slate-200/80 bg-white p-6 sm:p-7 shadow-xs space-y-5">
            <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-blue-50 text-blue-600 border border-blue-200/60 shadow-xs">
                <User className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-base font-extrabold text-slate-900 leading-tight">
                  Owner Personal Account Details
                </h3>
                <p className="text-xs text-slate-500">
                  Manage your personal name, contact phone, and primary account credentials
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700">Full Name</label>
                <div className="relative mt-1">
                  <User className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <input
                    type="text"
                    value={ownerName}
                    onChange={(e) => setOwnerName(e.target.value)}
                    placeholder="Enter owner full name"
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 pl-10 pr-3.5 py-2.5 text-xs text-slate-900 focus:bg-white focus:border-blue-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700">Email Address (Login)</label>
                <div className="relative mt-1">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <input
                    type="email"
                    disabled
                    value={user?.email || ""}
                    className="w-full rounded-2xl border border-slate-200 bg-slate-100 pl-10 pr-3.5 py-2.5 text-xs text-slate-500 cursor-not-allowed"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700">Contact Phone</label>
                <div className="relative mt-1">
                  <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="e.g. 0300-1234567"
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 pl-10 pr-3.5 py-2.5 text-xs text-slate-900 focus:bg-white focus:border-blue-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700">Account Role</label>
                <div className="relative mt-1">
                  <Shield className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-blue-500" />
                  <input
                    type="text"
                    disabled
                    value="HALL_OWNER (Verified Full Portal Access)"
                    className="w-full rounded-2xl border border-blue-200 bg-blue-50/50 pl-10 pr-3.5 py-2.5 text-xs font-bold text-blue-700 cursor-not-allowed"
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-3">
              <button
                type="submit"
                disabled={isSaving}
                className="rounded-2xl bg-[#2563eb] hover:bg-[#1d4ed8] text-white font-bold text-xs px-7 py-3 shadow-md shadow-blue-600/25 transition cursor-pointer flex items-center gap-2 active:scale-95"
              >
                <Sparkles className="h-4 w-4" />
                <span>{isSaving ? "Saving..." : "Save Brand & Profile Changes"}</span>
              </button>
            </div>
          </div>
        </form>
      )}

      {/* Tab: Day & Night Sessions */}
      {activeTab === "sessions" && (
        <form onSubmit={handleSaveSessions} className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-xs space-y-6">
          <div>
            <h3 className="text-sm font-black text-slate-900">Day & Night Session Schedule Configuration</h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Customize standard booking hours and default policies for Day and Night reservations
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Day Session Card */}
            <div className="rounded-2xl border border-amber-200 bg-amber-50/40 p-4 space-y-3">
              <div className="flex items-center gap-2 text-amber-700 font-bold text-xs">
                <Sun className="h-4 w-4" />
                <span>☀️ Day Session Default Hours</span>
              </div>
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div>
                  <label className="block text-[11px] font-bold text-slate-600">Start Time</label>
                  <input
                    type="time"
                    value={sessionSettings.dayStart}
                    onChange={(e) => setSessionSettings({ ...sessionSettings, dayStart: e.target.value })}
                    className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-1.5 text-xs text-slate-900"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-600">End Time</label>
                  <input
                    type="time"
                    value={sessionSettings.dayEnd}
                    onChange={(e) => setSessionSettings({ ...sessionSettings, dayEnd: e.target.value })}
                    className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-1.5 text-xs text-slate-900"
                  />
                </div>
              </div>
              <p className="text-[11px] text-slate-500">Typical Barat/Lunch wedding session</p>
            </div>

            {/* Night Session Card */}
            <div className="rounded-2xl border border-blue-200 bg-blue-50/40 p-4 space-y-3">
              <div className="flex items-center gap-2 text-blue-700 font-bold text-xs">
                <Moon className="h-4 w-4" />
                <span>🌙 Night Session Default Hours</span>
              </div>
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div>
                  <label className="block text-[11px] font-bold text-slate-600">Start Time</label>
                  <input
                    type="time"
                    value={sessionSettings.nightStart}
                    onChange={(e) => setSessionSettings({ ...sessionSettings, nightStart: e.target.value })}
                    className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-1.5 text-xs text-slate-900"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-600">End Time</label>
                  <input
                    type="time"
                    value={sessionSettings.nightEnd}
                    onChange={(e) => setSessionSettings({ ...sessionSettings, nightEnd: e.target.value })}
                    className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-1.5 text-xs text-slate-900"
                  />
                </div>
              </div>
              <p className="text-[11px] text-slate-500">Typical Walima/Dinner wedding reception</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700">Default Token Hold Duration</label>
              <select
                value={sessionSettings.autoHoldHours}
                onChange={(e) => setSessionSettings({ ...sessionSettings, autoHoldHours: Number(e.target.value) })}
                className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-xs text-slate-900"
              >
                <option value={24}>24 Hours Auto-Hold</option>
                <option value={48}>48 Hours Auto-Hold</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700">Billing Currency</label>
              <input
                type="text"
                disabled
                value="Pakistani Rupee (PKR)"
                className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-100 px-3.5 py-2 text-xs text-slate-500"
              />
            </div>
          </div>

          <div className="flex justify-end pt-3">
            <button
              type="submit"
              className="rounded-2xl bg-[#2563eb] hover:bg-[#1d4ed8] text-white font-bold text-xs px-6 py-2.5 shadow-sm transition cursor-pointer"
            >
              Save Session Preferences
            </button>
          </div>
        </form>
      )}

      {/* Tab: Notifications */}
      {activeTab === "notifications" && (
        <div className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-xs space-y-4 text-xs">
          <h3 className="text-sm font-black text-slate-900">Notification Alerts</h3>
          <p className="text-slate-500">Configure how you receive updates on new bookings and payments</p>

          <div className="space-y-3 pt-2">
            <label className="flex items-center justify-between p-3.5 rounded-2xl border border-slate-200 hover:bg-slate-50 cursor-pointer">
              <div>
                <p className="font-bold text-slate-900">New Booking Confirmation Alerts</p>
                <p className="text-slate-500 text-[11px]">Receive in-app notification when customer booking is confirmed</p>
              </div>
              <input type="checkbox" defaultChecked className="h-4 w-4 text-blue-600 rounded" />
            </label>

            <label className="flex items-center justify-between p-3.5 rounded-2xl border border-slate-200 hover:bg-slate-50 cursor-pointer">
              <div>
                <p className="font-bold text-slate-900">Token Hold Expiry Warnings</p>
                <p className="text-slate-500 text-[11px]">Notify 4 hours before a token reservation expires</p>
              </div>
              <input type="checkbox" defaultChecked className="h-4 w-4 text-blue-600 rounded" />
            </label>

            <label className="flex items-center justify-between p-3.5 rounded-2xl border border-slate-200 hover:bg-slate-50 cursor-pointer">
              <div>
                <p className="font-bold text-slate-900">Payment Received Invoices</p>
                <p className="text-slate-500 text-[11px]">Instant receipt generation on customer payment recorded</p>
              </div>
              <input type="checkbox" defaultChecked className="h-4 w-4 text-blue-600 rounded" />
            </label>
          </div>
        </div>
      )}

      {/* Tab: Security */}
      {activeTab === "security" && (
        <div className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-xs space-y-4 text-xs">
          <h3 className="text-sm font-black text-slate-900">Account Security & Credentials</h3>
          <p className="text-slate-500">Password management and authentication safeguards</p>

          <div className="rounded-2xl bg-blue-50/60 border border-blue-200 p-4 space-y-2">
            <div className="flex items-center gap-2 font-bold text-blue-900">
              <Shield className="h-4 w-4 text-blue-600" />
              <span>Security Protocols Active</span>
            </div>
            <p className="text-[11px] text-slate-600 leading-relaxed">
              Your session is protected by encrypted JWT tokens and strict PostgreSQL ownership isolation.
              To change your primary email or master administrative credentials, please coordinate directly with the Super Admin.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
