const openDb = () =>
  new Promise((resolve, reject) => {
    const req = indexedDB.open('timeTrackerDB', 1);
    req.onupgradeneeded = () => req.result.createObjectStore('punches', { keyPath: 'id', autoIncrement: true });
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });

const withStore = (mode, fn) =>
  openDb().then(
    (db) =>
      new Promise((resolve, reject) => {
        const tx = db.transaction('punches', mode);
        const store = tx.objectStore('punches');
        fn(store);
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
      })
  );

const add = (punch) => withStore('readwrite', (store) => store.add(punch));
const put = (punch) => withStore('readwrite', (store) => store.put(punch));
const remove = (id) => withStore('readwrite', (store) => store.delete(id));
const clear = () => withStore('readwrite', (store) => store.clear());
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

export const idb = { add, put, remove, clear, all };
