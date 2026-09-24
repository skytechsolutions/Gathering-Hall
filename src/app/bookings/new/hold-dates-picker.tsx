"use client";

import { useState } from "react";

const inputClass = "w-full rounded-2xl border border-hairline px-3 py-2.5 text-sm text-ink outline-none transition focus:border-ink";
const smallLabelClass = "mb-1 block text-xs font-semibold text-mute";

// A Hold only needs the date(s) being tentatively reserved — up to 3, since
// a customer often wants to hold a few candidate dates before deciding.
export function HoldDatesPicker() {
  const [count, setCount] = useState(1);

  return (
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, index) => (
        <div key={index} className="grid gap-3 sm:grid-cols-[2fr_1fr]">
          <div>
            <label className={smallLabelClass} htmlFor={`date${index + 1}`}>Date {count > 1 ? index + 1 : ""}</label>
            <input id={`date${index + 1}`} name={`date${index + 1}`} type="date" required className={inputClass} />
          </div>
          <div>
            <label className={smallLabelClass} htmlFor={`shift${index + 1}`}>Shift</label>
            <select id={`shift${index + 1}`} name={`shift${index + 1}`} defaultValue="NIGHT" className={inputClass}>
              <option value="DAY">Day</option>
              <option value="NIGHT">Night</option>
            </select>
          </div>
        </div>
      ))}

      <div className="flex gap-4">
        {count < 3 ? (
          <button type="button" onClick={() => setCount(count + 1)} className="text-xs font-semibold text-primary hover:underline">
            + Add another date
          </button>
        ) : null}
        {count > 1 ? (
          <button type="button" onClick={() => setCount(count - 1)} className="text-xs font-semibold text-mute hover:underline">
            − Remove last date
          </button>
        ) : null}
      </div>
    </div>
  );
}
