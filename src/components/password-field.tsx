"use client";

import { useState, type InputHTMLAttributes } from "react";

function EyeIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
      <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

function EyeOffIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
      <path d="M3 3l18 18" />
      <path d="M10.6 5.2A10.6 10.6 0 0 1 12 5c6.5 0 10 7 10 7a13.3 13.3 0 0 1-3.1 3.9M6.5 6.6C4 8.3 2 12 2 12s3.5 7 10 7a9.9 9.9 0 0 0 4.4-1" />
      <path d="M9.9 9.9a3 3 0 0 0 4.2 4.2" />
    </svg>
  );
}

type Props = InputHTMLAttributes<HTMLInputElement> & { wrapperClassName?: string };

// Drop-in replacement for <input type="password">, with an eye toggle to
// reveal the value — every other prop (id, name, value, onChange,
// required, autoComplete, className, ...) passes straight through to the
// underlying <input>.
export function PasswordField({ wrapperClassName, className, ...props }: Props) {
  const [visible, setVisible] = useState(false);

  return (
    <div className={`relative ${wrapperClassName ?? ""}`}>
      <input {...props} type={visible ? "text" : "password"} className={`${className ?? ""} pr-9`} />
      <button
        type="button"
        onClick={() => setVisible((v) => !v)}
        tabIndex={-1}
        aria-label={visible ? "Hide password" : "Show password"}
        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-mute transition hover:text-ink"
      >
        {visible ? <EyeOffIcon /> : <EyeIcon />}
      </button>
    </div>
  );
}
