"use client";

import { useEffect, useRef, useState } from "react";

interface MultiSelectProps {
  label: string;
  options: string[];
  selected: string[];
  onChange: (values: string[]) => void;
}

export function MultiSelect({ label, options, selected, onChange }: MultiSelectProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  function toggle(value: string) {
    if (selected.includes(value)) {
      onChange(selected.filter((v) => v !== value));
    } else {
      onChange([...selected, value]);
    }
  }

  const summary =
    selected.length === 0 ? "All" : selected.length === 1 ? selected[0] : `${selected.length} selected`;

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex min-w-[9rem] items-center justify-between gap-2 rounded-lg border border-card-border bg-transparent px-3 py-1.5 text-xs hover:border-accent"
      >
        <span className="text-muted">{label}</span>
        <span className="max-w-[7rem] truncate font-medium">{summary}</span>
      </button>
      {open && (
        <div className="absolute left-0 z-40 mt-1 max-h-64 w-56 overflow-y-auto rounded-2xl border border-card-border bg-[var(--background)] p-2 shadow-xl">
          {selected.length > 0 && (
            <button
              type="button"
              onClick={() => onChange([])}
              className="mb-1 w-full rounded px-2 py-1 text-left text-xs text-accent hover:bg-accent/10"
            >
              Clear
            </button>
          )}
          {options.length === 0 && <p className="px-2 py-1 text-xs text-muted">No options</p>}
          {options.map((opt) => (
            <label
              key={opt}
              className="flex cursor-pointer items-center gap-2 rounded px-2 py-1 text-xs hover:bg-accent/10"
            >
              <input
                type="checkbox"
                checked={selected.includes(opt)}
                onChange={() => toggle(opt)}
              />
              <span className="truncate">{opt}</span>
            </label>
          ))}
        </div>
      )}
    </div>
  );
}
