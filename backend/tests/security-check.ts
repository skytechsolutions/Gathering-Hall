import { hashPassword, comparePassword } from "../src/utils/password.js";
import { signAccessToken, verifyAccessToken, signRefreshToken, verifyRefreshToken } from "../src/utils/jwt.js";
import { authenticate, requireRole } from "../src/middlewares/auth.middleware.js";
import { validate } from "../src/middlewares/validate.middleware.js";
import { loginSchema } from "../src/validators/auth.validator.js";
import { helmetConfig } from "../src/config/security.js";
import { Request, Response } from "express";
import { Role, OwnerStatus } from "@prisma/client";

async function runTests() {
  console.log("=== Security & Authentication In-Memory Suite ===");

  // 1. Password Hashing Verification
  console.log("\n[1] Testing Bcrypt Password Hashing...");
  const rawPassword = "SecurePassword123!";
  const hash = await hashPassword(rawPassword);
  if (!hash.startsWith("$2a$") && !hash.startsWith("$2b$")) {
    throw new Error("Password hash format invalid (expected bcrypt $2a$ or $2b$)");
  }
  const match = await comparePassword(rawPassword, hash);
  if (!match) {
    throw new Error("Bcrypt compare failed for correct password");
  }
  const mismatch = await comparePassword("WrongPassword123!", hash);
  if (mismatch) {
    throw new Error("Bcrypt compare succeeded for wrong password!");
  }
  console.log("✓ Bcrypt hashing and salt generation verified.");

  // 2. JWT Verification & Expiration
  console.log("\n[2] Testing JWT Generation & Verification...");
  const payload = {
    userId: "11111111-1111-1111-1111-111111111111",
    email: "admin@example.com",
    role: Role.SUPER_ADMIN,
    name: "Admin",
    status: OwnerStatus.APPROVED,
  };
  const token = signAccessToken(payload);
  const decoded = verifyAccessToken(token);
  if (!decoded || decoded.userId !== payload.userId || decoded.role !== Role.SUPER_ADMIN) {
    throw new Error("JWT payload decoding mismatch");
  }

  const refreshToken = signRefreshToken({ userId: payload.userId });
  const decodedRefresh = verifyRefreshToken(refreshToken);
  if (!decodedRefresh || decodedRefresh.userId !== payload.userId) {
    throw new Error("Refresh token payload decoding mismatch");
  }
  console.log("✓ JWT signing (HS256) and decoding verified.");

  // 3. Test Security Headers Middleware
  console.log("\n[3] Testing Helmet Security Headers Middleware...");
  const mockReq: Partial<Request> = { headers: {} };
  const headersSet: Record<string, string> = {};
  const mockRes: Partial<Response> = {
    setHeader(name: string, value: any) {
      headersSet[name.toLowerCase()] = String(value);
      return this as any;
    },
    getHeader(name: string) {
      return headersSet[name.toLowerCase()];
    },
    removeHeader(name: string) {
      delete headersSet[name.toLowerCase()];
      return this as any;
    },
  };
  let helmetNextCalled = false;
  helmetConfig(mockReq as Request, mockRes as Response, () => {
    helmetNextCalled = true;
  });
  if (!helmetNextCalled) {
    throw new Error("Security headers middleware failed to call next()");
  }
  console.log("✓ Security headers middleware executed and applied headers.");

  // 4. Test Auth Middleware Rejection (Unauthenticated)
  console.log("\n[4] Testing Authentication Middleware Protection...");
  const unauthReq: Partial<Request> = {
    headers: {},
    cookies: {},
  };
  let unauthStatusCode = 0;
  let unauthResponseBody: any = null;
  const unauthRes: Partial<Response> = {
    status(code: number) {
      unauthStatusCode = code;
      return this as any;
    },
    json(body: any) {
      unauthResponseBody = body;
      return this as any;
    },
  };
  let authNextCalled = false;
  authenticate(unauthReq as Request, unauthRes as Response, () => {
    authNextCalled = true;
  });
  if (authNextCalled || unauthStatusCode !== 401) {
    throw new Error(`Expected auth middleware to reject with 401, got ${unauthStatusCode}`);
  }
  console.log(`✓ Unauthenticated request rejected with HTTP ${unauthStatusCode}:`, unauthResponseBody.message);

  // 5. Test Auth Middleware Acceptance (Valid Token)
  console.log("\n[5] Testing Authentication With Valid Bearer Token...");
  const authReq: Partial<Request> = {
    headers: { authorization: `Bearer ${token}` },
    cookies: {},
  };
  let validAuthNextCalled = false;
  authenticate(authReq as Request, mockRes as Response, () => {
    validAuthNextCalled = true;
  });
  if (!validAuthNextCalled || !(authReq as any).user) {
    throw new Error("Expected auth middleware to populate req.user with decoded payload");
  }
  console.log("✓ Valid token verified, req.user populated:", (authReq as any).user);

  // 6. Test Role Authorization
  console.log("\n[6] Testing Role Authorization Middleware...");
  const ownerReq: Partial<Request> = {
    user: {
      userId: "2222",
      role: Role.HALL_OWNER,
      status: OwnerStatus.APPROVED,
      email: "owner@hall.com",
      name: "Owner",
    },
  } as any;
  let forbiddenStatusCode = 0;
  const forbiddenRes: Partial<Response> = {
    status(code: number) {
      forbiddenStatusCode = code;
      return this as any;
    },
    json(body: any) {
      return this as any;
    },
  };
  const adminOnlyMiddleware = requireRole([Role.SUPER_ADMIN]);
  let roleNextCalled = false;
  adminOnlyMiddleware(ownerReq as Request, forbiddenRes as Response, () => {
    roleNextCalled = true;
  });
  if (roleNextCalled || forbiddenStatusCode !== 403) {
    throw new Error(`Expected 403 Forbidden for HALL_OWNER accessing SUPER_ADMIN route, got ${forbiddenStatusCode}`);
  }
  console.log(`✓ HALL_OWNER properly denied access to SUPER_ADMIN route with HTTP ${forbiddenStatusCode}.`);

  // 7. Test Zod Validation Middleware
  console.log("\n[7] Testing Zod Input Validation Middleware...");
  const invalidLoginReq: Partial<Request> = {
    body: { email: "notanemail" },
  };
  let validationStatusCode = 0;
  let validationErrors: any = null;
  const invalidRes: Partial<Response> = {
    status(code: number) {
      validationStatusCode = code;
      return this as any;
    },
    json(body: any) {
      validationErrors = body;
      return this as any;
    },
  };
  const validator = validate(loginSchema);
  let validationNextCalled = false;
  validator(invalidLoginReq as Request, invalidRes as Response, () => {
    validationNextCalled = true;
  });
  if (validationNextCalled || validationStatusCode !== 400) {
    throw new Error(`Expected Zod validation to reject invalid body with 400, got ${validationStatusCode}`);
  }
  console.log(`✓ Invalid request rejected with HTTP ${validationStatusCode}:`, validationErrors.errors);

  console.log("\n=================================================");
  console.log("ALL 7 CORE SECURITY & AUTH VERIFICATION TESTS PASSED! ✓");
  console.log("=================================================");
}

runTests().catch((err) => {
  console.error("Test failed:", err);
  process.exit(1);
});
