import express, { Express, Request, Response } from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import { helmetConfig } from "./config/security.js";
import { corsOptions } from "./config/cors.js";
import { apiRateLimiter } from "./middlewares/rateLimit.middleware.js";
import { errorHandler } from "./middlewares/error.middleware.js";
import apiRoutes from "./routes/index.js";
import { apiError } from "./utils/apiResponse.js";

const app: Express = express();

// Security Headers
app.use(helmetConfig);

// CORS
app.use(cors(corsOptions));

// Body & Cookie Parsers
app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true, limit: "1mb" }));
app.use(cookieParser());

// Global API Rate Limiter
app.use("/api", apiRateLimiter);

// Mount API Routes
app.use("/api", apiRoutes);

// Root Index
app.get("/", (_req: Request, res: Response) => {
  res.json({
    name: "Chamkani Gathering Hall API",
    version: "1.0.0",
    status: "running",
    docs: "/api/health",
  });
});

// 404 Handler
app.use((_req: Request, res: Response) => {
  apiError(res, "Endpoint not found", 404);
});

// Global Error Handler
app.use(errorHandler);

export default app;
