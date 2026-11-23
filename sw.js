// Offline cache for the app shell. Bump VERSION when files change.
const VERSION = 'presidente-v15';
const SHELL = [
  './', 'index.html', 'manifest.webmanifest', 'css/app.css',
  'js/app.js', 'js/game.js', 'js/data.js', 'js/map.js', 'js/map-paths.js', 'js/rules.js',
  'icons/icon.svg', 'icons/logo.svg', 'icons/icon-192.png', 'icons/icon-512.png',
  'icons/icon-maskable-512.png', 'icons/apple-touch-icon.png',
  'icons/favicon.svg', 'icons/favicon-32.png', 'icons/favicon-48.png',
];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(VERSION).then((c) => c.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== VERSION).map((k) => caches.delete(k))))
    .then(() => self.clients.claim()));
});

// Network first (so updates arrive), falling back to the cache when offline.
self.addEventListener('fetch', (e) => {
  if (e.request.method !== 'GET') return;
  e.respondWith(
    fetch(e.request)
      .then((res) => {
        const url = new URL(e.request.url);
        // Cache the app's own files, and the Google Fonts the theme uses so they work offline too.
        const font = url.hostname === 'fonts.googleapis.com' || url.hostname === 'fonts.gstatic.com';
        if ((res.ok && url.origin === location.origin) || (font && (res.ok || res.type === 'opaque'))) {
          const copy = res.clone();
          caches.open(VERSION).then((c) => c.put(e.request, copy));
        }
        return res;
      })
      .catch(() => caches.match(e.request, { ignoreSearch: true }).then((r) => r || caches.match('index.html'))),
  );
});
