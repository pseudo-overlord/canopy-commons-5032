import {
  melbourneCoordinates,
  parsePlaces,
  parseRoute,
  validateMapConfig,
} from "../utils/map.js";

export function createMapClient({
  fetchImpl = globalThis.fetch,
  now = () => Date.now(),
  interval = 1200,
} = {}) {
  let configPromise,
    nextStart = 0,
    queue = Promise.resolve();
  const cache = new Map();
  function remember(key, value) {
    if (cache.size >= 50) cache.delete(cache.keys().next().value);
    cache.set(key, { value, expires: now() + 10 * 60 * 1000 });
    return value;
  }
  async function readJson(url, signal) {
    const response = await fetchImpl(url, {
      signal: AbortSignal.any([
        ...(signal ? [signal] : []),
        AbortSignal.timeout(12000),
      ]),
      credentials: "omit",
    });
    if (!response.ok)
      throw new Error(
        response.status === 429
          ? "The map service is busy. Please try again shortly."
          : "The map service is unavailable. Please retry.",
      );
    return response.json();
  }
  function config() {
    if (!configPromise)
      configPromise = readJson("/map-config.json")
        .then(validateMapConfig)
        .catch((error) => {
          configPromise = undefined;
          throw error;
        });
    return configPromise;
  }
  async function request(key, url, parse, signal) {
    signal?.throwIfAborted();
    const stored = cache.get(key);
    if (stored && stored.expires > now()) return stored.value;
    const task = queue
      .catch(() => {})
      .then(async () => {
        const wait = Math.max(0, nextStart - now());
        if (wait) await new Promise((resolve) => setTimeout(resolve, wait));
        signal?.throwIfAborted();
        nextStart = now() + interval;
        const result = parse(await readJson(url, signal));
        signal?.throwIfAborted();
        return remember(key, result);
      });
    queue = task.then(
      () => {},
      () => {},
    );
    return task;
  }
  return {
    config,
    clearCache() {
      cache.clear();
    },
    async search(query, signal) {
      const clean = query.trim();
      if (clean.length < 3 || clean.length > 120)
        throw new Error("Enter a place name between 3 and 120 characters.");
      const settings = await config();
      const url = new URL(settings.searchUrl);
      url.search = new URLSearchParams({
        q: clean,
        limit: "5",
        bbox: "144.4,-38.3,145.6,-37.3",
        countrycode: "AU",
        lang: "en",
      });
      return request(
        `search:${clean.toLowerCase()}`,
        url.toString(),
        parsePlaces,
        signal,
      );
    },
    async route(origin, destination, signal) {
      if (
        ![origin, destination].every((point) =>
          melbourneCoordinates(point?.longitude, point?.latitude),
        )
      )
        throw new Error(
          "Choose a starting place and an activity in Greater Melbourne.",
        );
      const settings = await config();
      const points = [origin, destination]
        .map(
          (point) =>
            `${point.longitude.toFixed(6)},${point.latitude.toFixed(6)}`,
        )
        .join(";");
      const url = `${settings.routeUrl}/${points}?overview=full&geometries=geojson&steps=false&alternatives=false`;
      return request(`route:${points}`, url, parseRoute, signal);
    },
  };
}
export const mapClient = createMapClient();
