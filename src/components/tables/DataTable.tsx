"use client";

import { useMemo, useState } from "react";
import * as XLSX from "xlsx";

export interface ColumnDef<T> {
  key: string;
  header: string;
  accessor: (row: T) => string | number | null;
}

const PAGE_SIZE_OPTIONS = [10, 25, 50, 100] as const;

export function DataTable<T>({
  rows,
  columns,
  pageSize = 25,
  filename = "export",
}: {
  rows: T[];
  columns: ColumnDef<T>[];
  pageSize?: number;
  filename?: string;
}) {
  const [search, setSearch] = useState("");
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState<number>(pageSize);

  const filtered = useMemo(() => {
    if (!search.trim()) return rows;
    const q = search.toLowerCase();
    return rows.filter((row) =>
      columns.some((c) =>
        String(c.accessor(row) ?? "")
          .toLowerCase()
          .includes(q),
      ),
    );
  }, [rows, search, columns]);

  const sorted = useMemo(() => {
    if (!sortKey) return filtered;
    const col = columns.find((c) => c.key === sortKey);
    if (!col) return filtered;
    const copy = [...filtered];
    copy.sort((a, b) => {
      const av = col.accessor(a);
      const bv = col.accessor(b);
      if (av == null && bv == null) return 0;
      if (av == null) return 1;
      if (bv == null) return -1;
      if (typeof av === "number" && typeof bv === "number") return av - bv;
      return String(av).localeCompare(String(bv));
    });
    if (sortDir === "desc") copy.reverse();
    return copy;
  }, [filtered, sortKey, sortDir, columns]);

  const effectiveRowsPerPage = rowsPerPage === Infinity ? Math.max(sorted.length, 1) : rowsPerPage;
  const totalPages = Math.max(1, Math.ceil(sorted.length / effectiveRowsPerPage));
  const pageRows = sorted.slice(page * effectiveRowsPerPage, page * effectiveRowsPerPage + effectiveRowsPerPage);

  function toggleSort(key: string) {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
  }

  function exportData(type: "csv" | "xlsx") {
    const data = sorted.map((row) => {
      const obj: Record<string, string | number | null> = {};
      for (const c of columns) obj[c.header] = c.accessor(row);
      return obj;
    });
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Data");
    if (type === "csv") {
      XLSX.writeFile(wb, `${filename}.csv`, { bookType: "csv" });
    } else {
      XLSX.writeFile(wb, `${filename}.xlsx`);
    }
  }

  return (
    <div className="glass-card overflow-hidden">
      <div className="no-print flex flex-wrap items-center justify-between gap-2 border-b border-card-border p-3">
        <input
          type="text"
          placeholder="Search…"
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(0);
          }}
          className="w-48 rounded-lg border border-card-border bg-transparent px-3 py-1.5 text-xs outline-none focus:border-accent"
        />
        <div className="flex items-center gap-2 text-xs">
          <span className="text-muted">{sorted.length} rows</span>
          <label className="flex items-center gap-1 text-muted">
            Show
            <select
              value={rowsPerPage === Infinity ? "all" : rowsPerPage}
              onChange={(e) => {
                setRowsPerPage(e.target.value === "all" ? Infinity : Number(e.target.value));
                setPage(0);
              }}
              className="rounded-lg border border-card-border bg-transparent px-1.5 py-1 text-xs outline-none focus:border-accent"
            >
              {PAGE_SIZE_OPTIONS.map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
              <option value="all">All</option>
            </select>
          </label>
          <button
            onClick={() => exportData("csv")}
            className="rounded-lg border border-card-border px-2 py-1 hover:border-accent"
          >
            CSV
          </button>
          <button
            onClick={() => exportData("xlsx")}
            className="rounded-lg border border-card-border px-2 py-1 hover:border-accent"
          >
            Excel
          </button>
          <button
            onClick={() => window.print()}
            className="rounded-lg border border-card-border px-2 py-1 hover:border-accent"
          >
            Print
          </button>
        </div>
      </div>
      <div className="max-h-[32rem] overflow-auto">
        <table className="w-full text-center text-xs">
          <thead className="sticky top-0 bg-[var(--background)]">
            <tr>
              {columns.map((c) => (
                <th
                  key={c.key}
                  onClick={() => toggleSort(c.key)}
                  className="cursor-pointer whitespace-nowrap border-b border-card-border px-3 py-2 font-medium text-muted hover:text-foreground"
                >
                  {c.header} {sortKey === c.key ? (sortDir === "asc" ? "▲" : "▼") : ""}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {pageRows.map((row, i) => (
              <tr key={i} className="border-b border-card-border/50 hover:bg-accent/5">
                {columns.map((c) => (
                  <td key={c.key} className="whitespace-nowrap px-3 py-2">
                    {c.accessor(row) ?? "—"}
                  </td>
                ))}
              </tr>
            ))}
            {pageRows.length === 0 && (
              <tr>
                <td colSpan={columns.length} className="px-3 py-6 text-center text-muted">
                  No rows match.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      <div className="no-print flex items-center justify-between gap-2 border-t border-card-border p-2 text-xs">
        <button
          disabled={page === 0}
          onClick={() => setPage((p) => p - 1)}
          className="rounded px-2 py-1 disabled:opacity-30"
        >
          Prev
        </button>
        <span className="text-muted">
          Page {page + 1} of {totalPages}
        </span>
        <button
          disabled={page >= totalPages - 1}
          onClick={() => setPage((p) => p + 1)}
          className="rounded px-2 py-1 disabled:opacity-30"
        >
          Next
        </button>
      </div>
    </div>
  );
}
