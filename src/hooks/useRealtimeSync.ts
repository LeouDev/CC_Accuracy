"use client";

import { useEffect, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import { useDataStore } from "@/store/dataStore";

/** Subscribes to Supabase Realtime so every connected Viewer refreshes the moment Admin uploads new data. */
export function useRealtimeSync() {
  const fetchAll = useDataStore((s) => s.fetchAll);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const supabase = createClient();

    const scheduleRefetch = () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => {
        fetchAll();
      }, 400);
    };

    const channel = supabase
      .channel("dashboard-sync")
      .on("postgres_changes", { event: "*", schema: "public", table: "raw_data" }, scheduleRefetch)
      .on("postgres_changes", { event: "*", schema: "public", table: "roster" }, scheduleRefetch)
      .on("postgres_changes", { event: "*", schema: "public", table: "coaching" }, scheduleRefetch)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "uploads_log" },
        scheduleRefetch,
      )
      .subscribe();

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      supabase.removeChannel(channel);
    };
  }, [fetchAll]);
}
