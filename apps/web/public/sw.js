/* WSS Kairós — service worker
   Conservador de propósito: o app é dinâmico e autenticado, então NÃO cacheamos
   páginas nem /api de forma agressiva (evita servir conteúdo de outra sessão).
   - navegações: network-first, com fallback offline só quando sem rede;
   - estáticos (_next/static, ícones, fontes): cache-first (imutáveis por hash). */
const VERSION = "kairos-v1";
const SHELL = `shell-${VERSION}`;
const STATIC = `static-${VERSION}`;
const OFFLINE_URL = "/offline";

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(SHELL).then((c) =>
      c.addAll([OFFLINE_URL, "/icons/icon-192.png", "/manifest.webmanifest"])
    )
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((k) => !k.endsWith(VERSION))
            .map((k) => caches.delete(k))
        )
      )
      .then(() => self.clients.claim())
  );
});

const isStatic = (url) =>
  url.pathname.startsWith("/_next/static/") ||
  url.pathname.startsWith("/icons/") ||
  /\.(?:woff2?|png|svg|ico|jpg|jpeg|webp)$/.test(url.pathname);

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;
  if (url.pathname.startsWith("/api/") || url.pathname.startsWith("/auth/")) return;

  // Estáticos imutáveis: cache-first.
  if (isStatic(url)) {
    event.respondWith(
      caches.match(request).then(
        (hit) =>
          hit ||
          fetch(request).then((res) => {
            const copy = res.clone();
            caches.open(STATIC).then((c) => c.put(request, copy));
            return res;
          })
      )
    );
    return;
  }

  // Navegações: network-first, offline como último recurso.
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request).catch(() =>
        caches.match(request).then((hit) => hit || caches.match(OFFLINE_URL))
      )
    );
  }
});
