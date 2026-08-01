import type { FileType, RawDataRecord, RosterRecord, CoachingRecord } from "@/types/domain";
import type { ParseWorkerResponse } from "@/workers/parseWorker";

type RowsFor<T extends FileType> = T extends "raw_data"
  ? RawDataRecord[]
  : T extends "roster"
    ? RosterRecord[]
    : CoachingRecord[];

export function parseFileInWorker<T extends FileType>(
  fileType: T,
  file: File,
): Promise<RowsFor<T>> {
  return new Promise((resolve, reject) => {
    const worker = new Worker(new URL("../../workers/parseWorker.ts", import.meta.url));

    worker.onmessage = (event: MessageEvent<ParseWorkerResponse>) => {
      const data = event.data;
      worker.terminate();
      if (data.ok) {
        resolve(data.rows as RowsFor<T>);
      } else {
        reject(new Error(data.error));
      }
    };

    worker.onerror = (err) => {
      worker.terminate();
      reject(err.error ?? new Error(err.message));
    };

    file.arrayBuffer().then((buffer) => {
      worker.postMessage({ fileType, buffer }, [buffer]);
    });
  });
}
