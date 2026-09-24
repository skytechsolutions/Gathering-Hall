"use client";

import { useState } from "react";
import { CustomerCombobox } from "@/components/customer-combobox";

type Customer = { id: string; full_name: string; phone: string | null };

const inputClass = "w-full rounded-2xl border border-hairline px-3 py-2.5 text-sm text-ink outline-none transition focus:border-ink";
const smallLabelClass = "mb-1 block text-xs font-semibold text-mute";

export function CustomerSection({ customers }: { customers: Customer[] }) {
  const [mode, setMode] = useState<"existing" | "new">("existing");

  return (
    <div>
      <div className="mb-1 flex items-center justify-between">
        <label className="text-sm font-semibold text-body">Customer</label>
        <button
          type="button"
          onClick={() => setMode(mode === "existing" ? "new" : "existing")}
          className="text-xs font-semibold text-primary hover:underline"
        >
          {mode === "existing" ? "+ New Customer" : "Search Existing Customer"}
        </button>
      </div>

      {mode === "existing" ? (
        <CustomerCombobox customers={customers} />
      ) : (
        <div className="grid gap-3 rounded-2xl border border-hairline bg-surface-soft p-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label className={smallLabelClass} htmlFor="newCustomerName">Customer Name</label>
            <input id="newCustomerName" name="newCustomerName" required className={inputClass} />
          </div>
          <div>
            <label className={smallLabelClass} htmlFor="newCustomerPhone">Phone</label>
            <input id="newCustomerPhone" name="newCustomerPhone" className={inputClass} />
          </div>
          <div>
            <label className={smallLabelClass} htmlFor="newCustomerAddress">Address</label>
            <input id="newCustomerAddress" name="newCustomerAddress" className={inputClass} />
          </div>
          <div>
            <label className={smallLabelClass} htmlFor="newCustomerReferenceName">Reference Name</label>
            <input id="newCustomerReferenceName" name="newCustomerReferenceName" placeholder="Who referred them" className={inputClass} />
          </div>
          <div>
            <label className={smallLabelClass} htmlFor="newCustomerReferencePhone">Reference Phone</label>
            <input id="newCustomerReferencePhone" name="newCustomerReferencePhone" className={inputClass} />
          </div>
        </div>
      )}
    </div>
  );
}
