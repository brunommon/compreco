'use client';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { getStorage } from '../db/storage-provider';
import { Storage } from '../db/types';
import { Product, Session } from '../types';
import { SessionListItem } from '../components/session-list-item';
import { vibrar } from '../lib/haptics';

export default function HistoricoPage() {
  const [storage, setStorage] = useState<Storage | null>(null);
  const [sessoes, setSessoes] = useState<{ session: Session; produtos: Product[] }[] | null>(null);

  useEffect(() => {
    async function carregar() {
      const storageInstance = await getStorage();
      setStorage(storageInstance);
      const lista = await storageInstance.listSessions();
      const comProdutos = await Promise.all(
        lista.map(async (session) => ({ session, produtos: await storageInstance.listProducts(session.id) }))
      );
      setSessoes(comProdutos);
    }
    carregar();
  }, []);

  async function handleDelete(id: string) {
    if (!storage) return;
    await storage.deleteSession(id);
    setSessoes((atual) => (atual ? atual.filter(({ session }) => session.id !== id) : atual));
    vibrar();
  }

  if (sessoes === null) return null;

  return (
    <main>
      {sessoes.length === 0 ? (
        <p className="p-6 text-center text-gray-500">Nenhuma comparação ainda. Toque em &quot;+&quot; pra começar.</p>
      ) : (
        sessoes.map(({ session, produtos }) => (
          <SessionListItem key={session.id} session={session} produtos={produtos} onDelete={handleDelete} />
        ))
      )}
      <Link
        href="/nova"
        className="fixed bottom-20 right-4 flex h-14 w-14 items-center justify-center rounded-full bg-blue-600 text-2xl text-white shadow-lg"
        aria-label="Nova comparação"
      >
        +
      </Link>
    </main>
  );
}
