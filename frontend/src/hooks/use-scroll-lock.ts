"use client";

import { useEffect } from "react";

let activeLockCount = 0;

export function useScrollLock(lock: boolean) {
  useEffect(() => {
    if (!lock || typeof window === "undefined" || typeof document === "undefined") {
      return;
    }

    activeLockCount++;
    const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
    const originalBodyOverflow = document.body.style.overflow;
    const originalHtmlOverflow = document.documentElement.style.overflow;
    const originalPaddingRight = document.body.style.paddingRight;

    document.body.setAttribute("data-scroll-locked", "true");
    document.body.style.overflow = "hidden";
    document.documentElement.style.overflow = "hidden";

    if (scrollbarWidth > 0) {
      document.body.style.paddingRight = `${scrollbarWidth}px`;
    }

    return () => {
      activeLockCount = Math.max(0, activeLockCount - 1);
      if (activeLockCount === 0) {
        document.body.removeAttribute("data-scroll-locked");
        document.body.style.overflow = originalBodyOverflow;
        document.documentElement.style.overflow = originalHtmlOverflow;
        document.body.style.paddingRight = originalPaddingRight;
      }
    };
  }, [lock]);
}
