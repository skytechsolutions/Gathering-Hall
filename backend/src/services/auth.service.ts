import { prisma } from "../config/prisma.js";
import { hashPassword, comparePassword } from "../utils/password.js";
import { signAccessToken, signRefreshToken, verifyRefreshToken } from "../utils/jwt.js";
import { Role, OwnerStatus } from "@prisma/client";
import { UserDTO, AuthPayload } from "../types/user.types.js";

export class AuthService {
  async register(data: {
    name: string;
    email: string;
    phone: string;
    password: string;
  }): Promise<{ user: UserDTO; message: string }> {
    const existing = await prisma.user.findFirst({
      where: {
        OR: [{ email: data.email.toLowerCase().trim() }, { phone: data.phone.trim() }],
      },
    });

    if (existing) {
      if (existing.email.toLowerCase() === data.email.toLowerCase()) {
        throw new Error("An account with this email address already exists.");
      }
      throw new Error("An account with this phone number already exists.");
    }

    const hashedPassword = await hashPassword(data.password);

    const user = await prisma.user.create({
      data: {
        name: data.name.trim(),
        email: data.email.toLowerCase().trim(),
        phone: data.phone.trim(),
        password: hashedPassword,
        role: Role.HALL_OWNER,
        status: OwnerStatus.PENDING,
      },
    });

    await prisma.auditLog.create({
      data: {
        userId: user.id,
        action: "OWNER_REGISTERED",
        details: { email: user.email, name: user.name, status: user.status },
      },
    });

    const userDto: UserDTO = {
      id: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      role: user.role,
      status: user.status,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };

    return {
      user: userDto,
      message:
        "Registration successful. Your account is currently PENDING approval by the Super Admin. You will be able to access the dashboard once approved.",
    };
  }

  async login(
    email: string,
    rawPassword: string,
    ipAddress?: string
  ): Promise<{
    user: UserDTO;
    accessToken: string;
    refreshToken: string;
  }> {
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
    });

    if (!user) {
      throw new Error("Invalid email or password.");
    }

    const isMatch = await comparePassword(rawPassword, user.password);
    if (!isMatch) {
      throw new Error("Invalid email or password.");
    }

    // Role & Status Checks
    if (user.role === Role.HALL_OWNER) {
      if (user.status === OwnerStatus.PENDING) {
        throw new Error("Your account is currently PENDING Super Admin approval. Please contact support.");
      }
      if (user.status === OwnerStatus.BLOCKED) {
        throw new Error("Your account has been BLOCKED by the Super Admin. Access denied.");
      }
      if (user.status === OwnerStatus.REJECTED) {
        throw new Error("Your registration request was REJECTED by the Super Admin.");
      }
    }

    const authPayload: AuthPayload = {
      userId: user.id,
      email: user.email,
      role: user.role,
      name: user.name,
      status: user.status,
    };

    const accessToken = signAccessToken(authPayload);
    const refreshToken = signRefreshToken({ userId: user.id });

    // Store refresh token in DB with 7-day expiration
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    await prisma.refreshToken.create({
      data: {
        userId: user.id,
        token: refreshToken,
        expiresAt,
      },
    });

    await prisma.auditLog.create({
      data: {
        userId: user.id,
        action: "USER_LOGIN",
        ipAddress: ipAddress || null,
        details: { role: user.role, email: user.email },
      },
    });

    const userDto: UserDTO = {
      id: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      role: user.role,
      status: user.status,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };

    return { user: userDto, accessToken, refreshToken };
  }

  async refreshToken(oldRefreshToken: string): Promise<{ accessToken: string; refreshToken: string }> {
    let decoded: { userId: string };
    try {
      decoded = verifyRefreshToken(oldRefreshToken);
    } catch {
      throw new Error("Invalid or expired refresh token. Please log in again.");
    }

    const savedToken = await prisma.refreshToken.findUnique({
      where: { token: oldRefreshToken },
      include: { user: true },
    });

    if (!savedToken || savedToken.expiresAt < new Date()) {
      if (savedToken) {
        await prisma.refreshToken.delete({ where: { id: savedToken.id } });
      }
      throw new Error("Refresh token expired or invalid.");
    }

    const user = savedToken.user;
    if (user.role === Role.HALL_OWNER && user.status !== OwnerStatus.APPROVED) {
      throw new Error("Account is no longer active or approved.");
    }

    // Refresh Token Rotation: Delete old, issue new
    await prisma.refreshToken.delete({ where: { id: savedToken.id } });

    const authPayload: AuthPayload = {
      userId: user.id,
      email: user.email,
      role: user.role,
      name: user.name,
      status: user.status,
    };

    const newAccessToken = signAccessToken(authPayload);
    const newRefreshToken = signRefreshToken({ userId: user.id });

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    await prisma.refreshToken.create({
      data: {
        userId: user.id,
        token: newRefreshToken,
        expiresAt,
      },
    });

    return { accessToken: newAccessToken, refreshToken: newRefreshToken };
  }

  async logout(userId: string, refreshToken?: string): Promise<void> {
    if (refreshToken) {
      await prisma.refreshToken.deleteMany({
        where: { token: refreshToken },
      });
    } else {
      await prisma.refreshToken.deleteMany({
        where: { userId },
      });
    }

    await prisma.auditLog.create({
      data: {
        userId,
        action: "USER_LOGOUT",
      },
    });
  }

  async getMe(userId: string): Promise<UserDTO> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });
    if (!user) {
      throw new Error("User not found.");
    }
    return {
      id: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      role: user.role,
      status: user.status,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }
}

export const authService = new AuthService();
