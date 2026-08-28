const CACHE_PREFIX = "finplan-";
const CACHE_NAME = `${CACHE_PREFIX}v1`;
const BASE_PATH = "/finplan";
const PRECACHE_URLS = [
  `${BASE_PATH}/en/`,
  `${BASE_PATH}/th/`,
  `${BASE_PATH}/manifest.webmanifest`,
  `${BASE_PATH}/icon.svg`,
  `${BASE_PATH}/og-image.png`,
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => cache.addAll(PRECACHE_URLS))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter(
              (key) => key.startsWith(CACHE_PREFIX) && key !== CACHE_NAME
            )
            .map((key) => caches.delete(key))
        )
      )
      .then(() => self.clients.claim())
  );
});

async function cacheResponse(request, response) {
  if (response.ok) {
    const cache = await caches.open(CACHE_NAME);
    await cache.put(request, response.clone());
  }
  return response;
}

async function networkFirst(request, fallbackUrl) {
  try {
    const response = await fetch(request);
    return await cacheResponse(request, response);
  } catch {
    const cached = await caches.match(request);
    if (cached) return cached;
    if (fallbackUrl) {
      const fallback = await caches.match(fallbackUrl);
      if (fallback) return fallback;
    }
    throw new Error("FinPlan resource is unavailable offline");
  }
}

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;
  if (!url.pathname.startsWith(`${BASE_PATH}/`)) return;

  if (request.mode === "navigate") {
    const fallback = url.pathname.startsWith(`${BASE_PATH}/th`)
      ? `${BASE_PATH}/th/`
      : `${BASE_PATH}/en/`;
    event.respondWith(networkFirst(request, fallback));
    return;
  }

  event.respondWith(networkFirst(request));
});
