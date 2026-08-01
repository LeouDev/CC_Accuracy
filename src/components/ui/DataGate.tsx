"use client";

import { useDataStore } from "@/store/dataStore";

export function DataGate({ hasRows, children }: { hasRows: boolean; children: React.ReactNode }) {
  const loading = useDataStore((s) => s.loading);
  const error = useDataStore((s) => s.error);

  if (loading) return <p className="text-sm text-muted">Loading data…</p>;
  if (error) return <p className="text-sm text-danger">Failed to load data: {error}</p>;
  if (!hasRows) {
    return (
      <div className="glass-card p-8 text-center text-sm text-muted">
        No data yet, or nothing matches the current filters.
      </div>
    );
  }
  return <>{children}</>;
}
