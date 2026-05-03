// 赛博华佗 Service Worker
// 基础PWA结构，暂无离线缓存功能
// 可在后续版本中添加离线资源缓存

self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', (event) => {
  // 暂不做缓存，所有请求透传
  event.respondWith(fetch(event.request));
});
