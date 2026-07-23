import { create } from 'zustand';
import { Product, ProductInput, Session } from '../types';
import { Storage } from '../db/types';
import { ordenarPorMelhorPreco } from '../domain/ranking';

interface SessionState {
  storage: Storage | null;
  activeSession: Session | null;
  products: Product[];
  setStorage: (storage: Storage) => void;
  loadSession: (sessionId: string) => Promise<void>;
  addProduct: (input: ProductInput) => Promise<void>;
  removeProduct: (productId: string) => Promise<void>;
}

export const useSessionStore = create<SessionState>((set, get) => ({
  storage: null,
  activeSession: null,
  products: [],

  setStorage: (storage) => set({ storage }),

  loadSession: async (sessionId) => {
    const { storage } = get();
    if (!storage) throw new Error('storage não configurado');
    const [session, products] = await Promise.all([
      storage.getSession(sessionId),
      storage.listProducts(sessionId),
    ]);
    set({ activeSession: session, products: ordenarPorMelhorPreco(products) });
  },

  addProduct: async (input) => {
    const { storage, activeSession, products } = get();
    if (!storage || !activeSession) throw new Error('sessão não carregada');
    const product = await storage.addProduct(activeSession.id, input);
    set({ products: ordenarPorMelhorPreco([...products, product]) });
  },

  removeProduct: async (productId) => {
    const { storage, products } = get();
    if (!storage) throw new Error('storage não configurado');
    await storage.deleteProduct(productId);
    set({ products: products.filter((p) => p.id !== productId) });
  },
}));
