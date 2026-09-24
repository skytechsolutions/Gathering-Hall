"use client";

import { Suspense, useActionState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { signInAction, type SignInState } from "@/lib/auth/actions";
import { PasswordField } from "@/components/password-field";

function LoginForm() {
  const params = useSearchParams();
  const redirectTo = params.get("redirectTo") || "/dashboard";
  const [state, formAction, pending] = useActionState<SignInState, FormData>(signInAction, null);

  return (
    <form className="mt-6 space-y-4" action={formAction}>
      <input type="hidden" name="redirectTo" value={redirectTo} />
      <div>
        <label className="mb-1 block text-sm font-semibold text-body" htmlFor="identifier">Email or Username</label>
        <input
          id="identifier"
          name="identifier"
          type="text"
          required
          autoComplete="username"
          className="w-full rounded-2xl border border-hairline px-3 py-2.5 text-sm text-ink outline-none transition focus:border-ink"
          placeholder="Admin email or staff username"
        />
      </div>
      <div>
        <div className="mb-1 flex items-center justify-between">
          <label className="text-sm font-semibold text-body" htmlFor="password">Password</label>
          <Link href="/forgot-password" className="text-xs font-semibold text-primary hover:underline">Forgot password?</Link>
        </div>
        <PasswordField
          id="password"
          name="password"
          required
          autoComplete="current-password"
          className="w-full rounded-2xl border border-hairline px-3 py-2.5 text-sm text-ink outline-none transition focus:border-ink"
          placeholder="••••••••"
        />
      </div>

      {state?.error ? (
        <div className="rounded-2xl border border-error/20 bg-error/5 px-3 py-2 text-sm text-error">{state.error}</div>
      ) : null}

      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-2xl bg-primary px-4 py-2.5 text-sm font-bold text-white transition hover:bg-primary-pressed disabled:cursor-not-allowed disabled:opacity-70"
      >
        {pending ? "Signing in..." : "Sign in"}
      </button>
    </form>
  );
}

export default function LoginPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-surface-soft p-6">
      <div className="w-full max-w-md rounded-[32px] border border-hairline bg-canvas p-8 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">Private access</p>
        <h1 className="mt-3 text-3xl font-bold text-ink">Chamkani Hall Login</h1>
        <p className="mt-2 text-sm text-mute">Accounts are created by your admin — there is no self sign-up.</p>

        <Suspense fallback={null}>
          <LoginForm />
        </Suspense>
      </div>
    </main>
  );
}
