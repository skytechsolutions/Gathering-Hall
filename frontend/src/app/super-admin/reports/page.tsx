"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function SuperAdminReportsRedirect() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/super-admin/owners");
  }, [router]);

  return (
    <div className="flex h-96 items-center justify-center">
      <div className="flex flex-col items-center gap-2">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#3b3c44] border-t-transparent" />
        <p className="text-xs font-semibold text-slate-500">Redirecting to Hall Owner Management...</p>
      </div>
    </div>
  );
}
