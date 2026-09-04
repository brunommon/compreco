import { Storage } from './types';
import { InMemoryStorage } from './in-memory-storage';
import { IndexedDbStorage } from './indexeddb-storage';

let storagePromise: Promise<Storage> | null = null;

export function getStorage(): Promise<Storage> {
  if (!storagePromise) {
    storagePromise = IndexedDbStorage.open().catch((erro) => {
      console.error('IndexedDB indisponível, usando storage em memória', erro);
      return new InMemoryStorage();
    });
  }
  return storagePromise;
}

/** Só pra teste: força recriar a promise entre casos. */
export function resetStorageForTests(): void {
  storagePromise = null;
}
