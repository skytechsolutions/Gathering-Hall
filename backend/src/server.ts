import app from "./app.js";
import { env } from "./config/env.js";
import { prisma } from "./config/prisma.js";
import { startHoldExpirationScheduler } from "./jobs/hold-expiration.job.js";

const PORT = env.PORT;

async function bootstrap() {
  console.log("\n==================================================");
  console.log(" Chamkani Gathering Hall — Backend Server");
  console.log("==================================================");

  // Check Prisma database connectivity
  try {
    await prisma.$queryRaw`SELECT 1`;
    console.log("✓ PostgreSQL Database (Prisma): Connected");
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.warn(`⚠ PostgreSQL Database: Not reachable (${msg})`);
    console.warn("  Ensure PostgreSQL is running on port 5432.");
  }

  // Start background job scheduler for automatic hold expiration
  startHoldExpirationScheduler();

  const server = app.listen(PORT, () => {
    console.log(`✓ Server running: http://localhost:${PORT}`);
    console.log(`✓ Health endpoint: http://localhost:${PORT}/api/health`);
    console.log(`✓ Allowed origins: ${env.CORS_ORIGINS}`);
    console.log(`✓ Environment: ${env.NODE_ENV}\n`);
  });

  // Graceful Shutdown
  const shutdown = async (signal: string) => {
    console.log(`\nReceived ${signal}. Shutting down gracefully...`);
    server.close(async () => {
      console.log("HTTP server closed.");
      await prisma.$disconnect();
      console.log("Prisma disconnected. Exit complete.");
      process.exit(0);
    });

    setTimeout(() => {
      console.error("Forcing shutdown after timeout.");
      process.exit(1);
    }, 10000);
  };

  process.on("SIGTERM", () => shutdown("SIGTERM"));
  process.on("SIGINT", () => shutdown("SIGINT"));
}

bootstrap().catch((err) => {
  console.error("Fatal error during server startup:", err);
  process.exit(1);
});
