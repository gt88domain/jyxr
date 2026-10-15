export interface SaveSlot { version: 1; packId?: string; savedAt: string; name: string; level: number; map: string; data: string; }
function open(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('jyxr-web', 1);
    request.onupgradeneeded = () => request.result.createObjectStore('saves');
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}
export async function readSlot(packId = 'jyx'): Promise<SaveSlot | undefined> {
  const db = await open();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction('saves', 'readonly');
    const store = transaction.objectStore('saves');
    const request = store.get(`slot:${packId}`);
    request.onsuccess = () => {
      if (request.result || packId !== 'jyx') resolve(request.result as SaveSlot | undefined);
      else {
        const legacy = store.get('slot-1');
        legacy.onsuccess = () => resolve(legacy.result as SaveSlot | undefined);
        legacy.onerror = () => reject(legacy.error);
      }
    };
    request.onerror = () => reject(request.error);
    transaction.oncomplete = () => db.close();
    transaction.onabort = () => {db.close(); reject(transaction.error);};
  });
}
export async function writeSlot(slot: SaveSlot): Promise<void> {
  const db = await open();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction('saves', 'readwrite');
    transaction.objectStore('saves').put(slot, `slot:${slot.packId || 'jyx'}`);
    transaction.oncomplete = () => {db.close(); resolve();};
    transaction.onabort = () => {db.close(); reject(transaction.error);};
    transaction.onerror = () => reject(transaction.error);
  });
}
