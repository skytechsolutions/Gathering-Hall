import { PrismaClient, Role, OwnerStatus } from "@prisma/client";
import bcrypt from "bcryptjs";
import { config } from "dotenv";
import fs from "node:fs";
import path from "node:path";

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

function parseArgs() {
  const args = process.argv.slice(2);
  const result: Record<string, string> = {};
  for (let i = 0; i < args.length; i += 1) {
    if (args[i].startsWith("--")) {
      const key = args[i].slice(2);
      result[key] = args[i + 1];
      i += 1;
    }
  }
  return result;
}

async function main() {
  const prisma = new PrismaClient();
  const args = parseArgs();
  const email = (args.email || process.env.ADMIN_EMAIL || "admin@chamkani.com").toLowerCase().trim();
  const password = args.password || process.env.ADMIN_PASSWORD || "samij7141";
  const name = args.name || process.env.ADMIN_NAME || "Super Administrator";
  const phone = args.phone || "+92 300 0000000";

  console.log(`\nProvisioning Super Admin account: ${email}`);

  try {
    const existing = await prisma.user.findUnique({
      where: { email },
    });

    const hashedPassword = await bcrypt.hash(password, 12);

    if (existing) {
      await prisma.user.update({
        where: { id: existing.id },
        data: {
          name,
          password: hashedPassword,
          role: Role.SUPER_ADMIN,
          status: OwnerStatus.APPROVED,
        },
      });
      console.log(`✓ Super Admin credentials updated successfully: ${email}`);
    } else {
      await prisma.user.create({
        data: {
          name,
          email,
          phone,
          password: hashedPassword,
          role: Role.SUPER_ADMIN,
          status: OwnerStatus.APPROVED,
        },
      });
      console.log(`✓ Super Admin created successfully: ${email}`);
    }
  } catch (err) {
    console.error("Error creating Super Admin:", err);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
