import helmet from "helmet";
import { env } from "./env.js";

export const helmetConfig = helmet({
  contentSecurityPolicy: env.NODE_ENV === "production",
  crossOriginEmbedderPolicy: env.NODE_ENV === "production",
  crossOriginResourcePolicy: { policy: "cross-origin" },
});
