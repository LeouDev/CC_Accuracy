"use client";

import { useMemo } from "react";
import { useDataStore } from "@/store/dataStore";
import { useFilterStore } from "@/store/filterStore";
import type { EnrichedCase, EnrichedCoaching } from "@/types/domain";

// Enrichment (roster join, name canonicalization, week/quarter derivation) is
// precomputed once in the store when data changes - these just select the
// cached result so navigating between tabs doesn't redo it on every mount.
export function useEnrichedCases(): EnrichedCase[] {
  return useDataStore((s) => s.enrichedCases);
}

export function useEnrichedCoachingRows(): EnrichedCoaching[] {
  return useDataStore((s) => s.enrichedCoaching);
}

function matchesArrayFilter(value: string, selected: string[]): boolean {
  return selected.length === 0 || selected.includes(value);
}

export function useFilteredCases(): EnrichedCase[] {
  const cases = useEnrichedCases();
  const filters = useFilterStore();

  return useMemo(() => {
    return cases.filter((c) => {
      if (!matchesArrayFilter(c.site, filters.site)) return false;
      if (!matchesArrayFilter(c.supervisor, filters.supervisor)) return false;
      if (!matchesArrayFilter(c.technician_name, filters.technician)) return false;
      if (filters.auditor.length > 0 && !(c.auditor && filters.auditor.includes(c.auditor)))
        return false;
      if (filters.category.length > 0 && !(c.category && filters.category.includes(c.category)))
        return false;
      if (
        filters.subcategory.length > 0 &&
        !(c.subcategory && filters.subcategory.includes(c.subcategory))
      )
        return false;
      if (
        filters.segmentCategory.length > 0 &&
        !filters.segmentCategory.includes(c.segment_category)
      )
        return false;
      if (filters.month.length > 0 && !(c.month && filters.month.includes(c.month))) return false;
      if (filters.quarter.length > 0 && !filters.quarter.includes(c.quarter)) return false;
      if (filters.year.length > 0 && !filters.year.includes(String(c.year))) return false;
      if (filters.dateFrom && (!c.case_date || c.case_date < filters.dateFrom)) return false;
      if (filters.dateTo && (!c.case_date || c.case_date > filters.dateTo)) return false;
      return true;
    });
  }, [cases, filters]);
}

export function useFilteredCoaching(): EnrichedCoaching[] {
  const rows = useEnrichedCoachingRows();
  const filters = useFilterStore();

  return useMemo(() => {
    return rows.filter((c) => {
      if (!matchesArrayFilter(c.site, filters.site)) return false;
      if (!matchesArrayFilter(c.supervisor, filters.supervisor)) return false;
      if (!matchesArrayFilter(c.technician_name, filters.technician)) return false;
      if (filters.auditor.length > 0 && !(c.auditor && filters.auditor.includes(c.auditor)))
        return false;
      if (filters.dateFrom && (!c.case_date || c.case_date < filters.dateFrom)) return false;
      if (filters.dateTo && (!c.case_date || c.case_date > filters.dateTo)) return false;
      return true;
    });
  }, [rows, filters]);
}

export interface FilterOptions {
  site: string[];
  supervisor: string[];
  technician: string[];
  auditor: string[];
  category: string[];
  subcategory: string[];
  segmentCategory: string[];
  month: string[];
  quarter: string[];
  year: string[];
}

export function useFilterOptions(): FilterOptions {
  const cases = useEnrichedCases();
  return useMemo(() => {
    const uniq = (getter: (c: EnrichedCase) => string | null | undefined) => {
      const set = new Set<string>();
      for (const c of cases) {
        const v = getter(c);
        if (v) set.add(v);
      }
      return Array.from(set).sort();
    };
    return {
      site: uniq((c) => c.site),
      supervisor: uniq((c) => c.supervisor),
      technician: uniq((c) => c.technician_name),
      auditor: uniq((c) => c.auditor),
      category: uniq((c) => c.category),
      subcategory: uniq((c) => c.subcategory),
      segmentCategory: uniq((c) => c.segment_category),
      month: uniq((c) => c.month),
      quarter: uniq((c) => c.quarter),
      year: uniq((c) => (c.year ? String(c.year) : null)),
    };
  }, [cases]);
}
