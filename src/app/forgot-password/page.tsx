"use client";

import { useActionState } from "react";
import Link from "next/link";
import { forgotPasswordAction, type ForgotPasswordState } from "@/lib/auth/actions";

export default function ForgotPasswordPage() {
  const [state, formAction, pending] = useActionState<ForgotPasswordState, FormData>(forgotPasswordAction, null);

  return (
    <main className="flex min-h-screen items-center justify-center bg-surface-soft p-6">
      <div className="w-full max-w-md rounded-[32px] border border-hairline bg-canvas p-8 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">Reset password</p>
        <h1 className="mt-3 text-2xl font-bold text-ink">Forgot your password?</h1>
        <p className="mt-2 text-sm text-mute">
          This only works for the Admin&apos;s email login. Staff should ask the admin to reset their password from Staff Management.
        </p>

        <form action={formAction} className="mt-6 space-y-4">
          <div>
            <label className="mb-1 block text-sm font-semibold text-body" htmlFor="email">Email</label>
            <input
              id="email"
              name="email"
              type="email"
              required
              autoComplete="email"
              className="w-full rounded-2xl border border-hairline px-3 py-2.5 text-sm text-ink outline-none transition focus:border-ink"
              placeholder="you@hall.com"
            />
          </div>

          {state && "error" in state ? (
            <div className="rounded-2xl border border-error/20 bg-error/5 px-3 py-2 text-sm text-error">{state.error}</div>
          ) : null}
          {state && "message" in state ? (
            <div className="rounded-2xl border border-success-deep/20 bg-success-pale px-3 py-2 text-sm text-success-deep">{state.message}</div>
          ) : null}

          <button
            type="submit"
            disabled={pending}
            className="w-full rounded-2xl bg-primary px-4 py-2.5 text-sm font-bold text-white transition hover:bg-primary-pressed disabled:cursor-not-allowed disabled:opacity-70"
          >
            {pending ? "Sending..." : "Send reset link"}
          </button>
        </form>

        <Link href="/login" className="mt-4 block text-center text-sm font-semibold text-primary hover:underline">
          ← Back to login
        </Link>
      </div>
    </main>
  );
}
