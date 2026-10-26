// Written as a function so the test runs the same worker code that ships.
export function offlineWorker(manifest) {
  const prefix = "canopy-public-v1-",
    cacheName = prefix + manifest.version,
    metaPath = "/__canopy_offline_metadata__";
  const paths = new Set(manifest.paths);
  async function prepare() {
    const cache = await caches.open(cacheName);
    const preparedAt = new Date().toISOString();
    for (const path of manifest.paths) {
      const response = await fetch(
        new Request(path, { cache: "reload", credentials: "omit" }),
      );
      if (!response.ok || response.redirected || response.type === "opaque")
        throw Error("A public download failed.");
      const headers = new Headers(response.headers);
      headers.set("X-Canopy-Cached-At", preparedAt);
      await cache.put(
        path,
        new Response(await response.arrayBuffer(), { status: 200, headers }),
      );
    }
    await cache.put(
      metaPath,
      new Response(
        JSON.stringify({
          version: manifest.version,
          preparedAt,
          activityCount: manifest.activityCount,
        }),
        { headers: { "Content-Type": "application/json" } },
      ),
    );
  }
  async function match(path) {
    return (await caches.has(cacheName))
      ? (await caches.open(cacheName)).match(path)
      : undefined;
  }
  async function status() {
    const meta = await match(metaPath);
    if (!meta) return { ready: false };
    for (const path of manifest.paths)
      if (!(await match(path))) return { ready: false };
    return { ready: true, ...(await meta.json()) };
  }
  self.addEventListener("install", (event) => {
    event.waitUntil(
      prepare().catch(async (error) => {
        await caches.delete(cacheName);
        throw error;
      }),
    );
  });
  self.addEventListener("activate", (event) => {
    event.waitUntil(
      (async () => {
        for (const name of await caches.keys())
          if (name.startsWith(prefix) && name !== cacheName)
            await caches.delete(name);
        await self.clients.claim();
      })(),
    );
  });
  self.addEventListener("message", (event) => {
    if (
      !event.source?.url ||
      new URL(event.source.url).origin !== self.location.origin
    )
      return;
    if (event.data?.type === "ACTIVATE_UPDATE") {
      event.waitUntil(self.skipWaiting());
      return;
    }
    if (!["STATUS", "PREPARE"].includes(event.data?.type)) return;
    event.waitUntil(
      (async () => {
        try {
          if (event.data.type === "PREPARE") await prepare();
          event.ports?.[0]?.postMessage(await status());
        } catch {
          event.ports?.[0]?.postMessage({
            ready: false,
            error:
              "The public download could not be completed. Reconnect and retry.",
          });
        }
      })(),
    );
  });
  self.addEventListener("fetch", (event) => {
    const request = event.request,
      url = new URL(request.url);
    // Only handle the public pages. Logged in requests, other sites and
    // downloads go straight to the network.
    if (
      request.method !== "GET" ||
      url.origin !== self.location.origin ||
      request.headers.has("Authorization")
    )
      return;
    if (request.mode === "navigate") {
      event.respondWith(
        (async () => {
          try {
            return await fetch(request, {
              cache: "no-store",
              signal: AbortSignal.timeout(4000),
            });
          } catch {
            return (
              (await match("/offline.html")) ||
              new Response(
                "Offline copy unavailable. Reconnect and prepare the public offline library.",
                { status: 503, headers: { "Content-Type": "text/plain" } },
              )
            );
          }
        })(),
      );
      return;
    }
    if (url.search || !paths.has(url.pathname)) return;
    event.respondWith(
      (async () => (await match(url.pathname)) || fetch(request))(),
    );
  });
}
export function workerSource(manifest) {
  return `/* Public-only Canopy offline library. Generated at build time. */\n(${offlineWorker.toString()})(${JSON.stringify(manifest)});\n`;
}
