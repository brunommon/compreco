/// <reference lib="webworker" />
import { defaultCache } from '@serwist/next/worker';
import { Serwist } from 'serwist';
import type { PrecacheEntry, SerwistGlobalConfig } from 'serwist';

declare global {
  interface WorkerGlobalScope extends SerwistGlobalConfig {
    __SW_MANIFEST: (PrecacheEntry | string)[] | undefined;
  }
}
declare const self: ServiceWorkerGlobalScope;

const serwist = new Serwist({
  precacheEntries: self.__SW_MANIFEST,
  skipWaiting: true,
  clientsClaim: true,
  navigationPreload: true,
  runtimeCaching: defaultCache,
  // Sem isso, uma navegação (ex: /session/[id]) nunca antes carregada com internet
  // falha offline sem nenhuma resposta — mostra o erro nativo "sem conexão" do
  // navegador em vez de uma tela da própria PWA. offline.html é um asset estático
  // de public/, então entra no precache do manifesto automaticamente.
  fallbacks: {
    entries: [{ url: '/offline.html', matcher: ({ request }) => request.destination === 'document' }],
  },
});

serwist.addEventListeners();
