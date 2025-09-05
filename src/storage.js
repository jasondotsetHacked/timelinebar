const DB_NAME = 'timeTrackerDB';
const DB_VERSION = 2; // v2 adds 'buckets' store for persistent bucket notes

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
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });

const withStore = (storeName, mode, fn) =>
  openDb().then(
    (db) =>
      new Promise((resolve, reject) => {
        const tx = db.transaction(storeName, mode);
        const store = tx.objectStore(storeName);
        fn(store);
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
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
