import { describe, expect, it } from "vitest";
import { enforceBookingMutation } from "@/lib/booking/booking-rules";

describe("enforceBookingMutation", () => {
  it("lets a staff member create a Hold booking", () => {
    expect(enforceBookingMutation("create", { userRole: "STAFF" })).toEqual({ ok: true });
  });

  it("blocks a staff member from updating any existing booking", () => {
    expect(enforceBookingMutation("update", { userRole: "STAFF", existingStatus: "HOLD" })).toEqual({
      ok: false,
      code: "STAFF_EDIT_FORBIDDEN",
      message: "Staff cannot edit existing saved records.",
    });
  });

  it("blocks a staff member from deleting, cancelling, confirming, or rejecting", () => {
    expect(enforceBookingMutation("delete", { userRole: "STAFF" }).ok).toBe(false);
    expect(enforceBookingMutation("cancel", { userRole: "STAFF" }).ok).toBe(false);
    expect(enforceBookingMutation("confirm", { userRole: "STAFF" }).ok).toBe(false);
    expect(enforceBookingMutation("reject", { userRole: "STAFF" }).ok).toBe(false);
  });

  it("lets admin perform every mutation", () => {
    expect(enforceBookingMutation("update", { userRole: "ADMIN", existingStatus: "CONFIRMED" }).ok).toBe(true);
    expect(enforceBookingMutation("delete", { userRole: "ADMIN" }).ok).toBe(true);
    expect(enforceBookingMutation("cancel", { userRole: "ADMIN" }).ok).toBe(true);
    expect(enforceBookingMutation("confirm", { userRole: "ADMIN" }).ok).toBe(true);
    expect(enforceBookingMutation("reject", { userRole: "ADMIN" }).ok).toBe(true);
  });

  it("requires authentication", () => {
    expect(enforceBookingMutation("create", { userRole: null }).ok).toBe(false);
  });
});
