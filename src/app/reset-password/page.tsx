"use client";

import { useActionState } from "react";
import { useRouter } from "next/navigation";
import { updatePasswordAction, type UpdatePasswordState } from "@/lib/auth/actions";
import { PasswordField } from "@/components/password-field";

export default function ResetPasswordPage() {
  const router = useRouter();

  async function action(_prevState: UpdatePasswordState, formData: FormData): Promise<UpdatePasswordState> {
    const result = await updatePasswordAction(_prevState, formData);
    if (result && "success" in result) {
      router.push("/dashboard");
      router.refresh();
    }
    return result;
  }

  const [state, formAction, pending] = useActionState<UpdatePasswordState, FormData>(action, null);

  return (
    <main className="flex min-h-screen items-center justify-center bg-surface-soft p-6">
      <div className="w-full max-w-md rounded-[32px] border border-hairline bg-canvas p-8 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">Reset password</p>
        <h1 className="mt-3 text-2xl font-bold text-ink">Set a new password</h1>

        <form action={formAction} className="mt-6 space-y-4">
          <div>
            <label className="mb-1 block text-sm font-semibold text-body" htmlFor="password">New Password</label>
            <PasswordField
              id="password"
              name="password"
              required
              minLength={8}
              autoComplete="new-password"
              placeholder="At least 8 characters, letters + numbers"
              className="w-full rounded-2xl border border-hairline px-3 py-2.5 text-sm text-ink outline-none transition focus:border-ink"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-semibold text-body" htmlFor="confirmPassword">Confirm Password</label>
            <PasswordField
              id="confirmPassword"
              name="confirmPassword"
              required
              minLength={8}
              autoComplete="new-password"
              className="w-full rounded-2xl border border-hairline px-3 py-2.5 text-sm text-ink outline-none transition focus:border-ink"
            />
          </div>

          {state && "error" in state ? (
            <div className="rounded-2xl border border-error/20 bg-error/5 px-3 py-2 text-sm text-error">{state.error}</div>
          ) : null}

          <button
            type="submit"
            disabled={pending}
            className="w-full rounded-2xl bg-primary px-4 py-2.5 text-sm font-bold text-white transition hover:bg-primary-pressed disabled:cursor-not-allowed disabled:opacity-70"
          >
            {pending ? "Saving..." : "Set new password"}
          </button>
        </form>
      </div>
    </main>
  );
}
