import { InMemoryStorage } from '../in-memory-storage';

jest.mock('../indexeddb-storage', () => ({
  IndexedDbStorage: { open: jest.fn() },
}));

import { IndexedDbStorage } from '../indexeddb-storage';
import { getStorage, resetStorageForTests } from '../storage-provider';

describe('getStorage', () => {
  beforeEach(() => {
    resetStorageForTests();
    jest.clearAllMocks();
  });

  it('usa IndexedDbStorage quando abre com sucesso', async () => {
    const fake = new InMemoryStorage();
    (IndexedDbStorage.open as jest.Mock).mockResolvedValue(fake);

    const storage = await getStorage();

    expect(storage).toBe(fake);
  });

  it('cai pra InMemoryStorage quando IndexedDbStorage falha ao abrir', async () => {
    (IndexedDbStorage.open as jest.Mock).mockRejectedValue(new Error('sem suporte'));

    const storage = await getStorage();

    expect(storage).toBeInstanceOf(InMemoryStorage);
  });

  it('reaproveita a mesma instância em chamadas subsequentes', async () => {
    const fake = new InMemoryStorage();
    (IndexedDbStorage.open as jest.Mock).mockResolvedValue(fake);

    const primeira = await getStorage();
    const segunda = await getStorage();

    expect(primeira).toBe(segunda);
    expect(IndexedDbStorage.open).toHaveBeenCalledTimes(1);
  });
});
