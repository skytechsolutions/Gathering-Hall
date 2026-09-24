"use client";

import { useActionState, useRef, useState } from "react";
import { createUserAction, type CreateUserState } from "@/lib/admin/actions";
import { PasswordField } from "@/components/password-field";

const inputClass = "w-full rounded-2xl border border-hairline px-3 py-2.5 text-sm text-ink outline-none transition focus:border-ink";
const labelClass = "mb-1 block text-sm font-semibold text-body";

function passwordHint(password: string, confirm: string): { text: string; ok: boolean } | null {
  if (!password && !confirm) return null;
  if (password.length < 8) return { text: "At least 8 characters", ok: false };
  if (!/[a-zA-Z]/.test(password) || !/[0-9]/.test(password)) return { text: "Needs both letters and numbers", ok: false };
  if (confirm && password !== confirm) return { text: "Passwords don't match", ok: false };
  if (!confirm) return { text: "Looks good — confirm it below", ok: true };
  return { text: "Passwords match", ok: true };
}

export function UserForm() {
  const formRef = useRef<HTMLFormElement>(null);
  const [role, setRole] = useState<"STAFF" | "ADMIN">("STAFF");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [state, formAction, pending] = useActionState<CreateUserState, FormData>(async (prevState, formData) => {
    const result = await createUserAction(prevState, formData);
    if (result && "success" in result) {
      formRef.current?.reset();
      setPassword("");
      setConfirmPassword("");
      setRole("STAFF");
    }
    return result;
  }, null);

  const hint = passwordHint(password, confirmPassword);

  return (
    <div className="rounded-2xl border border-hairline bg-canvas p-4 shadow-sm sm:rounded-[32px] sm:p-6">
      <h2 className="text-lg font-bold text-ink">Add User</h2>
      <form ref={formRef} action={formAction} className="mt-4 grid gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <label className={labelClass}>Role</label>
          <div className="flex gap-2">
            <label
              className={`flex-1 cursor-pointer rounded-2xl border px-4 py-2.5 text-center text-sm font-semibold transition ${
                role === "STAFF" ? "border-ink bg-ink text-white" : "border-hairline text-body hover:bg-surface-card"
              }`}
            >
              <input type="radio" name="role" value="STAFF" checked={role === "STAFF"} onChange={() => setRole("STAFF")} className="sr-only" />
              Staff
            </label>
            <label
              className={`flex-1 cursor-pointer rounded-2xl border px-4 py-2.5 text-center text-sm font-semibold transition ${
                role === "ADMIN" ? "border-ink bg-ink text-white" : "border-hairline text-body hover:bg-surface-card"
              }`}
            >
              <input type="radio" name="role" value="ADMIN" checked={role === "ADMIN"} onChange={() => setRole("ADMIN")} className="sr-only" />
              Admin
            </label>
          </div>
        </div>

        <div>
          <label className={labelClass} htmlFor="fullName">Full Name</label>
          <input id="fullName" name="fullName" required className={inputClass} />
        </div>

        {role === "STAFF" ? (
          <div>
            <label className={labelClass} htmlFor="username">Username</label>
            <input id="username" name="username" required minLength={3} maxLength={30} placeholder="e.g. talha" autoComplete="off" className={inputClass} />
          </div>
        ) : (
          <div>
            <label className={labelClass} htmlFor="email">Email</label>
            <input id="email" name="email" type="email" required placeholder="e.g. manager@hall.com" autoComplete="off" className={inputClass} />
          </div>
        )}

        <div>
          <label className={labelClass} htmlFor="phone">Phone</label>
          <input id="phone" name="phone" autoComplete="off" className={inputClass} />
        </div>
        <div />
        <div>
          <label className={labelClass} htmlFor="password">Password</label>
          <PasswordField
            id="password"
            name="password"
            required
            minLength={8}
            autoComplete="new-password"
            placeholder="At least 8 characters, letters + numbers"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            className={inputClass}
          />
        </div>
        <div>
          <label className={labelClass} htmlFor="confirmPassword">Confirm Password</label>
          <PasswordField
            id="confirmPassword"
            name="confirmPassword"
            required
            minLength={8}
            autoComplete="new-password"
            value={confirmPassword}
            onChange={(event) => setConfirmPassword(event.target.value)}
            className={inputClass}
          />
        </div>

        {hint ? (
          <p className={`sm:col-span-2 text-xs font-semibold ${hint.ok ? "text-success-deep" : "text-mute"}`}>{hint.text}</p>
        ) : null}

        {state && "error" in state ? (
          <div className="sm:col-span-2 rounded-2xl border border-error/20 bg-error/5 px-3 py-2 text-sm text-error">{state.error}</div>
        ) : null}

        {state && "success" in state ? (
          <div className="sm:col-span-2 rounded-2xl border border-success-deep/20 bg-success-pale px-3 py-2 text-sm text-success-deep">
            {state.role === "ADMIN" ? "Admin" : "Staff"} account created for <strong>{state.loginId}</strong>. They sign in with{" "}
            {state.role === "ADMIN" ? "this email" : "this username"} and the password you just set.
          </div>
        ) : null}

        <div className="sm:col-span-2">
          <button
            type="submit"
            disabled={pending}
            className="rounded-2xl bg-primary px-5 py-2.5 text-sm font-bold text-white transition hover:bg-primary-pressed disabled:cursor-not-allowed disabled:opacity-70"
          >
            {pending ? "Creating..." : "Create Account"}
          </button>
        </div>
      </form>
    </div>
  );
}
