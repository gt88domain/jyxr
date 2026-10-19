import {appConfig} from './app-config';
export interface SaveSlot { version: 1; packId?: string; savedAt: string; name: string; level: number; map: string; data: string; }

export async function readProfile(packId: string): Promise<string | undefined> {
  const db = await open();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('saves', 'readonly');
    const request = tx.objectStore('saves').get(`profile:${packId}`);
    request.onsuccess = () => resolve(request.result as string | undefined);
    request.onerror = () => reject(request.error);
    tx.oncomplete = () => db.close();
    tx.onabort = () => {db.close(); reject(tx.error);};
  });
}

export async function writeProfile(packId: string, data: string): Promise<void> {
  const db = await open();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('saves', 'readwrite');
    tx.objectStore('saves').put(data, `profile:${packId}`);
    tx.oncomplete = () => {db.close(); resolve();};
    tx.onabort = () => {db.close(); reject(tx.error);};
    tx.onerror = () => reject(tx.error);
  });
}
function open(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(appConfig.database, 1);
    request.onupgradeneeded = () => request.result.createObjectStore('saves');
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}
export async function readManualSlot(packId = 'jyx'): Promise<SaveSlot | undefined> {
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
export async function readAutoSlot(packId = 'jyx'): Promise<SaveSlot | undefined> {
  const db=await open();
  return new Promise((resolve,reject)=>{
    const tx=db.transaction('saves','readonly');
    const request=tx.objectStore('saves').get(`auto:${packId}`);
    request.onsuccess=()=>resolve(request.result as SaveSlot|undefined);
    request.onerror=()=>reject(request.error);
    tx.oncomplete=()=>db.close();tx.onabort=()=>{db.close();reject(tx.error);};
  });
}
export async function readSlot(packId = 'jyx'): Promise<SaveSlot | undefined> {
  const [manual,automatic]=await Promise.all([readManualSlot(packId),readAutoSlot(packId)]);
  if(!automatic)return manual;if(!manual)return automatic;
  return Date.parse(automatic.savedAt)>Date.parse(manual.savedAt)?automatic:manual;
}
export async function writeAutoSlot(slot: SaveSlot): Promise<void> {
  const db=await open();
  return new Promise((resolve,reject)=>{
    const tx=db.transaction('saves','readwrite');
    tx.objectStore('saves').put(slot,`auto:${slot.packId||'jyx'}`);
    tx.oncomplete=()=>{db.close();resolve();};
    tx.onabort=()=>{db.close();reject(tx.error);};tx.onerror=()=>reject(tx.error);
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
