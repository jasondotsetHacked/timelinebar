import { ui } from './ui.js';

const openDb = () =>
  new Promise((resolve, reject) => {
    const req = indexedDB.open('timeTrackerDB', 1);
    req.onupgradeneeded = () =>
      req.result.createObjectStore('punches', { keyPath: 'id', autoIncrement: true });
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });

const withStore = (mode, fn) =>
  openDb().then((db) =>
    new Promise((resolve, reject) => {
      const tx = db.transaction('punches', mode);
      const store = tx.objectStore('punches');
      fn(store);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    }).finally(() => db.close())
  );

const add = async (punch) => {
  try {
    await withStore('readwrite', (store) => store.add(punch));
  } catch (err) {
    ui.toast('Storage request failed');
    throw err;
  }
};

const put = async (punch) => {
  try {
    await withStore('readwrite', (store) => store.put(punch));
  } catch (err) {
    ui.toast('Storage request failed');
    throw err;
  }
};

const remove = async (id) => {
  try {
    await withStore('readwrite', (store) => store.delete(id));
  } catch (err) {
    ui.toast('Storage request failed');
    throw err;
  }
};

const all = async () => {
  try {
    return await openDb().then((db) =>
      new Promise((resolve, reject) => {
        const tx = db.transaction('punches', 'readonly');
        const store = tx.objectStore('punches');
        const req = store.getAll();
        req.onsuccess = () => resolve(req.result || []);
        req.onerror = () => reject(req.error);
      }).finally(() => db.close())
    );
  } catch (err) {
    ui.toast('Storage request failed');
    throw err;
  }
};

export const idb = { add, put, remove, all };

