import { createClient } from "@/lib/supabase/client";
import type { FileType, RawDataRecord, RosterRecord, CoachingRecord } from "@/types/domain";

async function chunkedInsert(table: string, rows: Record<string, unknown>[], chunkSize = 500) {
  const supabase = createClient();
  for (let i = 0; i < rows.length; i += chunkSize) {
    const chunk = rows.slice(i, i + chunkSize);
    const { error } = await supabase.from(table).insert(chunk);
    if (error) throw error;
  }
}

async function logUpload(fileType: FileType, rowCount: number) {
  const supabase = createClient();
  const { data: userData } = await supabase.auth.getUser();
  const { error } = await supabase.from("uploads_log").insert({
    file_type: fileType,
    uploaded_by: userData.user?.email ?? "admin",
    row_count: rowCount,
  });
  if (error) throw error;
}

export async function replaceRawData(rows: RawDataRecord[]) {
  const supabase = createClient();
  const { error: delError } = await supabase.from("raw_data").delete().neq("case_id", "__none__");
  if (delError) throw delError;
  await chunkedInsert("raw_data", rows as unknown as Record<string, unknown>[]);
  await logUpload("raw_data", rows.length);
}

export async function replaceRoster(rows: RosterRecord[]) {
  const supabase = createClient();
  const { error: delError } = await supabase.from("roster").delete().neq("msid", "__none__");
  if (delError) throw delError;
  await chunkedInsert("roster", rows as unknown as Record<string, unknown>[]);
  await logUpload("roster", rows.length);
}

export async function replaceCoaching(rows: CoachingRecord[]) {
  const supabase = createClient();
  const { error: delError } = await supabase
    .from("coaching")
    .delete()
    .neq("technician_msid", "__none__");
  if (delError) throw delError;
  await chunkedInsert("coaching", rows as unknown as Record<string, unknown>[]);
  await logUpload("coaching", rows.length);
}
