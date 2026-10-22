/**
 * Feito de Nós — service worker
 *
 * O site é um app de uma pagina só. O service worker existe para:
 *  - deixar o app instalavel (o "atalho do Google" / "Instalar aplicativo")
 *  - abrir o app mesmo sem internet, mostrando os ultimos dados salvos
 *
 * Regra importante: nada do banco compartilhado e guardado aqui. As chamadas
 * para o Apps Script (script.google.com) passam direto, sem cache.
 */

const CACHE = 'feito-de-nos-v1';
const SHELL = [
  '/',
  '/index.html',
  '/config.js',
  '/icons/icon-192.png',
  '/icons/icon-512.png',
  '/icons/favicon-32.png',
  '/favicon.ico'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE)
      .then(cache => cache.addAll(SHELL))
      .then(() => self.skipWaiting())
      .catch(() => self.skipWaiting())
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  const req = event.request;
  if(req.method !== 'GET') return;

  const url = new URL(req.url);
  // fora do proprio site (banco compartilhado, etc.) deixa passar direto
  if(url.origin !== self.location.origin) return;

  event.respondWith(
    // rede primeiro para o conteudo ficar sempre atualizado
    fetch(req).then(res => {
      if(res && res.ok){
        const copia = res.clone();
        caches.open(CACHE).then(cache => cache.put(req, copia));
      }
      return res;
    }).catch(() => caches.match(req).then(hit => hit || caches.match('/index.html')))
  );
});
