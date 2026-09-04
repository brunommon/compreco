'use client';
import { useRouter } from 'next/navigation';
import { FormEvent, useState } from 'react';
import { getStorage } from '../../db/storage-provider';
import { validarCategoria } from '../../domain/validation';

export default function NovaSessaoPage() {
  const router = useRouter();
  const [categoria, setCategoria] = useState('');
  const [erro, setErro] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const erros = validarCategoria(categoria);
    if (erros.length > 0) {
      setErro(erros[0].mensagem);
      return;
    }
    const storage = await getStorage();
    const sessao = await storage.createSession(categoria.trim());
    router.push(`/session/${sessao.id}`);
  }

  return (
    <main className="p-4">
      <h1 className="mb-4 text-lg font-semibold">Nova comparação</h1>
      <form onSubmit={handleSubmit}>
        <label htmlFor="categoria" className="mb-1 block text-sm text-gray-600">
          Categoria (ex: arroz)
        </label>
        <input
          id="categoria"
          value={categoria}
          onChange={(e) => setCategoria(e.target.value)}
          className="w-full rounded border p-3 text-base"
        />
        {erro && <p className="mt-1 text-sm text-red-600">{erro}</p>}
        <button type="submit" className="mt-4 w-full rounded bg-blue-600 p-3 font-semibold text-white">
          Começar
        </button>
      </form>
    </main>
  );
}
