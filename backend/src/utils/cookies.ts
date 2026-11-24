import { Response } from "express";
import { env } from "../config/env.js";

const isProduction = env.NODE_ENV === "production";

export function setAuthCookies(
  res: Response,
  accessToken: string,
  refreshToken?: string
): void {
  // Access Token Cookie (15 minutes)
  res.cookie("auth_token", accessToken, {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? "none" : "lax",
    domain: env.COOKIE_DOMAIN || undefined,
    path: "/",
    maxAge: 15 * 60 * 1000,
  });

  if (refreshToken) {
    // Refresh Token Cookie (7 days)
    res.cookie("refresh_token", refreshToken, {
      httpOnly: true,
      secure: isProduction,
      sameSite: isProduction ? "none" : "lax",
      domain: env.COOKIE_DOMAIN || undefined,
      path: "/",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });
  }
}

export function clearAuthCookies(res: Response): void {
  res.clearCookie("auth_token", {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? "none" : "lax",
    domain: env.COOKIE_DOMAIN || undefined,
    path: "/",
  });

  res.clearCookie("refresh_token", {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? "none" : "lax",
    domain: env.COOKIE_DOMAIN || undefined,
    path: "/",
  });
}
