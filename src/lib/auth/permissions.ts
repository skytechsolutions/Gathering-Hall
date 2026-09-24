export type AppRole = "ADMIN" | "STAFF";

export type BookingStatus =
  | "HOLD"
  | "CONFIRMED"
  | "COMPLETED"
  | "CANCELLED"
  | "REJECTED";

export type CurrentUser = {
  id: string;
  email: string;
  username: string | null;
  fullName: string;
  role: AppRole;
};

export type AccessResult = { ok: true } | { ok: false; code: string; message: string };

export function isAdmin(role?: AppRole | null): boolean {
  return role === "ADMIN";
}

export function isStaff(role?: AppRole | null): boolean {
  return role === "STAFF";
}

export function canCreateBooking(role?: AppRole | null): boolean {
  return role === "ADMIN" || role === "STAFF";
}

export function canCreateHoldBooking(role?: AppRole | null): boolean {
  return canCreateBooking(role);
}

export function canViewAllBookings(role?: AppRole | null): boolean {
  return role === "ADMIN" || role === "STAFF";
}

export function canEditBooking(role?: AppRole | null): boolean {
  return role === "ADMIN";
}

export function canDeleteBooking(role?: AppRole | null): boolean {
  return role === "ADMIN";
}

export function canCancelBooking(role?: AppRole | null): boolean {
  return role === "ADMIN";
}

export function canConfirmBooking(role?: AppRole | null): boolean {
  return role === "ADMIN";
}

export function canRejectBooking(role?: AppRole | null): boolean {
  return role === "ADMIN";
}

export function canManageStaff(role?: AppRole | null): boolean {
  return role === "ADMIN";
}

export function canViewReports(role?: AppRole | null): boolean {
  return role === "ADMIN";
}

export function denyStaffEditExistingRecords(): AccessResult {
  return {
    ok: false,
    code: "STAFF_EDIT_FORBIDDEN",
    message: "Staff cannot edit existing saved records.",
  };
}

export function validateBookingAccess(action: "create" | "update" | "delete" | "cancel" | "confirm" | "reject", userRole?: AppRole | null, existingStatus?: BookingStatus): AccessResult {
  if (!userRole) {
    return { ok: false, code: "AUTH_REQUIRED", message: "Authentication required." };
  }

  if (action === "create") {
    return canCreateBooking(userRole)
      ? { ok: true }
      : { ok: false, code: "FORBIDDEN", message: "You do not have permission to create bookings." };
  }

  if (existingStatus === "CONFIRMED" && userRole === "STAFF") {
    return {
      ok: false,
      code: "CONFIRMED_BOOKING_LOCKED",
      message: "Confirmed bookings cannot be modified by staff.",
    };
  }

  if (action === "update") {
    if (userRole === "STAFF") {
      return denyStaffEditExistingRecords();
    }

    if (userRole === "ADMIN") {
      return { ok: true };
    }

    return { ok: false, code: "FORBIDDEN", message: "Access denied." };
  }

  if (action === "delete") {
    return canDeleteBooking(userRole)
      ? { ok: true }
      : { ok: false, code: "FORBIDDEN", message: "Only admin can delete records." };
  }

  if (action === "cancel") {
    return canCancelBooking(userRole)
      ? { ok: true }
      : { ok: false, code: "FORBIDDEN", message: "Only admin can cancel bookings." };
  }

  if (action === "confirm") {
    return canConfirmBooking(userRole)
      ? { ok: true }
      : { ok: false, code: "FORBIDDEN", message: "Only admin can confirm bookings." };
  }

  if (action === "reject") {
    return canRejectBooking(userRole)
      ? { ok: true }
      : { ok: false, code: "FORBIDDEN", message: "Only admin can reject bookings." };
  }

  return { ok: true };
}
