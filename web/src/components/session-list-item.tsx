import Link from 'next/link';
import { Product, Session } from '../types';
import { ordenarPorMelhorPreco } from '../domain/ranking';

interface SessionListItemProps {
  session: Session;
  produtos: Product[];
}

export function SessionListItem({ session, produtos }: SessionListItemProps) {
  const melhor = ordenarPorMelhorPreco(produtos)[0];
  return (
    <Link href={`/session/${session.id}`} className="flex items-center justify-between border-b p-4">
      <div>
        <p className="font-medium">{session.categoria}</p>
        <p className="text-sm text-gray-500">
          {produtos.length} {produtos.length === 1 ? 'produto' : 'produtos'}
        </p>
      </div>
      {melhor && <p className="text-sm font-semibold text-green-600">R$ {melhor.precoUnidadeBase.toFixed(2)}</p>}
    </Link>
  );
}
