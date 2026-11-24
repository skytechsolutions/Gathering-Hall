import { PrismaClient, Role, OwnerStatus } from "@prisma/client";
import bcrypt from "bcryptjs";
import { config } from "dotenv";
import path from "node:path";
import fs from "node:fs";

// Load environment variables (.env.local or .env)
const envCandidates = [
  path.resolve(process.cwd(), "backend/.env.local"),
  path.resolve(process.cwd(), ".env.local"),
  path.resolve(process.cwd(), "backend/.env"),
  path.resolve(process.cwd(), ".env"),
];

for (const envPath of envCandidates) {
  if (fs.existsSync(envPath)) {
    config({ path: envPath });
    break;
  }
}

const prisma = new PrismaClient();

async function initDb() {
  console.log("=== Initializing Gathering Hall Database & Constraints ===");

  try {
    // 1. Create PostgreSQL Partial Unique Index for Double-Booking Protection
    // Active statuses: HOLD, CONFIRMED, BLOCKED. Cancelled or Expired bookings do not block re-booking.
    console.log("[1] Applying double-booking active slot partial index...");
    await prisma.$executeRawUnsafe(`
      CREATE UNIQUE INDEX IF NOT EXISTS uq_hall_active_booking
      ON bookings ("hallId", "eventDate")
      WHERE status IN ('HOLD', 'CONFIRMED', 'BLOCKED');
    `);
    console.log("✓ Partial unique index 'uq_hall_active_booking' applied.");

    // 2. Ensure Global Commission Setting Exists
    console.log("[2] Ensuring global commission setting...");
    const existingCommission = await prisma.commissionSetting.findFirst();
    if (!existingCommission) {
      await prisma.commissionSetting.create({
        data: {
          rate: 5.0, // Default 5%
        },
      });
      console.log("✓ Default global commission set to 5.00%");
    } else {
      console.log(`✓ Global commission already configured: ${existingCommission.rate}%`);
    }

    // 3. Seed Default Super Admin Account
    console.log("[3] Checking Super Admin account...");
    const adminEmail = process.env.ADMIN_EMAIL || "admin@chamkani.com";
    const adminPassword = process.env.ADMIN_PASSWORD || "samij7141";
    const adminName = process.env.ADMIN_NAME || "Super Administrator";

    const existingAdmin = await prisma.user.findFirst({
      where: { role: Role.SUPER_ADMIN },
    });

    if (!existingAdmin) {
      const hashedPassword = await bcrypt.hash(adminPassword, 12);
      const newAdmin = await prisma.user.create({
        data: {
          name: adminName,
          email: adminEmail.toLowerCase().trim(),
          password: hashedPassword,
          role: Role.SUPER_ADMIN,
          status: OwnerStatus.APPROVED,
          phone: "+92 300 0000000",
        },
      });
      console.log(`✓ Super Admin created successfully: ${newAdmin.email}`);
    } else {
      console.log(`✓ Super Admin account already exists: ${existingAdmin.email}`);
    }

    console.log("\n=======================================================");
    console.log("DATABASE INITIALIZATION & SEEDING COMPLETED SUCCESSFULLY!");
    console.log("=======================================================");
  } catch (error) {
    console.error("Initialization error:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

initDb();
