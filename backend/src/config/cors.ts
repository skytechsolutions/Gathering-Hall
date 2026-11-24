import { CorsOptions } from "cors";
import { env } from "./env.js";

const allowedOrigins = env.CORS_ORIGINS.split(",").map((o) => o.trim());

export const corsOptions: CorsOptions = {
  origin: (origin, callback) => {
    // Allow server-to-server or tools without origin (e.g. mobile apps, curl, Next.js server actions)
    if (!origin) {
      return callback(null, true);
    }
    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    return callback(new Error(`Origin ${origin} not allowed by CORS`));
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
};
