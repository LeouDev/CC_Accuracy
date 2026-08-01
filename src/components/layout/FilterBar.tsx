"use client";

import { useFilterStore } from "@/store/filterStore";
import { useFilterOptions, type FilterOptions } from "@/hooks/useEnrichedData";
import { MultiSelect } from "./MultiSelect";

const DIMENSIONS: { key: keyof FilterOptions; label: string }[] = [
  { key: "site", label: "Site" },
  { key: "supervisor", label: "Supervisor" },
  { key: "technician", label: "Technician" },
  { key: "auditor", label: "Auditor" },
  { key: "category", label: "Category" },
  { key: "subcategory", label: "Subcategory" },
  { key: "month", label: "Month" },
  { key: "quarter", label: "Quarter" },
  { key: "year", label: "Year" },
];

export function FilterBar() {
  const options = useFilterOptions();
  const filters = useFilterStore();

  const hasActiveFilters =
    DIMENSIONS.some((d) => (filters[d.key] as string[]).length > 0) ||
    !!filters.dateFrom ||
    !!filters.dateTo;

  return (
    <div className="no-print flex flex-wrap items-center gap-2 border-b border-card-border px-4 py-2 sm:px-6">
      {DIMENSIONS.map((d) => (
        <MultiSelect
          key={d.key}
          label={d.label}
          options={options[d.key]}
          selected={filters[d.key] as string[]}
          onChange={(v) => filters.setFilter(d.key, v)}
        />
      ))}
      <div className="flex items-center gap-1 text-xs">
        <input
          type="date"
          value={filters.dateFrom ?? ""}
          onChange={(e) => filters.setFilter("dateFrom", e.target.value || null)}
          className="rounded-lg border border-card-border bg-transparent px-2 py-1.5 text-xs"
        />
        <span className="text-muted">to</span>
        <input
          type="date"
          value={filters.dateTo ?? ""}
          onChange={(e) => filters.setFilter("dateTo", e.target.value || null)}
          className="rounded-lg border border-card-border bg-transparent px-2 py-1.5 text-xs"
        />
      </div>
      {hasActiveFilters && (
        <button
          type="button"
          onClick={() => filters.reset()}
          className="rounded-lg px-2 py-1.5 text-xs text-danger hover:bg-danger/10"
        >
          Reset filters
        </button>
      )}
    </div>
  );
}
