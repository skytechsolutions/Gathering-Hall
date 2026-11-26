import { config } from "dotenv";
import path from "node:path";
import fs from "node:fs";
import { z } from "zod";

// Load environment variables (.env.local or .env)
const envCandidates = [
  path.resolve(process.cwd(), ".env.local"),
  path.resolve(process.cwd(), ".env"),
  path.resolve(__dirname, "../../.env.local"),
  path.resolve(__dirname, "../../.env"),
  path.resolve(__dirname, "../../../.env.local"),
  path.resolve(__dirname, "../../../.env"),
];

for (const envPath of envCandidates) {
  if (fs.existsSync(envPath)) {
    config({ path: envPath });
    break;
  }
}

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  PORT: z.coerce.number().default(5000),
  DATABASE_URL: z.string().default(
    "postgresql://postgres:samij7141@localhost:5432/Chamkani%20Gathering%20Hall?schema=public"
  ),
  JWT_SECRET: z.string().min(32).default(
    "e5705b94256b575c05787cc855c90a86f6359e7ef5a588f146168c5732552708fa317f1dbcb5a367c0e67c021d4a4462"
  ),
  JWT_REFRESH_SECRET: z.string().min(32).default(
    "41f5c4735129a2d518e1dedd8719dbe478b2cd57f443eea4fc503536bbfc0b08150ca22a40e48aae0cf6d5e293be4d8f"
  ),
  FRONTEND_URL: z.string().default("http://localhost:3000"),
  BACKEND_URL: z.string().default("http://localhost:5000"),
  CORS_ORIGINS: z.string().default("http://localhost:3000,http://localhost:5173"),
  COOKIE_DOMAIN: z.string().optional().default(""),
  CLOUDINARY_CLOUD_NAME: z.string().optional().default(""),
  CLOUDINARY_API_KEY: z.string().optional().default(""),
  CLOUDINARY_API_SECRET: z.string().optional().default(""),
});

export const env = envSchema.parse(process.env);
