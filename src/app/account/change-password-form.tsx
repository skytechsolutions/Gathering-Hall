"use client";

import { useActionState, useEffect, useRef } from "react";
import { changeOwnPasswordAction, type ChangePasswordState } from "@/lib/auth/actions";
import { PasswordField } from "@/components/password-field";

const inputClass = "w-full rounded-2xl border border-hairline px-3 py-2.5 text-sm text-ink outline-none transition focus:border-ink";
const labelClass = "mb-1 block text-sm font-semibold text-body";

export function ChangePasswordForm() {
  const formRef = useRef<HTMLFormElement>(null);
  const [state, formAction, pending] = useActionState<ChangePasswordState, FormData>(changeOwnPasswordAction, null);

  useEffect(() => {
    if (state && "success" in state) {
      formRef.current?.reset();
    }
  }, [state]);

  return (
    <div className="rounded-[32px] border border-hairline bg-canvas p-6 shadow-sm">
      <h2 className="text-lg font-bold text-ink">Change Password</h2>
      <form ref={formRef} action={formAction} className="mt-4 space-y-4">
        <div>
          <label className={labelClass} htmlFor="oldPassword">Current Password</label>
          <PasswordField id="oldPassword" name="oldPassword" required autoComplete="current-password" className={inputClass} />
        </div>
        <div>
          <label className={labelClass} htmlFor="newPassword">New Password</label>
          <PasswordField id="newPassword" name="newPassword" required minLength={8} autoComplete="new-password" placeholder="At least 8 characters, letters + numbers" className={inputClass} />
        </div>
        <div>
          <label className={labelClass} htmlFor="confirmPassword">Confirm New Password</label>
          <PasswordField id="confirmPassword" name="confirmPassword" required minLength={8} autoComplete="new-password" className={inputClass} />
        </div>

        {state && "error" in state ? (
          <div className="rounded-2xl border border-error/20 bg-error/5 px-3 py-2 text-sm text-error">{state.error}</div>
        ) : null}
        {state && "success" in state ? (
          <div className="rounded-2xl border border-success-deep/20 bg-success-pale px-3 py-2 text-sm text-success-deep">Password updated.</div>
        ) : null}

        <button
          type="submit"
          disabled={pending}
          className="rounded-2xl bg-primary px-5 py-2.5 text-sm font-bold text-white transition hover:bg-primary-pressed disabled:cursor-not-allowed disabled:opacity-70"
        >
          {pending ? "Saving..." : "Update Password"}
        </button>
      </form>
    </div>
  );
}
