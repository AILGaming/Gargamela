// Гаргамела: Меме Хайка — service worker (offline play + installability)
const VERSION = 'gargamela-v1';
const CORE = [
  './', './index.html', './manifest.webmanifest',
  './assets/gargamela.jpg', './assets/elf-logo.png',
  './assets/icons/icon-192.png', './assets/icons/icon-512.png',
  './assets/hosts/host1.jpg', './assets/hosts/host2.jpg', './assets/hosts/host3.jpg', './assets/hosts/host4.jpg', './assets/hosts/host5.jpg',
  './assets/bosses/base1.png', './assets/bosses/base2.png', './assets/bosses/base3.png', './assets/bosses/base4.png',
  'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js',
];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(VERSION).then(c => Promise.allSettled(CORE.map(u => c.add(u)))).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== VERSION).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET' || req.headers.has('range')) return;           // music streams with Range requests
  const url = new URL(req.url);
  if (/googletagmanager|google-analytics|doubleclick/.test(url.hostname)) return; // analytics: always live
  if (req.mode === 'navigate') {                                          // the page itself: fresh when online
    e.respondWith(fetch(req).then(res => { const copy = res.clone(); caches.open(VERSION).then(c => c.put('./', copy)); return res; })
      .catch(() => caches.match('./')));
    return;
  }
  e.respondWith(caches.match(req).then(hit => {                           // everything else: cache first, refresh in background
    const net = fetch(req).then(res => {
      if (res && (res.ok || res.type === 'opaque')) { const copy = res.clone(); caches.open(VERSION).then(c => c.put(req, copy)); }
      return res;
    }).catch(() => hit);
    return hit || net;
  }));
});
