'use client';
import { PointerEvent, useState } from 'react';
import { Product } from '../types';
import { unidadeBase } from '../domain/units';

interface ProductCardProps {
  product: Product;
  melhor: boolean;
  onDelete: (id: string) => void;
}

const LIMITE_SWIPE = 80;

export function ProductCard({ product, melhor, onDelete }: ProductCardProps) {
  const [arrastoX, setArrastoX] = useState(0);
  const [inicioX, setInicioX] = useState<number | null>(null);

  function handlePointerDown(e: PointerEvent<HTMLDivElement>) {
    setInicioX(e.clientX);
  }

  function handlePointerMove(e: PointerEvent<HTMLDivElement>) {
    if (inicioX === null) return;
    setArrastoX(Math.min(0, e.clientX - inicioX));
  }

  function handlePointerUp() {
    if (arrastoX <= -LIMITE_SWIPE) {
      onDelete(product.id);
    }
    setArrastoX(0);
    setInicioX(null);
  }

  function handlePointerCancel() {
    setArrastoX(0);
    setInicioX(null);
  }

  return (
    <div
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerCancel}
      style={{ transform: `translateX(${arrastoX}px)`, touchAction: 'pan-y' }}
      className={`flex items-center justify-between border-b p-4 transition-transform ${melhor ? 'bg-green-50' : ''}`}
    >
      <div>
        {melhor && (
          <span className="mb-1 inline-block rounded bg-green-600 px-2 py-0.5 text-xs text-white">melhor custo</span>
        )}
        <p className="font-medium">{product.nome}</p>
        <p className="text-sm text-gray-500">
          R$ {product.preco.toFixed(2)} · {product.quantidade}
          {product.unidade} · R$ {product.precoUnidadeBase.toFixed(2)}/{unidadeBase(product.unidade)}
        </p>
      </div>
      <button type="button" onClick={() => onDelete(product.id)} aria-label={`Remover ${product.nome}`} className="text-red-600">
        Remover
      </button>
    </div>
  );
}
