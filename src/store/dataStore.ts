import { create } from "zustand";
import { createClient } from "@/lib/supabase/client";
import type { RawDataRecord, RosterRecord, CoachingRecord } from "@/types/domain";

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
  lastUpload: Partial<Record<"raw_data" | "roster" | "coaching", UploadLogEntry>>;
  loading: boolean;
  error: string | null;
  fetchAll: () => Promise<void>;
}

const PAGE_SIZE = 1000;

async function fetchAllRows<T>(table: string): Promise<T[]> {
  const supabase = createClient();
  const all: T[] = [];
  let from = 0;
  for (;;) {
    const { data, error } = await supabase
      .from(table)
      .select("*")
      .range(from, from + PAGE_SIZE - 1);
    if (error) throw error;
    if (!data || data.length === 0) break;
    all.push(...(data as T[]));
    if (data.length < PAGE_SIZE) break;
    from += PAGE_SIZE;
  }
  return all;
}

export const useDataStore = create<DataState>((set) => ({
  rawRows: [],
  rosterRows: [],
  coachingRows: [],
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

      set({ rawRows, rosterRows, coachingRows, lastUpload, loading: false });
    } catch (err) {
      set({ error: err instanceof Error ? err.message : String(err), loading: false });
    }
  },
}));
