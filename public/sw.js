// Full TV Streams - Service Worker for PWA & Smart TV
const CACHE_NAME = "fulltv-cache-v1";

self.addEventListener("install", (event) => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener("fetch", (event) => {
  // Pass through fetch for video streams and API
  event.respondWith(fetch(event.request).catch(() => caches.match(event.request)));
});
