export const DB_NAME = 'timeTrackerDB';
const DB_VERSION = 3; // v3 adds 'schedules' store and scheduleId on punches

const openDb = () =>
  new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      // Ensure punches store exists
      if (!db.objectStoreNames.contains('punches')) {
        db.createObjectStore('punches', { keyPath: 'id', autoIncrement: true });
      }
      // v2: persistent bucket notes keyed by name (string, can be empty for no-bucket)
      if (!db.objectStoreNames.contains('buckets')) {
        db.createObjectStore('buckets', { keyPath: 'name' });
      }
      // v3: schedules store for multi-schedule support
      if (!db.objectStoreNames.contains('schedules')) {
        db.createObjectStore('schedules', { keyPath: 'id', autoIncrement: true });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });

const withStore = (storeName, mode, fn) =>
  openDb().then(
    (db) =>
      new Promise((resolve, reject) => {
        try {
          const tx = db.transaction(storeName, mode);
          const store = tx.objectStore(storeName);
          const ret = fn(store);
          tx.oncomplete = () => resolve(ret);
          tx.onerror = () => reject(tx.error);
        } catch (err) {
          reject(err);
        }
      })
  );

// Punches API
const add = (punch) => withStore('punches', 'readwrite', (store) => store.add(punch));
const put = (punch) => withStore('punches', 'readwrite', (store) => store.put(punch));
const remove = (id) => withStore('punches', 'readwrite', (store) => store.delete(id));
const clear = () => withStore('punches', 'readwrite', (store) => store.clear());
const all = () =>
  openDb().then(
    (db) =>
      new Promise((resolve, reject) => {
        const tx = db.transaction('punches', 'readonly');
        const store = tx.objectStore('punches');
        const req = store.getAll();
        req.onsuccess = () => resolve(req.result || []);
        req.onerror = () => reject(req.error);
      })
  );

// Buckets API (persistent notes per bucket name)
const getBucket = (name) =>
  openDb().then(
    (db) =>
      new Promise((resolve, reject) => {
        try {
          const tx = db.transaction('buckets', 'readonly');
          const store = tx.objectStore('buckets');
          const req = store.get(String(name ?? ''));
          req.onsuccess = () => resolve(req.result || null);
          req.onerror = () => reject(req.error);
        } catch (err) {
          // If store missing for some reason, resolve null
          resolve(null);
        }
      })
  );
const setBucketNote = (name, note) =>
  withStore('buckets', 'readwrite', (store) => {
    const key = String(name ?? '');
    const rec = { name: key, note: String(note ?? '') };
    if (!rec.note.trim()) {
      // If empty, delete the record to keep store tidy
      try { store.delete(key); } catch { /* ignore */ }
    } else {
      store.put(rec);
    }
  });
const deleteBucket = (name) => withStore('buckets', 'readwrite', (store) => store.delete(String(name ?? '')));
const allBuckets = () =>
  openDb().then(
    (db) =>
      new Promise((resolve, reject) => {
        try {
          const tx = db.transaction('buckets', 'readonly');
          const store = tx.objectStore('buckets');
          const req = store.getAll();
          req.onsuccess = () => resolve(req.result || []);
          req.onerror = () => reject(req.error);
        } catch (err) {
          resolve([]);
        }
      })
  );
const clearBuckets = () => withStore('buckets', 'readwrite', (store) => store.clear());

export const idb = { add, put, remove, clear, all, getBucket, setBucketNote, deleteBucket, allBuckets, clearBuckets };
// Schedules API
const addSchedule = (rec) => withStore('schedules', 'readwrite', (store) => store.add(rec));
const putSchedule = (rec) => withStore('schedules', 'readwrite', (store) => store.put(rec));
const removeSchedule = (id) => withStore('schedules', 'readwrite', (store) => store.delete(id));
const allSchedules = () =>
  openDb().then(
    (db) =>
      new Promise((resolve, reject) => {
        try {
          const tx = db.transaction('schedules', 'readonly');
          const store = tx.objectStore('schedules');
          const req = store.getAll();
          req.onsuccess = () => resolve(req.result || []);
          req.onerror = () => reject(req.error);
        } catch (err) {
          resolve([]);
        }
      })
  );

export const schedulesDb = { addSchedule, putSchedule, removeSchedule, allSchedules };

// Delete the entire IndexedDB database used by the app
export function destroy() {
  return new Promise((resolve, reject) => {
    try {
      const req = indexedDB.deleteDatabase(DB_NAME);
      req.onsuccess = () => resolve(true);
      req.onerror = () => reject(req.error);
      req.onblocked = () => {
        // best-effort: resolve anyway; caller can suggest closing tabs
        resolve(false);
      };
    } catch (err) {
      reject(err);
    }
  });
}
