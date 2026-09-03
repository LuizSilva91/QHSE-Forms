let db;

export function configureStorage(database) {
  db = database;
}

export function openDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open("qhse-local-forms", 2);
    request.onupgradeneeded = () => {
      if (!request.result.objectStoreNames.contains("records")) {
        request.result.createObjectStore("records", { keyPath: "id" });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

function store(mode = "readonly") {
  if (!db) throw new Error("Storage has not been initialised.");
  return db.transaction("records", mode).objectStore("records");
}

export function all() {
  return new Promise((resolve, reject) => {
    const request = store().getAll();
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export function put(value) {
  return new Promise((resolve, reject) => {
    const request = store("readwrite").put(value);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export function del(id) {
  return new Promise((resolve, reject) => {
    const request = store("readwrite").delete(id);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}
