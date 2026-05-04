// SendResqPls Service Worker v2 — Full PWA with offline support
const CACHE_NAME = 'sendresqpls-v2';
const STATIC_CACHE = 'sendresqpls-static-v2';

// Core app shell to precache
const PRECACHE_URLS = [
  '/',
  '/mobile',
  '/mobile/login',
  '/mobile/signup',
  '/mobile/report',
  '/mobile/history',
  '/mobile/profile',
  '/icon-192.png',
  '/icon-512.png',
  '/manifest.json',
];

// ── Install: cache app shell ──────────────────────────────────────────
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(PRECACHE_URLS))
      .then(() => self.skipWaiting())
  );
});

// ── Activate: clean old caches ────────────────────────────────────────
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((k) => k !== CACHE_NAME && k !== STATIC_CACHE)
          .map((k) => caches.delete(k))
      )
    ).then(() => self.clients.claim())
  );
});

// ── Fetch: smart caching strategy ────────────────────────────────────
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // 1. Skip non-GET and external requests
  if (request.method !== 'GET') return;
  if (!url.origin.includes(self.location.origin) && !url.hostname.includes('fonts.googleapis') && !url.hostname.includes('fonts.gstatic')) return;

  // 2. API calls — network only, no caching
  if (url.pathname.startsWith('/api')) return;

  // 3. Navigation requests (HTML pages) — network first, fallback to cache
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .catch(() => caches.match('/mobile') || caches.match('/'))
    );
    return;
  }

  // 4. Static assets (JS, CSS, fonts, images) — cache first
  event.respondWith(
    caches.match(request).then((cached) => {
      if (cached) return cached;

      return fetch(request).then((response) => {
        if (response && response.status === 200) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
        }
        return response;
      }).catch(() => {
        // Return offline fallback for images
        if (request.destination === 'image') {
          return caches.match('/icon-192.png');
        }
      });
    })
  );
});

// ── Push Notifications ────────────────────────────────────────────────
self.addEventListener('push', (event) => {
  const data = event.data?.json() || {};
  const title = data.title || 'SendResqPls';
  const options = {
    body: data.body || 'You have a new notification.',
    icon: '/icon-192.png',
    badge: '/icon-192.png',
    vibrate: [200, 100, 200],
    data: { url: data.url || '/mobile' },
    actions: [
      { action: 'view', title: 'View Update' },
      { action: 'dismiss', title: 'Dismiss' },
    ],
  };
  event.waitUntil(self.registration.showNotification(title, options));
});

// ── Notification Click ────────────────────────────────────────────────
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  if (event.action === 'dismiss') return;

  const targetUrl = event.notification.data?.url || '/mobile';
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url.includes(targetUrl) && 'focus' in client) {
          return client.focus();
        }
      }
      return clients.openWindow(targetUrl);
    })
  );
});
