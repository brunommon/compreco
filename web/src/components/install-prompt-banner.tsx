'use client';
import { useEffect, useState } from 'react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
}

function ehIOSSafari(): boolean {
  if (typeof navigator === 'undefined') return false;
  const ua = navigator.userAgent;
  const iOS = /iPad|iPhone|iPod/.test(ua);
  const standalone = 'standalone' in navigator && (navigator as { standalone?: boolean }).standalone;
  return iOS && !standalone;
}

export function InstallPromptBanner() {
  const [evento, setEvento] = useState<BeforeInstallPromptEvent | null>(null);
  const [mostrarIOS, setMostrarIOS] = useState(false);
  const [fechado, setFechado] = useState(false);

  useEffect(() => {
    function aoDisponibilizar(e: Event) {
      e.preventDefault();
      setEvento(e as BeforeInstallPromptEvent);
    }
    window.addEventListener('beforeinstallprompt', aoDisponibilizar);
    setMostrarIOS(ehIOSSafari());
    return () => window.removeEventListener('beforeinstallprompt', aoDisponibilizar);
  }, []);

  if (fechado || (!evento && !mostrarIOS)) return null;

  return (
    <div className="flex items-center justify-between bg-blue-50 p-3 text-sm">
      {evento ? (
        <>
          <span>Instale o ComPreco pra abrir direto da tela inicial.</span>
          <button
            type="button"
            className="font-semibold text-blue-600"
            onClick={async () => {
              await evento.prompt();
              setEvento(null);
            }}
          >
            Instalar
          </button>
        </>
      ) : (
        <span>No iPhone: toque em compartilhar e depois em &quot;Adicionar à Tela de Início&quot;.</span>
      )}
      <button type="button" aria-label="Fechar aviso" onClick={() => setFechado(true)} className="ml-2 text-gray-500">
        ×
      </button>
    </div>
  );
}
