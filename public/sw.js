// Service worker mínimo para la PWA de Encuentrame.
// Habilita la instalación ("Agregar a pantalla de inicio") y una estrategia
// de caché conservadora: network-first para navegación, con fallback a caché.
// NO cachea respuestas de Supabase/API para no servir datos obsoletos.

const CACHE = 'encuentrame-v1'
const APP_SHELL = ['/', '/buscar', '/recomendar']

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE).then((cache) => cache.addAll(APP_SHELL)).catch(() => {})
  )
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
    )
  )
  self.clients.claim()
})

self.addEventListener('fetch', (event) => {
  const { request } = event

  // Solo GET del mismo origen; nunca interceptar auth/API/supabase.
  if (request.method !== 'GET') return
  const url = new URL(request.url)
  if (url.origin !== self.location.origin) return
  if (url.pathname.startsWith('/api') || url.pathname.startsWith('/auth')) return

  // Network-first: intenta la red; si falla (offline), usa caché.
  event.respondWith(
    fetch(request)
      .then((response) => {
        const copy = response.clone()
        caches.open(CACHE).then((cache) => cache.put(request, copy)).catch(() => {})
        return response
      })
      .catch(() => caches.match(request).then((cached) => cached || caches.match('/')))
  )
})
