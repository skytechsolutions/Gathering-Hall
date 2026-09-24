"use client";

import { useActionState, useState } from "react";
import { resetStaffPasswordAction, type ResetPasswordState } from "@/lib/admin/actions";
import { PasswordField } from "@/components/password-field";

export function ResetPasswordButton({ userId }: { userId: string }) {
  const [open, setOpen] = useState(false);
  const boundAction = resetStaffPasswordAction.bind(null, userId);
  const [state, formAction, pending] = useActionState<ResetPasswordState, FormData>(boundAction, null);

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="rounded-lg border border-hairline px-2 py-1 text-xs font-medium text-body hover:bg-surface-card"
      >
        Reset Password
      </button>
    );
  }

  return (
    <form action={formAction} className="flex flex-col gap-1">
      <PasswordField
        name="password"
        required
        minLength={8}
        placeholder="New password"
        autoComplete="new-password"
        className="w-36 rounded-lg border border-hairline px-2 py-1 text-xs outline-none focus:border-ink"
      />
      <PasswordField
        name="confirmPassword"
        required
        minLength={8}
        placeholder="Confirm password"
        autoComplete="new-password"
        className="w-36 rounded-lg border border-hairline px-2 py-1 text-xs outline-none focus:border-ink"
      />
      <button
        type="submit"
        disabled={pending}
        className="w-36 rounded-lg bg-primary px-2 py-1 text-xs font-bold text-white disabled:opacity-60"
      >
        {pending ? "Setting..." : "Set Password"}
      </button>
      {state && "success" in state ? <p className="text-xs text-success-deep">Password updated.</p> : null}
      {state && "error" in state ? <p className="text-xs text-error">{state.error}</p> : null}
    </form>
  );
}
