import { create } from "zustand";
import { createClient } from "@/lib/supabase/client";
import { buildEnrichedCases, buildEnrichedCoaching } from "@/lib/enrich";
import type {
  RawDataRecord,
  RosterRecord,
  CoachingRecord,
  EnrichedCase,
  EnrichedCoaching,
} from "@/types/domain";

interface UploadLogEntry {
  file_type: "raw_data" | "roster" | "coaching";
  uploaded_at: string;
  uploaded_by: string | null;
  row_count: number | null;
}

interface DataState {
  rawRows: RawDataRecord[];
  rosterRows: RosterRecord[];
  coachingRows: CoachingRecord[];
  // Derived once per fetch (not per page) - enriching 50k+ rows on every tab
  // navigation was the main source of the "loading" lag between pages.
  enrichedCases: EnrichedCase[];
  enrichedCoaching: EnrichedCoaching[];
  lastUpload: Partial<Record<"raw_data" | "roster" | "coaching", UploadLogEntry>>;
  loading: boolean;
  error: string | null;
  fetchAll: () => Promise<void>;
}

const PAGE_SIZE = 1000;

async function fetchAllRows<T>(table: string): Promise<T[]> {
  const supabase = createClient();

  const { count, error: countError } = await supabase
    .from(table)
    .select("*", { count: "exact", head: true });
  if (countError) throw countError;
  if (!count) return [];

  const pageStarts: number[] = [];
  for (let from = 0; from < count; from += PAGE_SIZE) pageStarts.push(from);

  const pages = await Promise.all(
    pageStarts.map(async (from) => {
      const { data, error } = await supabase
        .from(table)
        .select("*")
        .range(from, from + PAGE_SIZE - 1);
      if (error) throw error;
      return (data ?? []) as T[];
    }),
  );

  return pages.flat();
}

export const useDataStore = create<DataState>((set) => ({
  rawRows: [],
  rosterRows: [],
  coachingRows: [],
  enrichedCases: [],
  enrichedCoaching: [],
  lastUpload: {},
  loading: true,
  error: null,
  fetchAll: async () => {
    set({ loading: true, error: null });
    try {
      const supabase = createClient();
      const [rawRows, rosterRows, coachingRows, uploadsResp] = await Promise.all([
        fetchAllRows<RawDataRecord>("raw_data"),
        fetchAllRows<RosterRecord>("roster"),
        fetchAllRows<CoachingRecord>("coaching"),
        supabase
          .from("uploads_log")
          .select("*")
          .order("uploaded_at", { ascending: false })
          .limit(50),
      ]);

      const lastUpload: DataState["lastUpload"] = {};
      for (const entry of (uploadsResp.data ?? []) as UploadLogEntry[]) {
        if (!lastUpload[entry.file_type]) {
          lastUpload[entry.file_type] = entry;
        }
      }

      const enrichedCases = buildEnrichedCases(rawRows, rosterRows);
      const enrichedCoaching = buildEnrichedCoaching(coachingRows, rosterRows);

      set({
        rawRows,
        rosterRows,
        coachingRows,
        enrichedCases,
        enrichedCoaching,
        lastUpload,
        loading: false,
      });
    } catch (err) {
      set({ error: err instanceof Error ? err.message : String(err), loading: false });
    }
  },
}));
