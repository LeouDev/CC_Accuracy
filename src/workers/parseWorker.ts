import * as XLSX from "xlsx";
import { parseRawDataSheet } from "@/lib/parsing/rawData";
import { parseRosterSheet } from "@/lib/parsing/roster";
import { parseCoachingSheet } from "@/lib/parsing/coaching";
import type { FileType } from "@/types/domain";

export interface ParseWorkerRequest {
  fileType: FileType;
  buffer: ArrayBuffer;
}

export type ParseWorkerResponse =
  | { ok: true; fileType: FileType; rows: unknown[] }
  | { ok: false; error: string };

function pickSheet(workbook: XLSX.WorkBook, fileType: FileType): XLSX.WorkSheet {
  const patterns: Record<FileType, RegExp> = {
    raw_data: /raw.?data/i,
    roster: /roster/i,
    coaching: /coach/i,
  };
  const matchName = workbook.SheetNames.find((n) => patterns[fileType].test(n));
  const sheetName = matchName ?? workbook.SheetNames[0];
  return workbook.Sheets[sheetName];
}

self.onmessage = (event: MessageEvent<ParseWorkerRequest>) => {
  const { fileType, buffer } = event.data;
  try {
    const workbook = XLSX.read(buffer, { type: "array", cellDates: true });
    const sheet = pickSheet(workbook, fileType);
    let rows: unknown[];
    if (fileType === "raw_data") {
      rows = parseRawDataSheet(sheet);
    } else if (fileType === "roster") {
      rows = parseRosterSheet(sheet);
    } else {
      rows = parseCoachingSheet(sheet);
    }
    const response: ParseWorkerResponse = { ok: true, fileType, rows };
    (self as unknown as Worker).postMessage(response);
  } catch (err) {
    const response: ParseWorkerResponse = {
      ok: false,
      error: err instanceof Error ? err.message : String(err),
    };
    (self as unknown as Worker).postMessage(response);
  }
};
