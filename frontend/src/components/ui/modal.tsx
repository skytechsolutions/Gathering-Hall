"use client";

import React, { useEffect, useRef } from "react";
import { useScrollLock } from "@/hooks/use-scroll-lock";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  title?: React.ReactNode;
  className?: string;
  maxWidth?: string;
  zIndex?: string;
}

export function Modal({
  isOpen,
  onClose,
  children,
  title,
  className = "",
  maxWidth = "max-w-xl",
  zIndex = "z-50",
}: ModalProps) {
  useScrollLock(isOpen);
  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className={`fixed inset-0 ${zIndex} flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 sm:p-6 overflow-y-auto`}
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
      role="dialog"
      aria-modal="true"
    >
      <div
        ref={cardRef}
        className={`w-full ${maxWidth} max-h-[92vh] overflow-y-auto rounded-2xl bg-white p-4 sm:p-6 border border-slate-300 my-auto animate-fadeIn ${className}`}
        onClick={(e) => e.stopPropagation()}
      >
        {title && (
          <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
            <h3 className="font-extrabold text-slate-900 text-lg">{title}</h3>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-slate-600 rounded-lg p-1 transition cursor-pointer"
            >
              ✕
            </button>
          </div>
        )}
        {children}
      </div>
    </div>
  );
}
