'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const ITEMS = [
  { href: '/', label: 'Histórico' },
  { href: '/nova', label: 'Nova' },
] as const;

export function BottomNav() {
  const pathname = usePathname();
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-30 flex border-t bg-white pb-[env(safe-area-inset-bottom)]">
      {ITEMS.map((item) => {
        const active = pathname === item.href;
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`flex-1 py-3 text-center text-sm ${active ? 'font-semibold text-blue-600' : 'text-gray-500'}`}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
