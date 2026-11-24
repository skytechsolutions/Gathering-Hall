import { prisma } from "../src/config/prisma.js";
import { bookingService } from "../src/services/booking.service.js";
import { expireHeldBookings } from "../src/jobs/hold-expiration.job.js";
import { Role, OwnerStatus, BookingStatus } from "@prisma/client";

async function runBookingConcurrencyTests() {
  console.log("=== Running Booking Concurrency & Availability Test Suite ===");

  try {
    // 1. Create a dummy test owner and test hall
    const testOwner = await prisma.user.upsert({
      where: { email: "testowner@chamkani.internal" },
      update: {},
      create: {
        name: "Test Hall Owner",
        email: "testowner@chamkani.internal",
        password: "hashedpassword123",
        role: Role.HALL_OWNER,
        status: OwnerStatus.APPROVED,
        phone: "+92 311 1111111",
      },
    });

    const testHall = await prisma.hall.create({
      data: {
        ownerId: testOwner.id,
        name: `Test Hall ${Date.now()}`,
        city: "Peshawar",
        area: "Chamkani",
        address: "GT Road, Chamkani",
        capacity: 500,
        priceWeekday: 80000,
        priceWeekend: 100000,
        amenities: ["Air Conditioning", "Parking", "Generator"],
        status: "APPROVED",
      },
    });

    const testUser = {
      userId: testOwner.id,
      email: testOwner.email,
      name: testOwner.name,
      role: Role.HALL_OWNER,
      status: OwnerStatus.APPROVED,
    };

    const targetDate = "2027-12-25";

    // Clean any existing bookings for this hall
    await prisma.booking.deleteMany({ where: { hallId: testHall.id } });
    await prisma.blockedDate.deleteMany({ where: { hallId: testHall.id } });

    // Test 1: Concurrency - Two simultaneous booking requests for the same hall & date
    console.log("\n[1] Testing Simultaneous Concurrent Bookings (Only ONE must succeed)...");
    const [req1, req2] = await Promise.allSettled([
      bookingService.createBooking(
        {
          hallId: testHall.id,
          customerName: "Customer Alpha",
          customerPhone: "+92 321 0000001",
          eventDate: targetDate,
          totalAmount: 100000,
          advanceAmount: 20000,
          status: "HOLD",
        },
        testUser
      ),
      bookingService.createBooking(
        {
          hallId: testHall.id,
          customerName: "Customer Beta",
          customerPhone: "+92 321 0000002",
          eventDate: targetDate,
          totalAmount: 100000,
          advanceAmount: 25000,
          status: "HOLD",
        },
        testUser
      ),
    ]);

    const successes = [req1, req2].filter((r) => r.status === "fulfilled");
    const failures = [req1, req2].filter((r) => r.status === "rejected");

    console.log(`Concurrent results: ${successes.length} fulfilled, ${failures.length} rejected.`);
    if (successes.length !== 1 || failures.length !== 1) {
      throw new Error(`Double-booking protection failed: Expected 1 success and 1 rejection, got ${successes.length} successes!`);
    }

    const rejectionReason = (failures[0] as PromiseRejectedResult).reason?.message;
    console.log(`✓ Rejection message: "${rejectionReason}" (Double booking safely prevented).`);

    // Test 2: Duplicate booking on same active slot rejected
    console.log("\n[2] Testing Explicit Duplicate Booking on Active Slot...");
    try {
      await bookingService.createBooking(
        {
          hallId: testHall.id,
          customerName: "Customer Gamma",
          customerPhone: "+92 321 0000003",
          eventDate: targetDate,
          totalAmount: 120000,
          advanceAmount: 30000,
          status: "HOLD",
        },
        testUser
      );
      throw new Error("Duplicate booking should have been rejected!");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      if (!msg.includes("Already Booked")) {
        throw new Error(`Expected 'Already Booked', got: ${msg}`);
      }
      console.log(`✓ Duplicate booking rejected with: "${msg}".`);
    }

    // Test 3: Cancelled date can be re-booked
    console.log("\n[3] Testing Cancellation & Re-booking...");
    const activeBooking = (successes[0] as PromiseFulfilledResult<any>).value;
    await bookingService.cancelBooking(activeBooking.id, testUser, "Client changed mind");
    console.log("✓ Initial booking cancelled.");

    const rebooked = await bookingService.createBooking(
      {
        hallId: testHall.id,
        customerName: "Customer Delta",
        customerPhone: "+92 321 0000004",
        eventDate: targetDate,
        totalAmount: 95000,
        advanceAmount: 20000,
        status: "CONFIRMED",
      },
      testUser
    );
    console.log(`✓ Slot successfully re-booked as CONFIRMED (Booking #${rebooked.bookingNumber}).`);

    // Test 4: Expired Hold Releases Slot
    console.log("\n[4] Testing Automatic Hold Expiration...");
    const holdDate = "2027-12-26";
    const holdBooking = await bookingService.createBooking(
      {
        hallId: testHall.id,
        customerName: "Customer Epsilon",
        customerPhone: "+92 321 0000005",
        eventDate: holdDate,
        totalAmount: 90000,
        advanceAmount: 10000,
        status: "HOLD",
      },
      testUser
    );

    // Manually backdate holdExpiresAt to simulate passage of 24h
    const pastDate = new Date(Date.now() - 3600000); // 1 hour ago
    await prisma.booking.update({
      where: { id: holdBooking.id },
      data: { holdExpiresAt: pastDate },
    });

    const expiredCount = await expireHeldBookings();
    console.log(`✓ Hold expiration job processed: ${expiredCount} expired.`);

    const postExpiryCheck = await prisma.booking.findUnique({
      where: { id: holdBooking.id },
      select: { status: true },
    });
    if (postExpiryCheck?.status !== BookingStatus.EXPIRED) {
      throw new Error(`Expected booking status to be EXPIRED, got ${postExpiryCheck?.status}`);
    }

    // Now re-book the released date
    const rebookedAfterExpiry = await bookingService.createBooking(
      {
        hallId: testHall.id,
        customerName: "Customer Zeta",
        customerPhone: "+92 321 0000006",
        eventDate: holdDate,
        totalAmount: 110000,
        advanceAmount: 30000,
        status: "CONFIRMED",
      },
      testUser
    );
    console.log(`✓ Released date successfully re-booked after expiration (#${rebookedAfterExpiry.bookingNumber}).`);

    // Test 5: Blocked Date prevents normal booking
    console.log("\n[5] Testing Blocked Date Protection...");
    const blockedDate = "2027-12-27";
    await bookingService.blockDate(
      { hallId: testHall.id, date: blockedDate, reason: "Hall Renovation" },
      testUser
    );
    console.log(`✓ Date ${blockedDate} blocked for renovation.`);

    try {
      await bookingService.createBooking(
        {
          hallId: testHall.id,
          customerName: "Customer Eta",
          customerPhone: "+92 321 0000007",
          eventDate: blockedDate,
          totalAmount: 100000,
          advanceAmount: 20000,
          status: "HOLD",
        },
        testUser
      );
      throw new Error("Booking creation should have failed on blocked date!");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      if (!msg.includes("Already Booked")) {
        throw new Error(`Expected 'Already Booked', got: ${msg}`);
      }
      console.log(`✓ Normal booking properly prevented on blocked date: "${msg}".`);
    }

    // Clean up test data
    await prisma.bookingHistory.deleteMany({ where: { booking: { hallId: testHall.id } } });
    await prisma.payment.deleteMany({ where: { booking: { hallId: testHall.id } } });
    await prisma.booking.deleteMany({ where: { hallId: testHall.id } });
    await prisma.blockedDate.deleteMany({ where: { hallId: testHall.id } });
    await prisma.hall.delete({ where: { id: testHall.id } });

    console.log("\n=======================================================");
    console.log("ALL 5 CONCURRENCY & DOUBLE-BOOKING TESTS PASSED! ✓");
    console.log("=======================================================");
  } catch (err) {
    console.error("Test failed:", err);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

runBookingConcurrencyTests();
