import { AccessResult, BookingStatus, validateBookingAccess } from "@/lib/auth/permissions";

export type BookingMutationInput = {
  userRole?: "ADMIN" | "STAFF" | null;
  existingStatus?: BookingStatus;
};

export function enforceBookingMutation(action: "create" | "update" | "delete" | "cancel" | "confirm" | "reject", input: BookingMutationInput): AccessResult {
  const result = validateBookingAccess(action, input.userRole, input.existingStatus);

  if (!result.ok) {
    return result;
  }

  if (action === "create" && input.userRole === "STAFF") {
    return { ok: true };
  }

  if (action === "update" && input.userRole === "STAFF") {
    return {
      ok: false,
      code: "STAFF_EDIT_FORBIDDEN",
      message: "Staff cannot edit existing saved records.",
    };
  }

  return { ok: true };
}
