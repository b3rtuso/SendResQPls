/**
 * offlineQueue.ts
 * Stores pending emergency reports when the device is offline.
 * Images are stored in IndexedDB (can handle large blobs).
 * Metadata (lat, lng, userId, timestamp) is stored in localStorage.
 *
 * On reconnect, the queue is flushed automatically in MobileReport.tsx.
 */

const DB_NAME = 'sendresqpls_offline';
const DB_VERSION = 1;
const STORE_NAME = 'pending_reports';
const META_KEY = 'offline_report_queue_ids';

// --- IndexedDB helpers ---------------------------------------------------------

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = (e) => {
      const db = (e.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

function dbPut(db: IDBDatabase, record: PendingReport): Promise<void> {
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    tx.objectStore(STORE_NAME).put(record);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

function dbGet(db: IDBDatabase, id: string): Promise<PendingReport | undefined> {
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly');
    const req = tx.objectStore(STORE_NAME).get(id);
    req.onsuccess = () => resolve(req.result as PendingReport | undefined);
    req.onerror = () => reject(req.error);
  });
}

function dbDelete(db: IDBDatabase, id: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    tx.objectStore(STORE_NAME).delete(id);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

// --- Types ---------------------------------------------------------------------

export interface PendingReport {
  id: string;           // UUID generated at queue time
  userId: string;
  latitude: string;
  longitude: string;
  photoBlob: Blob;      // Stored in IndexedDB (handles large images)
  photoName: string;    // Original filename for MIME reconstruction
  timestamp: number;    // Unix ms — for display and expiry
}

// --- Public API ----------------------------------------------------------------

/** Add a new report to the offline queue. */
export async function enqueueReport(report: Omit<PendingReport, 'id' | 'timestamp'>): Promise<string> {
  const id = crypto.randomUUID();
  const record: PendingReport = { ...report, id, timestamp: Date.now() };

  const db = await openDB();
  await dbPut(db, record);

  // Track IDs in localStorage so we know how many are pending
  const ids: string[] = JSON.parse(localStorage.getItem(META_KEY) || '[]');
  ids.push(id);
  localStorage.setItem(META_KEY, JSON.stringify(ids));

  return id;
}

/** Get all pending report IDs from localStorage. */
export function getPendingIds(): string[] {
  return JSON.parse(localStorage.getItem(META_KEY) || '[]');
}

/** Get the count of pending reports. */
export function getPendingCount(): number {
  return getPendingIds().length;
}

/** Retrieve a single pending report from IndexedDB by ID. */
export async function getReport(id: string): Promise<PendingReport | undefined> {
  const db = await openDB();
  return dbGet(db, id);
}

/** Remove a report from the queue after successful submission. */
export async function dequeueReport(id: string): Promise<void> {
  const db = await openDB();
  await dbDelete(db, id);

  const ids: string[] = JSON.parse(localStorage.getItem(META_KEY) || '[]');
  localStorage.setItem(META_KEY, JSON.stringify(ids.filter(i => i !== id)));
}

/** Remove all pending reports older than 24 hours (stale reports). */
export async function pruneStaleReports(): Promise<void> {
  const ids = getPendingIds();
  const cutoff = Date.now() - 24 * 60 * 60 * 1000; // 24 hours ago
  const db = await openDB();

  for (const id of ids) {
    const report = await dbGet(db, id);
    if (report && report.timestamp < cutoff) {
      await dbDelete(db, id);
    }
  }

  // Rebuild the ID list from what is still in IndexedDB
  const remaining: string[] = [];
  for (const id of ids) {
    const report = await dbGet(db, id);
    if (report) remaining.push(id);
  }
  localStorage.setItem(META_KEY, JSON.stringify(remaining));
}

