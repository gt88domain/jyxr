export interface SaveSlot { version: 1; savedAt: string; name: string; level: number; map: string; data: string; }
function open(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('jyxr-web', 1);
    request.onupgradeneeded = () => request.result.createObjectStore('saves');
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}
export async function readSlot(): Promise<SaveSlot | undefined> {
  const db = await open();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction('saves', 'readonly');
    const request = transaction.objectStore('saves').get('slot-1');
    request.onsuccess = () => resolve(request.result as SaveSlot | undefined);
    request.onerror = () => reject(request.error);
    transaction.oncomplete = () => db.close();
    transaction.onabort = () => {db.close(); reject(transaction.error);};
  });
}
export async function writeSlot(slot: SaveSlot): Promise<void> {
  const db = await open();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction('saves', 'readwrite');
    transaction.objectStore('saves').put(slot, 'slot-1');
    transaction.oncomplete = () => {db.close(); resolve();};
    transaction.onabort = () => {db.close(); reject(transaction.error);};
    transaction.onerror = () => reject(transaction.error);
  });
}
