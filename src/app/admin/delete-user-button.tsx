"use client";

import { deleteUserAction } from "@/lib/admin/actions";

export function DeleteUserButton({ userId, label }: { userId: string; label: string }) {
  const boundAction = deleteUserAction.bind(null, userId);

  return (
    <form
      action={boundAction}
      onSubmit={(event) => {
        if (!confirm(`Delete ${label}'s account? This permanently removes their login and cannot be undone.`)) {
          event.preventDefault();
        }
      }}
    >
      <button type="submit" className="rounded-lg border border-error/30 px-2 py-1 text-xs font-medium text-error hover:bg-error/5">
        Delete
      </button>
    </form>
  );
}
