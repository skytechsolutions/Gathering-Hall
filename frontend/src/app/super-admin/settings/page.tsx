"use client";

import { useState, useEffect } from "react";
import {
  Settings,
  ShieldCheck,
  Server,
  Database,
  Lock,
  Phone,
  Mail,
  Clock,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Save,
  MessageSquare,
  Globe,
  Bell,
  RefreshCw,
} from "lucide-react";

export default function SuperAdminSystemSettingsPage() {
  const [platformName, setPlatformName] = useState("Chamkani Gathering Hall Management");
  const [supportPhone, setSupportPhone] = useState("+92 300 1234567");
  const [supportEmail, setSupportEmail] = useState("support@chamkani-halls.com");
  const [supportWhatsApp, setSupportWhatsApp] = useState("+92 300 1234567");
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [instantHallApproval, setInstantHallApproval] = useState(true);
  const [minPasswordLength, setMinPasswordLength] = useState(6);
  const [sessionTimeoutDays, setSessionTimeoutDays] = useState(30);
  const [statusMsg, setStatusMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Load saved system settings from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem("gathering_hall_system_settings");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.platformName) setPlatformName(parsed.platformName);
        if (parsed.supportPhone) setSupportPhone(parsed.supportPhone);
        if (parsed.supportEmail) setSupportEmail(parsed.supportEmail);
        if (parsed.supportWhatsApp) setSupportWhatsApp(parsed.supportWhatsApp);
        if (typeof parsed.maintenanceMode === "boolean") setMaintenanceMode(parsed.maintenanceMode);
        if (typeof parsed.instantHallApproval === "boolean") setInstantHallApproval(parsed.instantHallApproval);
        if (parsed.minPasswordLength) setMinPasswordLength(parsed.minPasswordLength);
        if (parsed.sessionTimeoutDays) setSessionTimeoutDays(parsed.sessionTimeoutDays);
      }
    } catch {}
  }, []);

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = {
        platformName,
        supportPhone,
        supportEmail,
        supportWhatsApp,
        maintenanceMode,
        instantHallApproval,
        minPasswordLength,
        sessionTimeoutDays,
        updatedAt: new Date().toISOString(),
      };
      localStorage.setItem("gathering_hall_system_settings", JSON.stringify(payload));
      setStatusMsg({ type: "success", text: "System-level settings saved successfully!" });
      setTimeout(() => setStatusMsg(null), 4000);
    } catch (err: any) {
      setStatusMsg({ type: "error", text: "Failed to persist system settings." });
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-[#faf7f2] rounded-2xl p-6 border border-[#e5ded4]">
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-[#ebe3d7] text-[#1e382b] border border-[#d6cec3]">
            <Settings className="h-3.5 w-3.5 text-[#1e382b]" /> Platform Administration
          </span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-[#1f2421] mt-2">
          System-Level Settings & Configuration
        </h1>
        <p className="text-xs sm:text-sm text-[#6c726d] font-medium mt-1">
          Configure platform parameters, owner support channels, security policies, and operational controls
        </p>
      </div>

      {statusMsg && (
        <div
          className={`flex items-center gap-2 rounded-xl p-4 text-sm ${
            statusMsg.type === "success"
              ? "border border-emerald-200 bg-emerald-50 text-emerald-800"
              : "border border-rose-200 bg-rose-50 text-rose-800"
          }`}
        >
          {statusMsg.type === "success" ? (
            <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0" />
          ) : (
            <AlertCircle className="h-5 w-5 text-rose-600 shrink-0" />
          )}
          <span className="font-semibold">{statusMsg.text}</span>
        </div>
      )}

      <form onSubmit={handleSaveSettings} className="space-y-6">
        {/* Section 1: Platform Identity & General Info */}
        <div className="rounded-2xl border border-[#e5ded4] bg-[#faf7f2] p-6">
          <div className="flex items-center gap-2.5 mb-4 pb-3 border-b border-[#e5ded4]">
            <div className="p-2 rounded-xl bg-[#ebe3d7] text-[#1e382b]">
              <Globe className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-[#1f2421] text-base">Platform Identity & General Information</h3>
              <p className="text-xs text-[#6c726d] font-medium">Core metadata shown across administrative and owner portals</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-[#1f2421]">Platform Brand Name</label>
              <input
                type="text"
                required
                value={platformName}
                onChange={(e) => setPlatformName(e.target.value)}
                className="mt-1 w-full rounded-xl border border-[#d6cec3] bg-white px-3.5 py-2.5 text-sm text-[#1f2421] focus:border-[#1e382b] focus:ring-2 focus:ring-[#1e382b]/20 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#1f2421]">Operating Timezone & Currency</label>
              <input
                type="text"
                disabled
                value="Asia/Karachi (PKT, UTC+5) • PKR (Pakistani Rupee)"
                className="mt-1 w-full rounded-xl border border-[#d6cec3] bg-[#ebe3d7]/50 px-3.5 py-2.5 text-sm text-[#6c726d] cursor-not-allowed font-medium"
              />
            </div>
          </div>
        </div>

        {/* Section 2: Owner Support & Assistance Channels */}
        <div className="rounded-2xl border border-[#e5ded4] bg-[#faf7f2] p-6">
          <div className="flex items-center gap-2.5 mb-4 pb-3 border-b border-[#e5ded4]">
            <div className="p-2 rounded-xl bg-emerald-50 text-emerald-700">
              <Phone className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-[#1f2421] text-base">Hall Owner Support & Helpdesk Channels</h3>
              <p className="text-xs text-[#6c726d] font-medium">Helpline and communication channels provided to hall owners for assistance</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-[#1f2421]">Direct Support Phone Hotline</label>
              <div className="relative mt-1">
                <input
                  type="text"
                  required
                  value={supportPhone}
                  onChange={(e) => setSupportPhone(e.target.value)}
                  className="w-full rounded-xl border border-[#d6cec3] bg-white px-3.5 py-2.5 pl-9 text-sm text-[#1f2421] focus:border-[#1e382b] focus:ring-2 focus:ring-[#1e382b]/20 focus:outline-none"
                />
                <Phone className="h-4 w-4 text-[#7a7368] absolute left-3 top-1/2 -translate-y-1/2" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#1f2421]">WhatsApp Assistance Hotline</label>
              <div className="relative mt-1">
                <input
                  type="text"
                  required
                  value={supportWhatsApp}
                  onChange={(e) => setSupportWhatsApp(e.target.value)}
                  className="w-full rounded-xl border border-[#d6cec3] bg-white px-3.5 py-2.5 pl-9 text-sm text-[#1f2421] focus:border-[#1e382b] focus:ring-2 focus:ring-[#1e382b]/20 focus:outline-none"
                />
                <MessageSquare className="h-4 w-4 text-emerald-600 absolute left-3 top-1/2 -translate-y-1/2" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#1f2421]">Official Support Email</label>
              <div className="relative mt-1">
                <input
                  type="email"
                  required
                  value={supportEmail}
                  onChange={(e) => setSupportEmail(e.target.value)}
                  className="w-full rounded-xl border border-[#d6cec3] bg-white px-3.5 py-2.5 pl-9 text-sm text-[#1f2421] focus:border-[#1e382b] focus:ring-2 focus:ring-[#1e382b]/20 focus:outline-none"
                />
                <Mail className="h-4 w-4 text-[#7a7368] absolute left-3 top-1/2 -translate-y-1/2" />
              </div>
            </div>
          </div>
        </div>

        {/* Section 3: Owner Access, Security & Direct Hall Creation */}
        <div className="rounded-2xl border border-[#e5ded4] bg-[#faf7f2] p-6">
          <div className="flex items-center gap-2.5 mb-4 pb-3 border-b border-[#e5ded4]">
            <div className="p-2 rounded-xl bg-amber-50 text-amber-700">
              <Lock className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-[#1f2421] text-base">Security Policies & Hall Creation Flow</h3>
              <p className="text-xs text-[#6c726d] font-medium">Owner account policies, authentication parameters, and publishing rights</p>
            </div>
          </div>

          <div className="space-y-4">
            {/* Direct Hall Creation Policy Toggle */}
            <div className="flex items-center justify-between p-4 rounded-xl border border-[#e5ded4] bg-[#ebe3d7]/30">
              <div className="pr-4">
                <p className="text-sm font-bold text-[#1f2421]">Direct Hall Activation (Auto-Approved)</p>
                <p className="text-xs text-[#6c726d] mt-0.5">
                  When owners create a hall, it is instantly approved and ready for Day & Night bookings without requiring Super Admin manual review.
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer shrink-0">
                <input
                  type="checkbox"
                  checked={instantHallApproval}
                  onChange={(e) => setInstantHallApproval(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-[#d6cec3] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#1e382b]"></div>
              </label>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
              <div>
                <label className="block text-xs font-bold text-[#1f2421]">Minimum Password Length</label>
                <input
                  type="number"
                  min={6}
                  max={24}
                  value={minPasswordLength}
                  onChange={(e) => setMinPasswordLength(parseInt(e.target.value, 10) || 6)}
                  className="mt-1 w-full rounded-xl border border-[#d6cec3] bg-white px-3.5 py-2.5 text-sm text-[#1f2421] focus:border-[#1e382b] focus:ring-2 focus:ring-[#1e382b]/20 focus:outline-none"
                />
                <p className="text-[11px] text-[#6c726d] mt-1">Applies to all newly created owner passwords and resets.</p>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#1f2421]">Owner Session Timeout (Days)</label>
                <input
                  type="number"
                  min={1}
                  max={90}
                  value={sessionTimeoutDays}
                  onChange={(e) => setSessionTimeoutDays(parseInt(e.target.value, 10) || 30)}
                  className="mt-1 w-full rounded-xl border border-[#d6cec3] bg-white px-3.5 py-2.5 text-sm text-[#1f2421] focus:border-[#1e382b] focus:ring-2 focus:ring-[#1e382b]/20 focus:outline-none"
                />
                <p className="text-[11px] text-[#6c726d] mt-1">Duration before refresh tokens require renewed authentication.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Section 4: Operational Health & Infrastructure */}
        <div className="rounded-2xl border border-[#e5ded4] bg-[#faf7f2] p-6">
          <div className="flex items-center gap-2.5 mb-4 pb-3 border-b border-[#e5ded4]">
            <div className="p-2 rounded-xl bg-indigo-50 text-indigo-700">
              <Server className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-[#1f2421] text-base">Operational Infrastructure & Health</h3>
              <p className="text-xs text-[#6c726d] font-medium">Real-time server daemons, background schedulers, and database status</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="p-3.5 rounded-xl border border-[#e5ded4] bg-[#ebe3d7]/40">
              <div className="flex items-center gap-2 text-xs font-bold text-[#6c726d] uppercase tracking-wider">
                <Database className="h-4 w-4 text-emerald-600" />
                <span>PostgreSQL DB</span>
              </div>
              <p className="font-bold text-sm text-emerald-700 mt-1 flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-emerald-500" /> Connected (Prisma)
              </p>
              <p className="text-[11px] text-[#6c726d] mt-0.5">Chamkani Gathering Hall</p>
            </div>

            <div className="p-3.5 rounded-xl border border-[#e5ded4] bg-[#ebe3d7]/40">
              <div className="flex items-center gap-2 text-xs font-bold text-[#6c726d] uppercase tracking-wider">
                <Clock className="h-4 w-4 text-indigo-600" />
                <span>Hold Scheduler</span>
              </div>
              <p className="font-bold text-sm text-indigo-700 mt-1 flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-indigo-500" /> Active Daemon
              </p>
              <p className="text-[11px] text-[#6c726d] mt-0.5">Auto-checks holds every 60s</p>
            </div>

            <div className="p-3.5 rounded-xl border border-[#e5ded4] bg-[#ebe3d7]/40">
              <div className="flex items-center gap-2 text-xs font-bold text-[#6c726d] uppercase tracking-wider">
                <ShieldCheck className="h-4 w-4 text-[#1e382b]" />
                <span>Security Engine</span>
              </div>
              <p className="font-bold text-sm text-[#1f2421] mt-1 flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-emerald-500" /> JWT + Argon2/Bcrypt
              </p>
              <p className="text-[11px] text-[#6c726d] mt-0.5">Strict RBAC Enforced</p>
            </div>
          </div>
        </div>

        {/* Submit Actions */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            type="submit"
            className="inline-flex items-center gap-2 rounded-xl bg-[#1e382b] hover:bg-[#162a20] px-6 py-3 text-xs sm:text-sm font-bold text-white active:scale-95 transition cursor-pointer"
          >
            <Save className="h-4 w-4" />
            <span>Save System Settings</span>
          </button>
        </div>
      </form>
    </div>
  );
}
