"use client";

import { useState } from "react";
import { useAuthStore } from "@/store/authStore";
import { useDataStore } from "@/store/dataStore";
import { parseFileInWorker } from "@/lib/parsing/runInWorker";
import { replaceRawData, replaceRoster, replaceCoaching } from "@/lib/supabase/upload";
import type { FileType, RawDataRecord, RosterRecord, CoachingRecord } from "@/types/domain";

const SLOTS: { type: FileType; label: string; hint: string }[] = [
  { type: "raw_data", label: "Raw Data", hint: "Audit records — one row per audited transaction" },
  { type: "roster", label: "Roster", hint: "Technician → Site / AM Name mapping" },
  { type: "coaching", label: "Coaching", hint: "Coaching log with compliance dates" },
];

export default function UploadPage() {
  const isAdmin = useAuthStore((s) => s.isAdmin);
  const initialized = useAuthStore((s) => s.initialized);
  const fetchAll = useDataStore((s) => s.fetchAll);
  const [status, setStatus] = useState<Record<FileType, string>>({
    raw_data: "",
    roster: "",
    coaching: "",
  });
  const [busy, setBusy] = useState<FileType | null>(null);

  if (!initialized) return null;

  if (!isAdmin) {
    return (
      <div className="glass-card p-8 text-center text-sm text-muted">
        You need to be logged in as Admin to upload data. Use the &quot;Admin Login&quot; button in
        the top bar.
      </div>
    );
  }

  async function handleFile(type: FileType, file: File) {
    setBusy(type);
    setStatus((s) => ({ ...s, [type]: "Parsing…" }));
    try {
      const rows = await parseFileInWorker(type, file);
      setStatus((s) => ({ ...s, [type]: `Parsed ${rows.length} rows. Uploading…` }));
      if (type === "raw_data") await replaceRawData(rows as RawDataRecord[]);
      if (type === "roster") await replaceRoster(rows as RosterRecord[]);
      if (type === "coaching") await replaceCoaching(rows as CoachingRecord[]);
      setStatus((s) => ({ ...s, [type]: `Done — replaced with ${rows.length} rows.` }));
      await fetchAll();
    } catch (err) {
      setStatus((s) => ({
        ...s,
        [type]: `Error: ${err instanceof Error ? err.message : String(err)}`,
      }));
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="max-w-2xl space-y-4">
      <h1 className="text-lg font-semibold">Upload Data</h1>
      <p className="text-sm text-muted">
        Each upload replaces all existing data of that type. Viewers see the update automatically
        within a couple seconds via Supabase Realtime — no refresh needed.
      </p>
      {SLOTS.map((slot) => (
        <div key={slot.type} className="glass-card space-y-2 p-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-medium">{slot.label}</p>
              <p className="text-xs text-muted">{slot.hint}</p>
            </div>
            <label className="cursor-pointer rounded-lg bg-accent px-3 py-2 text-xs font-medium text-white">
              {busy === slot.type ? "Working…" : "Choose file"}
              <input
                type="file"
                accept=".xlsx,.xls,.csv"
                className="hidden"
                disabled={busy !== null}
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleFile(slot.type, file);
                  e.target.value = "";
                }}
              />
            </label>
          </div>
          {status[slot.type] && <p className="text-xs text-muted">{status[slot.type]}</p>}
        </div>
      ))}
    </div>
  );
}
