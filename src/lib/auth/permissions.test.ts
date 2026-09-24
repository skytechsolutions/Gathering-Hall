import { describe, expect, it } from "vitest";
import {
  canCreateBooking,
  canEditBooking,
  canDeleteBooking,
  canConfirmBooking,
  canCancelBooking,
  canRejectBooking,
  canManageStaff,
  canViewReports,
  validateBookingAccess,
} from "@/lib/auth/permissions";

describe("role access control", () => {
  it("allows staff to create bookings", () => {
    expect(canCreateBooking("STAFF")).toBe(true);
  });

  it("blocks staff from editing existing records", () => {
    expect(canEditBooking("STAFF")).toBe(false);
    expect(validateBookingAccess("update", "STAFF")).toEqual({
      ok: false,
      code: "STAFF_EDIT_FORBIDDEN",
      message: "Staff cannot edit existing saved records.",
    });
  });

  it("blocks staff from deleting and canceling bookings", () => {
    expect(canDeleteBooking("STAFF")).toBe(false);
    expect(canCancelBooking("STAFF")).toBe(false);
  });

  it("allows admin full booking operations", () => {
    expect(canCreateBooking("ADMIN")).toBe(true);
    expect(canEditBooking("ADMIN")).toBe(true);
    expect(canDeleteBooking("ADMIN")).toBe(true);
    expect(canConfirmBooking("ADMIN")).toBe(true);
    expect(canCancelBooking("ADMIN")).toBe(true);
    expect(canManageStaff("ADMIN")).toBe(true);
    expect(canViewReports("ADMIN")).toBe(true);
  });

  it("blocks staff from confirmed booking modification", () => {
    expect(
      validateBookingAccess("update", "STAFF", "CONFIRMED"),
    ).toEqual({
      ok: false,
      code: "CONFIRMED_BOOKING_LOCKED",
      message: "Confirmed bookings cannot be modified by staff.",
    });
  });

  it("blocks staff from their own saved Hold booking too", () => {
    // Staff cannot edit ANY saved record, including ones they created.
    expect(validateBookingAccess("update", "STAFF", "HOLD")).toEqual({
      ok: false,
      code: "STAFF_EDIT_FORBIDDEN",
      message: "Staff cannot edit existing saved records.",
    });
  });

  it("only admin can confirm or reject a booking", () => {
    expect(canConfirmBooking("STAFF")).toBe(false);
    expect(canRejectBooking("STAFF")).toBe(false);
    expect(canConfirmBooking("ADMIN")).toBe(true);
    expect(canRejectBooking("ADMIN")).toBe(true);

    expect(validateBookingAccess("confirm", "STAFF")).toEqual({
      ok: false,
      code: "FORBIDDEN",
      message: "Only admin can confirm bookings.",
    });
    expect(validateBookingAccess("reject", "STAFF")).toEqual({
      ok: false,
      code: "FORBIDDEN",
      message: "Only admin can reject bookings.",
    });
  });

  it("requires authentication for any action", () => {
    expect(validateBookingAccess("create", null)).toEqual({
      ok: false,
      code: "AUTH_REQUIRED",
      message: "Authentication required.",
    });
  });
});
