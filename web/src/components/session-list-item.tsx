'use client';
import Link from 'next/link';
import { MouseEvent, PointerEvent, useState } from 'react';
import { Product, Session } from '../types';
import { ordenarPorMelhorPreco } from '../domain/ranking';

interface SessionListItemProps {
  session: Session;
  produtos: Product[];
  onDelete: (id: string) => void;
}

const LIMITE_SWIPE = 80;

export function SessionListItem({ session, produtos, onDelete }: SessionListItemProps) {
  const melhor = ordenarPorMelhorPreco(produtos)[0];
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
      onDelete(session.id);
    }
    setArrastoX(0);
    setInicioX(null);
  }

  function handleDeleteClick(e: MouseEvent<HTMLButtonElement>) {
    e.preventDefault();
    e.stopPropagation();
    onDelete(session.id);
  }

  return (
    <div
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      style={{ transform: `translateX(${arrastoX}px)` }}
      className="flex items-center justify-between border-b p-4 transition-transform"
    >
      <Link href={`/session/${session.id}`} className="flex flex-1 items-center justify-between">
        <div>
          <p className="font-medium">{session.categoria}</p>
          <p className="text-sm text-gray-500">
            {produtos.length} {produtos.length === 1 ? 'produto' : 'produtos'}
          </p>
        </div>
        {melhor && <p className="text-sm font-semibold text-green-600">R$ {melhor.precoUnidadeBase.toFixed(2)}</p>}
      </Link>
      <button type="button" onClick={handleDeleteClick} aria-label={`Remover ${session.categoria}`} className="ml-4 text-red-600">
        Remover
      </button>
    </div>
  );
}
