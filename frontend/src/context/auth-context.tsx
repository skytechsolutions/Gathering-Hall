"use client";

import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { authApi, User } from "@/services/api/auth.api";

export interface BrandSettings {
  hallName: string;
  logoUrl: string | null;
}

const DEFAULT_BRAND: BrandSettings = {
  hallName: "Chamkani Hall",
  logoUrl: null,
};

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (credentials: { email: string; password: string }) => Promise<User>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  brandSettings: BrandSettings;
  updateBrandSettings: (settings: Partial<BrandSettings>) => void;
  updateProfile: (data: { name?: string; phone?: string }) => Promise<User>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  const [brandSettings, setBrandSettings] = useState<BrandSettings>(() => {
    if (typeof window !== "undefined") {
      try {
        const stored = localStorage.getItem("owner_brand_settings");
        if (stored) {
          return { ...DEFAULT_BRAND, ...JSON.parse(stored) };
        }
      } catch {}
    }
    return DEFAULT_BRAND;
  });

  const updateBrandSettings = useCallback((newSettings: Partial<BrandSettings>) => {
    setBrandSettings((prev) => {
      const updated = { ...prev, ...newSettings };
      if (typeof window !== "undefined") {
        try {
          localStorage.setItem("owner_brand_settings", JSON.stringify(updated));
        } catch {}
      }
      return updated;
    });
  }, []);

  const updateProfile = useCallback(async (data: { name?: string; phone?: string }) => {
    const res = await authApi.updateProfile(data);
    const updatedUser = (res as any).user as User;
    setUser(updatedUser);
    return updatedUser;
  }, []);

  const refreshUser = useCallback(async () => {
    try {
      const res = await authApi.me();
      if (res && (res as any).user) {
        setUser((res as any).user);
      } else {
        setUser(null);
      }
    } catch {
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshUser();
  }, [refreshUser]);

  const login = async (credentials: { email: string; password: string }) => {
    const res = await authApi.login(credentials);
    const loggedUser = (res as any).user as User;
    const token = (res as any).token as string;

    if (token) {
      // Store in document cookie for Next.js middleware & SSR
      document.cookie = `auth_token=${token}; path=/; max-age=${60 * 60 * 24 * 7}; SameSite=Lax`;
      if (typeof window !== "undefined") {
        localStorage.setItem("auth_token", token);
      }
    }

    setUser(loggedUser);
    return loggedUser;
  };

  const logout = async () => {
    try {
      await authApi.logout();
    } catch {
      // Continue cleanup on failure
    }
    document.cookie = "auth_token=; path=/; max-age=0";
    if (typeof window !== "undefined") {
      localStorage.removeItem("auth_token");
    }
    setUser(null);
    router.push("/login");
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        login,
        logout,
        refreshUser,
        brandSettings,
        updateBrandSettings,
        updateProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
