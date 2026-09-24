"use client";

import { useEffect, useRef, useState } from "react";

type Customer = { id: string; full_name: string; phone: string | null };

export function CustomerCombobox({
  customers,
  defaultCustomerId,
  name = "customerId",
}: {
  customers: Customer[];
  defaultCustomerId?: string;
  name?: string;
}) {
  const defaultCustomer = customers.find((customer) => customer.id === defaultCustomerId);
  const [query, setQuery] = useState(
    defaultCustomer ? `${defaultCustomer.full_name}${defaultCustomer.phone ? ` (${defaultCustomer.phone})` : ""}` : "",
  );
  const [selectedId, setSelectedId] = useState(defaultCustomerId ?? "");
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const trimmed = query.trim().toLowerCase();
  const filtered = trimmed === ""
    ? customers
    : customers.filter(
        (customer) => customer.full_name.toLowerCase().includes(trimmed) || (customer.phone ?? "").includes(trimmed),
      );

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  function selectCustomer(customer: Customer) {
    setSelectedId(customer.id);
    setQuery(`${customer.full_name}${customer.phone ? ` (${customer.phone})` : ""}`);
    setOpen(false);
  }

  return (
    <div className="relative" ref={containerRef}>
      <input type="hidden" name={name} value={selectedId} />
      <input
        type="text"
        value={query}
        onChange={(event) => {
          setQuery(event.target.value);
          setSelectedId("");
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        placeholder="Type customer name or phone..."
        autoComplete="off"
        className="w-full rounded-2xl border border-hairline px-3 py-2.5 text-sm text-ink outline-none transition focus:border-ink"
      />
      {open ? (
        <div className="absolute z-10 mt-1 max-h-56 w-full overflow-y-auto rounded-2xl border border-hairline bg-canvas shadow-lg">
          {filtered.length === 0 ? (
            <p className="px-3 py-2 text-sm text-mute">No customer found.</p>
          ) : (
            filtered.map((customer) => (
              <button
                key={customer.id}
                type="button"
                onClick={() => selectCustomer(customer)}
                className="block w-full px-3 py-2 text-left text-sm hover:bg-surface-card"
              >
                <span className="font-medium text-ink">{customer.full_name}</span>
                {customer.phone ? <span className="ml-2 text-xs text-mute">{customer.phone}</span> : null}
              </button>
            ))
          )}
        </div>
      ) : null}
    </div>
  );
}
