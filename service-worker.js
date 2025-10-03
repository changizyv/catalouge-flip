// /service-worker.js
// ساده‌ترین سرویس‌ورکر برای کش فایل‌های اصلی (قابل توسعه به PWA کامل)

const CACHE_NAME = 'catalogue-cache-v1';
const FILES_TO_CACHE = [
  './',
  './index.html',
  './css/style.css',
  './css/book.css',
  './css/components.css',
  './js/app.js',
  './js/config.js',
  './js/utils.js',
  './js/book.js',
  './js/page-manager.js',
  './js/media.js',
  './js/gallery.js',
  './js/flip-sound.js',
  './data/manifest-pages.json'
];

// نصب و کش اولیه
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(FILES_TO_CACHE))
  );
  self.skipWaiting();
});

// فعال‌سازی و حذف کش‌های قدیمی
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keyList) =>
      Promise.all(
        keyList.map((key) => {
          if (key !== CACHE_NAME) return caches.delete(key);
        })
      )
    )
  );
  self.clients.claim();
});

// واکشی از کش
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => response || fetch(event.request))
  );
});
