"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/auth-context";
import { authApi } from "@/services/api/auth.api";
import { Modal } from "@/components/ui/modal";
import {
  User,
  Mail,
  Phone,
  Lock,
  Eye,
  EyeOff,
  AlertCircle,
  CheckCircle2,
  X,
  HelpCircle,
} from "lucide-react";

interface SlidingAuthCardProps {
  initialMode?: "signin" | "signup";
}

export default function SlidingAuthCard({ initialMode = "signin" }: SlidingAuthCardProps) {
  const [isSignUp, setIsSignUp] = useState(initialMode === "signup");
  const { login } = useAuth();
  const router = useRouter();

  // Sign In Form State
  const [signInEmail, setSignInEmail] = useState("");
  const [signInPassword, setSignInPassword] = useState("");
  const [keepSignedIn, setKeepSignedIn] = useState(true);
  const [showSignInPassword, setShowSignInPassword] = useState(false);
  const [signInError, setSignInError] = useState<string | null>(null);
  const [signInLoading, setSignInLoading] = useState(false);

  // Sign Up Form State
  const [signUpForm, setSignUpForm] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
  });
  const [showSignUpPassword, setShowSignUpPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [signUpError, setSignUpError] = useState<string | null>(null);
  const [signUpLoading, setSignUpLoading] = useState(false);
  const [signUpSuccess, setSignUpSuccess] = useState(false);

  // Forgot Password Modal State
  const [forgotModalOpen, setForgotModalOpen] = useState(false);

  // Handle Sign In Submission
  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setSignInError(null);
    setSignInLoading(true);

    try {
      const user = await login({ email: signInEmail, password: signInPassword });
      if (user.role === "SUPER_ADMIN") {
        router.push("/super-admin");
      } else if (user.role === "HALL_OWNER") {
        if (user.status === "PENDING") {
          setSignInError("Your account is currently PENDING approval by the Super Admin.");
        } else if (user.status === "REJECTED" || user.status === "BLOCKED") {
          setSignInError(`Your account has been ${user.status.toLowerCase()}. Please contact system support.`);
        } else {
          router.push("/dashboard");
        }
      } else {
        router.push("/dashboard");
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Invalid email or password. Please try again.";
      setSignInError(msg);
    } finally {
      setSignInLoading(false);
    }
  };

  // Handle Sign Up Submission
  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setSignUpError(null);

    if (signUpForm.password !== signUpForm.confirmPassword) {
      setSignUpError("Passwords do not match.");
      return;
    }

    if (signUpForm.password.length < 6) {
      setSignUpError("Password must be at least 6 characters long.");
      return;
    }

    setSignUpLoading(true);

    try {
      await authApi.register({
        name: signUpForm.name,
        email: signUpForm.email,
        phone: signUpForm.phone,
        password: signUpForm.password,
      });
      setSignUpSuccess(true);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Registration failed. Please check your information.";
      setSignUpError(msg);
    } finally {
      setSignUpLoading(false);
    }
  };

  return (
    <div className="w-full min-h-screen md:h-screen md:max-h-screen flex flex-col md:flex-row bg-[#f5f0e8] overflow-x-hidden overflow-y-auto md:overflow-hidden select-none relative">
      
      {/* ============================================================== */}
      {/* DESKTOP SLIDING BLADE: FULL SCREEN 50% SPLIT (TOP TO BOTTOM)   */}
      {/* ============================================================== */}
      <div
        className={`hidden md:block absolute top-0 left-0 w-1/2 h-full z-20 transition-transform duration-700 ease-[cubic-bezier(0.65,0,0.35,1)] ${
          isSignUp ? "translate-x-0" : "translate-x-full"
        }`}
        style={{ willChange: "transform" }}
      >
        {/* Subtle Angled Blade Seam across Full Viewport Height */}
        <div
          className={`relative w-[101.5%] -ml-[0.75%] h-full overflow-hidden transition-all duration-700 shadow-2xl bg-[#180a03] ${
            isSignUp
              ? "transform -skew-x-[1.2deg] border-r border-amber-400/70 shadow-[-6px_0_30px_rgba(180,100,20,0.4)]"
              : "transform skew-x-[1.2deg] border-l border-amber-400/70 shadow-[6px_0_30px_rgba(180,100,20,0.4)]"
          }`}
        >
          {/* Counter-Skewed Container (Orthogonal, unskewed so image and text are 100% sharp) */}
          <div
            className={`relative w-full h-full transition-transform duration-700 ${
              isSignUp ? "transform skew-x-[1.2deg]" : "transform -skew-x-[1.2deg]"
            }`}
          >
            {/* Crisp, Sharp Gathering Hall Photograph covering Full Half Screen */}
            <img
              src={isSignUp ? "/images/gathering-hall-2.jpg" : "/images/gathering-hall.jpg"}
              alt="Chamkani Gathering Hall Banquet"
              className="absolute inset-0 w-full h-full object-cover object-center scale-[1.02] transition-all duration-700"
              style={{
                imageRendering: "-webkit-optimize-contrast",
                filter: "contrast(1.05) brightness(0.95)",
              }}
            />

            {/* Rich Luxury Brown Vignette */}
            <div className="absolute inset-0 bg-gradient-to-t from-[#1b0c05]/90 via-[#1b0c05]/35 to-[#120703]/30" />
            <div
              className={`absolute inset-0 transition-opacity duration-700 ${
                isSignUp
                  ? "bg-gradient-to-l from-[#220f06]/75 via-[#1b0c05]/25 to-transparent"
                  : "bg-gradient-to-r from-[#220f06]/75 via-[#1b0c05]/25 to-transparent"
              }`}
            />

            {/* Content Overlay with generous full-screen padding */}
            <div
              className={`relative z-10 w-full h-full p-8 sm:p-12 lg:p-16 flex flex-col justify-between transition-all duration-700 ${
                isSignUp ? "md:pr-16 lg:pr-20 md:pl-10 lg:pl-14" : "md:pl-16 lg:pl-20 md:pr-10 lg:pr-14"
              }`}
            >
              {/* Top Subtitle */}
              <div className="flex items-center gap-2.5">
                <span className="text-xs font-bold uppercase tracking-[0.3em] text-amber-400 drop-shadow-[0_1px_4px_rgba(0,0,0,0.9)]">
                  CHAMKANI
                </span>
                <span className="h-1.5 w-1.5 rounded-full bg-amber-400 shadow-[0_0_8px_#f59e0b]" />
                <span className="text-xs uppercase tracking-[0.2em] text-amber-200/90 font-semibold drop-shadow-[0_1px_4px_rgba(0,0,0,0.9)]">
                  PORTAL
                </span>
              </div>

              {/* Center Headlines */}
              <div className="space-y-4 my-auto drop-shadow-[0_2px_14px_rgba(0,0,0,0.95)] max-w-lg">
                {isSignUp ? (
                  <div className="animate-fadeIn">
                    <h2 className="text-3xl sm:text-4xl lg:text-5xl font-light text-white tracking-tight leading-[1.1]">
                      Start the{" "}
                      <span className="font-display-serif italic font-normal text-[#fbe7be] block mt-1.5">
                        first page.
                      </span>
                    </h2>
                    <p className="mt-4 text-xs sm:text-sm lg:text-base text-amber-100/95 leading-relaxed font-normal">
                      Register your banquet hall to automate bookings, schedule dates on the live calendar, and manage customer ledgers.
                    </p>
                  </div>
                ) : (
                  <div className="animate-fadeIn">
                    <h2 className="text-3xl sm:text-4xl lg:text-5xl font-light text-white tracking-tight leading-[1.1]">
                      Welcome{" "}
                      <span className="font-display-serif italic font-normal text-[#fbe7be] block mt-1.5">
                        back.
                      </span>
                    </h2>
                    <p className="mt-4 text-xs sm:text-sm lg:text-base text-amber-100/95 leading-relaxed font-normal">
                      Your halls, reservations, and customer bookings are exactly where you left them.
                    </p>
                  </div>
                )}
              </div>

              {/* Bottom Decorative Footer */}
              <div className="pt-4 border-t border-amber-800/40 flex items-center justify-between text-xs text-amber-200/90 drop-shadow">
                <span>Gathering Hall Management</span>
                <span className="font-mono text-xs text-amber-400 font-bold">v2.0</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ============================================================== */}
      {/* MOBILE HERO BANNER (visible only on mobile screens < md)       */}
      {/* Prominent gathering hall photo showing clearly down to form    */}
      {/* ============================================================== */}
      <div className="md:hidden relative w-full h-56 sm:h-64 overflow-hidden bg-[#180a03] shrink-0">
        <img
          src={isSignUp ? "/images/gathering-hall-2.jpg" : "/images/gathering-hall.jpg"}
          alt="Chamkani Gathering Hall Banquet"
          className="absolute inset-0 w-full h-full object-cover object-center transition-all duration-700"
          style={{
            imageRendering: "-webkit-optimize-contrast",
            filter: "contrast(1.05) brightness(0.95)",
          }}
        />
        {/* Luxury Brown Vignette Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#1b0c05]/95 via-[#1b0c05]/45 to-[#120703]/35" />

        {/* Banner Content */}
        <div className="relative z-10 w-full h-full p-5 flex flex-col justify-between text-center">
          {/* Top Subtitle */}
          <div className="flex items-center justify-center gap-2">
            <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-amber-400 drop-shadow">
              CHAMKANI
            </span>
            <span className="h-1 w-1 rounded-full bg-amber-400" />
            <span className="text-[10px] uppercase tracking-[0.2em] text-amber-200/90 font-semibold drop-shadow">
              PORTAL
            </span>
          </div>

          {/* Headline */}
          <div className="my-auto drop-shadow-[0_2px_10px_rgba(0,0,0,0.9)]">
            {isSignUp ? (
              <h2 className="text-2xl sm:text-3xl font-light text-white tracking-tight">
                Start the{" "}
                <span className="font-display-serif italic font-normal text-[#fbe7be]">
                  first page.
                </span>
              </h2>
            ) : (
              <h2 className="text-2xl sm:text-3xl font-light text-white tracking-tight">
                Welcome{" "}
                <span className="font-display-serif italic font-normal text-[#fbe7be]">
                  back.
                </span>
              </h2>
            )}
            <p className="mt-1 text-xs text-amber-100/90 max-w-xs mx-auto">
              {isSignUp
                ? "Register your banquet hall to join Chamkani network."
                : "Your halls, reservations, and customer bookings."}
            </p>
          </div>

          {/* Switcher Pills on Mobile Banner */}
          <div className="flex rounded-full bg-[#160a04]/85 p-1 border border-amber-500/30 max-w-[260px] w-full mx-auto backdrop-blur-sm shadow-md">
            <button
              onClick={() => {
                setIsSignUp(false);
                setSignInError(null);
              }}
              className={`flex-1 py-1 text-xs font-semibold rounded-full transition-all cursor-pointer ${
                !isSignUp ? "bg-[#1e382b] text-white shadow" : "text-amber-200/70 hover:text-white"
              }`}
            >
              Sign In
            </button>
            <button
              onClick={() => {
                setIsSignUp(true);
                setSignUpError(null);
              }}
              className={`flex-1 py-1 text-xs font-semibold rounded-full transition-all cursor-pointer ${
                isSignUp ? "bg-[#1e382b] text-white shadow" : "text-amber-200/70 hover:text-white"
              }`}
            >
              Create Account
            </button>
          </div>
        </div>
      </div>

      {/* ============================================================== */}
      {/* LEFT PANE: SIGN IN FORM                                        */}
      {/* ============================================================== */}
      <div
        className={`w-full md:w-1/2 flex-1 md:flex-none md:h-full flex flex-col justify-start md:justify-center items-center px-6 pt-6 pb-10 md:p-12 lg:p-16 transition-all duration-700 ease-[cubic-bezier(0.65,0,0.35,1)] rounded-t-[24px] md:rounded-none -mt-4 md:mt-0 bg-[#f5f0e8] relative z-10 shadow-lg md:shadow-none ${
          isSignUp
            ? "md:opacity-0 md:pointer-events-none md:-translate-x-8 hidden md:flex"
            : "opacity-100 pointer-events-auto translate-x-0 flex"
        }`}
      >
        <div className="w-full max-w-[360px] sm:max-w-[380px] mx-auto">
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight text-[#1f2421] mb-1">
            Sign in
          </h1>
          <p className="text-xs sm:text-sm font-medium text-[#6c726d] mb-5">
            Enter your credentials to access the management portal.
          </p>

          {signInError && (
            <div className="mb-4 flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-xs font-medium text-red-700">
              <AlertCircle className="h-4 w-4 shrink-0 text-red-600 mt-0.5" />
              <span>{signInError}</span>
            </div>
          )}

          <form onSubmit={handleSignIn} className="space-y-4">
            {/* Username or Email Input */}
            <div>
              <label className="block text-xs font-bold text-[#1f2421] mb-1.5" htmlFor="signin-email">
                Username or email
              </label>
              <div className="relative">
                <input
                  id="signin-email"
                  type="email"
                  required
                  value={signInEmail}
                  onChange={(e) => setSignInEmail(e.target.value)}
                  placeholder="admin@example.com"
                  className="w-full bg-[#faf7f2] rounded-xl border border-[#d6cec3] py-2.5 pl-3.5 pr-10 text-sm font-medium text-[#1f2421] placeholder:text-[#8c938d] placeholder:font-normal focus:border-[#1e382b] focus:outline-none focus:ring-1 focus:ring-[#1e382b] transition shadow-xs"
                />
                <User className="absolute right-3.5 top-3 h-4 w-4 text-[#8c938d] pointer-events-none" />
              </div>
            </div>

            {/* Password Input */}
            <div>
              <label className="block text-xs font-bold text-[#1f2421] mb-1.5" htmlFor="signin-password">
                Password
              </label>
              <div className="relative">
                <input
                  id="signin-password"
                  type={showSignInPassword ? "text" : "password"}
                  required
                  value={signInPassword}
                  onChange={(e) => setSignInPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-[#faf7f2] rounded-xl border border-[#d6cec3] py-2.5 pl-3.5 pr-10 text-sm font-medium text-[#1f2421] placeholder:text-[#8c938d] placeholder:font-normal focus:border-[#1e382b] focus:outline-none focus:ring-1 focus:ring-[#1e382b] transition shadow-xs"
                />
                <button
                  type="button"
                  onClick={() => setShowSignInPassword(!showSignInPassword)}
                  className="absolute right-3.5 top-3 text-[#8c938d] hover:text-[#1f2421] transition cursor-pointer"
                >
                  {showSignInPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {/* Options Row */}
            <div className="flex items-center justify-between pt-0.5">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={keepSignedIn}
                  onChange={(e) => setKeepSignedIn(e.target.checked)}
                  className="h-4 w-4 rounded border-[#d6cec3] text-[#1e382b] focus:ring-[#1e382b] accent-[#1e382b]"
                />
                <span className="text-xs text-[#1f2421] font-semibold">Keep me signed in</span>
              </label>

              <button
                type="button"
                onClick={() => setForgotModalOpen(true)}
                className="text-xs font-bold text-[#1e382b] hover:underline cursor-pointer"
              >
                Forgot password?
              </button>
            </div>

            {/* Action Button */}
            <button
              type="submit"
              disabled={signInLoading}
              className="w-full mt-2 rounded-full bg-[#1e382b] hover:bg-[#162a20] py-3 text-sm font-bold text-white shadow-md shadow-[#1e382b]/20 active:scale-[0.99] transition-all disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
            >
              {signInLoading ? "Signing in..." : "Sign in"}
            </button>
          </form>

          {/* Toggle Link to Sign Up */}
          <div className="mt-5 text-center pt-3.5 border-t border-[#e5ded4]">
            <p className="text-xs sm:text-sm font-medium text-[#6c726d]">
              New to CHAMKANI?{" "}
              <button
                type="button"
                onClick={() => {
                  setIsSignUp(true);
                  setSignInError(null);
                }}
                className="font-bold text-[#1e382b] hover:underline ml-1 cursor-pointer"
              >
                Create an account
              </button>
            </p>
          </div>
        </div>
      </div>

      {/* ============================================================== */}
      {/* RIGHT PANE: SIGN UP FORM                                       */}
      {/* ============================================================== */}
      <div
        className={`w-full md:w-1/2 flex-1 md:flex-none md:h-full flex flex-col justify-start md:justify-center items-center px-6 pt-6 pb-10 md:p-12 lg:p-16 transition-all duration-700 ease-[cubic-bezier(0.65,0,0.35,1)] rounded-t-[24px] md:rounded-none -mt-4 md:mt-0 bg-[#f5f0e8] relative z-10 shadow-lg md:shadow-none ${
          isSignUp
            ? "opacity-100 pointer-events-auto translate-x-0 flex"
            : "md:opacity-0 md:pointer-events-none md:translate-x-8 hidden md:flex"
        }`}
      >
        <div className="w-full max-w-[360px] sm:max-w-[380px] mx-auto">
          {signUpSuccess ? (
            <div className="rounded-2xl border border-[#e5ded4] bg-[#faf7f2] p-6 text-center animate-fadeIn shadow-sm">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[#ebe3d7] text-[#1e382b]">
                <CheckCircle2 className="h-6 w-6" />
              </div>
              <h3 className="mt-3 text-lg font-bold text-[#1f2421]">Application Submitted!</h3>
              <p className="mt-2 text-xs sm:text-sm text-[#6c726d] leading-relaxed">
                Your hall owner account has been registered with status{" "}
                <strong className="font-semibold text-[#1e382b]">PENDING</strong>. A Super Admin will review and verify your details before granting dashboard access.
              </p>
              <button
                type="button"
                onClick={() => {
                  setSignUpSuccess(false);
                  setIsSignUp(false);
                  setSignUpForm({ name: "", email: "", phone: "", password: "", confirmPassword: "" });
                }}
                className="mt-4 w-full rounded-full bg-[#1e382b] hover:bg-[#162a20] py-2.5 text-xs sm:text-sm font-semibold text-white transition shadow cursor-pointer"
              >
                Return to Sign In
              </button>
            </div>
          ) : (
            <>
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight text-[#1f2421] mb-1">
                Create account
              </h1>
              <p className="text-xs sm:text-sm font-medium text-[#6c726d] mb-4">
                Register your hall business to join the Chamkani network.
              </p>

              {signUpError && (
                <div className="mb-3 flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 p-2.5 text-xs font-medium text-red-700">
                  <AlertCircle className="h-4 w-4 shrink-0 text-red-600 mt-0.5" />
                  <span>{signUpError}</span>
                </div>
              )}

              <form onSubmit={handleSignUp} className="space-y-2.5">
                {/* Name Input */}
                <div>
                  <label className="block text-xs font-bold text-[#1f2421] mb-1" htmlFor="signup-name">
                    Full Name / Business Name
                  </label>
                  <div className="relative">
                    <input
                      id="signup-name"
                      type="text"
                      required
                      value={signUpForm.name}
                      onChange={(e) => setSignUpForm({ ...signUpForm, name: e.target.value })}
                      placeholder="Haji Malik Khan"
                      className="w-full bg-[#faf7f2] rounded-xl border border-[#d6cec3] py-2 pl-3.5 pr-9 text-xs sm:text-sm font-medium text-[#1f2421] placeholder:text-[#8c938d] placeholder:font-normal focus:border-[#1e382b] focus:outline-none focus:ring-1 focus:ring-[#1e382b] transition shadow-xs"
                    />
                    <User className="absolute right-3.5 top-2.5 h-4 w-4 text-[#8c938d] pointer-events-none" />
                  </div>
                </div>

                {/* Email Input */}
                <div>
                  <label className="block text-xs font-bold text-[#1f2421] mb-1" htmlFor="signup-email">
                    Email Address
                  </label>
                  <div className="relative">
                    <input
                      id="signup-email"
                      type="email"
                      required
                      value={signUpForm.email}
                      onChange={(e) => setSignUpForm({ ...signUpForm, email: e.target.value })}
                      placeholder="owner@example.com"
                      className="w-full bg-[#faf7f2] rounded-xl border border-[#d6cec3] py-2 pl-3.5 pr-9 text-xs sm:text-sm font-medium text-[#1f2421] placeholder:text-[#8c938d] placeholder:font-normal focus:border-[#1e382b] focus:outline-none focus:ring-1 focus:ring-[#1e382b] transition shadow-xs"
                    />
                    <Mail className="absolute right-3.5 top-2.5 h-4 w-4 text-[#8c938d] pointer-events-none" />
                  </div>
                </div>

                {/* Phone Input */}
                <div>
                  <label className="block text-xs font-bold text-[#1f2421] mb-1" htmlFor="signup-phone">
                    Phone Number
                  </label>
                  <div className="relative">
                    <input
                      id="signup-phone"
                      type="tel"
                      required
                      value={signUpForm.phone}
                      onChange={(e) => setSignUpForm({ ...signUpForm, phone: e.target.value })}
                      placeholder="0300-1234567"
                      className="w-full bg-[#faf7f2] rounded-xl border border-[#d6cec3] py-2 pl-3.5 pr-9 text-xs sm:text-sm font-medium text-[#1f2421] placeholder:text-[#8c938d] placeholder:font-normal focus:border-[#1e382b] focus:outline-none focus:ring-1 focus:ring-[#1e382b] transition shadow-xs"
                    />
                    <Phone className="absolute right-3.5 top-2.5 h-4 w-4 text-[#8c938d] pointer-events-none" />
                  </div>
                </div>

                {/* Passwords in 2 columns */}
                <div className="grid grid-cols-2 gap-2.5">
                  <div>
                    <label className="block text-xs font-bold text-[#1f2421] mb-1" htmlFor="signup-pwd">
                      Password
                    </label>
                    <div className="relative">
                      <input
                        id="signup-pwd"
                        type={showSignUpPassword ? "text" : "password"}
                        required
                        value={signUpForm.password}
                        onChange={(e) => setSignUpForm({ ...signUpForm, password: e.target.value })}
                        placeholder="••••••••"
                        className="w-full bg-[#faf7f2] rounded-xl border border-[#d6cec3] py-2 pl-3 pr-8 text-xs font-medium text-[#1f2421] placeholder:text-[#8c938d] focus:border-[#1e382b] focus:outline-none focus:ring-1 focus:ring-[#1e382b] shadow-xs"
                      />
                      <button
                        type="button"
                        onClick={() => setShowSignUpPassword(!showSignUpPassword)}
                        className="absolute right-2.5 top-2.5 text-[#8c938d] hover:text-[#1f2421] cursor-pointer"
                      >
                        {showSignUpPassword ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[#1f2421] mb-1" htmlFor="signup-confirm">
                      Confirm
                    </label>
                    <div className="relative">
                      <input
                        id="signup-confirm"
                        type={showConfirmPassword ? "text" : "password"}
                        required
                        value={signUpForm.confirmPassword}
                        onChange={(e) => setSignUpForm({ ...signUpForm, confirmPassword: e.target.value })}
                        placeholder="••••••••"
                        className="w-full bg-[#faf7f2] rounded-xl border border-[#d6cec3] py-2 pl-3 pr-8 text-xs font-medium text-[#1f2421] placeholder:text-[#8c938d] focus:border-[#1e382b] focus:outline-none focus:ring-1 focus:ring-[#1e382b] shadow-xs"
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-2.5 top-2.5 text-[#8c938d] hover:text-[#1f2421] cursor-pointer"
                      >
                        {showConfirmPassword ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={signUpLoading}
                  className="w-full mt-2 rounded-full bg-[#1e382b] hover:bg-[#162a20] py-2.5 text-xs sm:text-sm font-bold text-white shadow-md shadow-[#1e382b]/20 active:scale-[0.99] transition-all disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
                >
                  {signUpLoading ? "Creating account..." : "Create an account"}
                </button>
              </form>

              {/* Toggle Link to Sign In */}
              <div className="mt-4 text-center pt-3 border-t border-[#e5ded4]">
                <p className="text-xs sm:text-sm font-medium text-[#6c726d]">
                  Already have an account?{" "}
                  <button
                    type="button"
                    onClick={() => {
                      setIsSignUp(false);
                      setSignUpError(null);
                    }}
                    className="font-bold text-[#1e382b] hover:underline ml-1 cursor-pointer"
                  >
                    Sign in
                  </button>
                </p>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Forgot Password Modal */}
      <Modal
        isOpen={forgotModalOpen}
        onClose={() => setForgotModalOpen(false)}
        maxWidth="max-w-md"
      >
        <div className="flex items-center justify-between border-b border-[#e5ded4] pb-3 mb-4">
          <div className="flex items-center gap-2">
            <HelpCircle className="h-5 w-5 text-[#1e382b]" />
            <h3 className="font-bold text-[#1f2421] text-base">Account Recovery</h3>
          </div>
          <button
            onClick={() => setForgotModalOpen(false)}
            className="text-[#8c938d] hover:text-[#1f2421] cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <p className="text-xs sm:text-sm text-[#6c726d] leading-relaxed mb-4">
          For security reasons in the Chamkani Gathering Hall system, password resets are handled directly through system administrators.
        </p>

        <div className="rounded-xl bg-[#faf7f2] p-4 border border-[#e5ded4] text-xs sm:text-sm space-y-2">
          <p className="text-[#1f2421]">
            <strong>Super Admin Contact:</strong> <span className="font-mono text-[#1e382b] font-semibold">admin@example.com</span>
          </p>
          <p className="text-[#1f2421]">
            <strong>Emergency Helpline:</strong> <span className="font-mono text-[#1e382b] font-semibold">0300-0000000</span>
          </p>
        </div>

        <div className="mt-6 flex justify-end">
          <button
            type="button"
            onClick={() => setForgotModalOpen(false)}
            className="rounded-xl bg-[#1e382b] px-5 py-2.5 text-xs sm:text-sm font-semibold text-white hover:bg-[#162a20] transition cursor-pointer"
          >
            Understood
          </button>
        </div>
      </Modal>
    </div>
  );
}
