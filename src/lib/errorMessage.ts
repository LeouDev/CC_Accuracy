/** Supabase/PostgREST errors are plain objects with a `message` (and often
 * `code`/`details`/`hint`), not real Error instances - String(err) on those
 * yields "[object Object]". This extracts something actually readable. */
export function getErrorMessage(err: unknown): string {
  if (err instanceof Error) return err.message;
  if (err && typeof err === "object") {
    const obj = err as Record<string, unknown>;
    const parts = [obj.message, obj.details, obj.hint].filter(
      (v): v is string => typeof v === "string" && v.length > 0,
    );
    if (parts.length > 0) {
      return obj.code ? `${parts.join(" — ")} (code ${obj.code})` : parts.join(" — ");
    }
    try {
      return JSON.stringify(obj);
    } catch {
      // fall through
    }
  }
  return String(err);
}
