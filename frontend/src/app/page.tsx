"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/auth-context";
import SlidingAuthCard from "@/components/auth/sliding-auth-card";

export default function HomePage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && user) {
      if (user.role === "SUPER_ADMIN") {
        router.push("/super-admin");
      } else if (user.role === "HALL_OWNER") {
        router.push("/dashboard");
      }
    }
  }, [user, isLoading, router]);

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#05110b]">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-emerald-500 border-t-transparent" />
          <p className="text-xs font-semibold uppercase tracking-widest text-emerald-300">
            Chamkani Hall Management
          </p>
        </div>
      </div>
    );
  }

  if (user) {
    return null;
  }

  return <SlidingAuthCard initialMode="signin" />;
}
