import type { Metadata, Viewport } from 'next';
import { BottomNav } from '../components/bottom-nav';
import './globals.css';

export const metadata: Metadata = {
  title: 'ComPreco',
  description: 'Compara preço de produtos por unidade de medida',
  manifest: '/manifest.json',
};

export const viewport: Viewport = {
  themeColor: '#2563eb',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body className="pb-16">
        {children}
        <BottomNav />
      </body>
    </html>
  );
}
