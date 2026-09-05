'use client';
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { getStorage } from '../../../db/storage-provider';
import { useSessionStore } from '../../../store/session-store';
import { ProductCard } from '../../../components/product-card';
import { AddProductForm } from '../../../components/add-product-form';
import { vibrar } from '../../../lib/haptics';

export default function SessaoPage() {
  const { id } = useParams<{ id: string }>();
  const { activeSession, products, setStorage, loadSession, addProduct, removeProduct } = useSessionStore();
  const [mostrarForm, setMostrarForm] = useState(false);

  useEffect(() => {
    async function iniciar() {
      const storage = await getStorage();
      setStorage(storage);
      await loadSession(id);
    }
    iniciar();
  }, [id, setStorage, loadSession]);

  if (!activeSession) return null;

  return (
    <main className="pb-24">
      <h1 className="p-4 text-lg font-semibold">{activeSession.categoria}</h1>

      {products.length === 0 ? (
        <p className="p-6 text-center text-gray-500">Nenhum produto ainda. Toque em &quot;+&quot; pra adicionar.</p>
      ) : (
        products.map((product, index) => (
          <ProductCard
            key={product.id}
            product={product}
            melhor={index === 0}
            onDelete={async (produtoId) => {
              await removeProduct(produtoId);
              vibrar();
            }}
          />
        ))
      )}

      <button
        type="button"
        onClick={() => setMostrarForm(true)}
        className="fixed bottom-20 right-4 flex h-14 w-14 items-center justify-center rounded-full bg-blue-600 text-2xl text-white shadow-lg"
        aria-label="Adicionar produto"
      >
        +
      </button>

      {mostrarForm && (
        <AddProductForm
          onSubmit={async (input) => {
            await addProduct(input);
            vibrar();
            setMostrarForm(false);
          }}
          onCancel={() => setMostrarForm(false)}
        />
      )}
    </main>
  );
}
