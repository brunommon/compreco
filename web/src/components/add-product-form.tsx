'use client';
import { FormEvent, useState } from 'react';
import { ProductInput, Unit } from '../types';
import { validarProduto } from '../domain/validation';
import { UnitPicker } from './unit-picker';

interface AddProductFormProps {
  onSubmit: (input: ProductInput) => void;
  onCancel: () => void;
}

export function AddProductForm({ onSubmit, onCancel }: AddProductFormProps) {
  const [nome, setNome] = useState('');
  const [preco, setPreco] = useState('');
  const [quantidade, setQuantidade] = useState('');
  const [unidade, setUnidade] = useState<Unit>('kg');
  const [erros, setErros] = useState<Record<string, string>>({});

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const input = { nome, preco: Number(preco), quantidade: Number(quantidade) };
    const listaErros = validarProduto(input);
    if (listaErros.length > 0) {
      setErros(Object.fromEntries(listaErros.map((err) => [err.campo, err.mensagem])));
      return;
    }
    onSubmit({ ...input, unidade });
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="fixed inset-x-0 bottom-0 z-40 rounded-t-2xl bg-white p-4 pb-[max(1rem,env(safe-area-inset-bottom))] shadow-2xl"
    >
      <label htmlFor="nome" className="mb-1 block text-sm text-gray-600">
        Produto
      </label>
      <input id="nome" value={nome} onChange={(e) => setNome(e.target.value)} className="mb-1 w-full rounded border p-3" />
      {erros.nome && <p className="mb-2 text-sm text-red-600">{erros.nome}</p>}

      <label htmlFor="preco" className="mb-1 block text-sm text-gray-600">
        Preço (R$)
      </label>
      <input
        id="preco"
        inputMode="decimal"
        value={preco}
        onChange={(e) => setPreco(e.target.value)}
        className="mb-1 w-full rounded border p-3"
      />
      {erros.preco && <p className="mb-2 text-sm text-red-600">{erros.preco}</p>}

      <label htmlFor="quantidade" className="mb-1 block text-sm text-gray-600">
        Quantidade
      </label>
      <input
        id="quantidade"
        inputMode="decimal"
        value={quantidade}
        onChange={(e) => setQuantidade(e.target.value)}
        className="mb-1 w-full rounded border p-3"
      />
      {erros.quantidade && <p className="mb-2 text-sm text-red-600">{erros.quantidade}</p>}

      <UnitPicker value={unidade} onChange={setUnidade} />

      <div className="mt-4 flex gap-2">
        <button type="button" onClick={onCancel} className="flex-1 rounded border p-3">
          Cancelar
        </button>
        <button type="submit" className="flex-1 rounded bg-blue-600 p-3 font-semibold text-white">
          Salvar
        </button>
      </div>
    </form>
  );
}
