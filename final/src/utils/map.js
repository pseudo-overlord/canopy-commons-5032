export function validCoordinates(longitude, latitude) {
  return (
    typeof longitude === "number" &&
    Number.isFinite(longitude) &&
    Math.abs(longitude) <= 180 &&
    typeof latitude === "number" &&
    Number.isFinite(latitude) &&
    Math.abs(latitude) <= 90
  );
}
export function melbourneCoordinates(longitude, latitude) {
  return (
    validCoordinates(longitude, latitude) &&
    longitude >= 144.4 &&
    longitude <= 145.6 &&
    latitude >= -38.3 &&
    latitude <= -37.3
  );
}
export function validateMapConfig(data) {
  for (const field of ["searchUrl", "routeUrl", "tileUrl"]) {
    const url = new URL(data?.[field]);
    if (
      url.protocol !== "https:" ||
      url.username ||
      url.password ||
      url.hash ||
      url.search
    )
      throw new Error("Invalid map service settings.");
  }
  if (!["{z}", "{x}", "{y}"].every((part) => data.tileUrl.includes(part)))
    throw new Error("Invalid map tile settings.");
  return data;
}
export function parsePlaces(data) {
  if (!Array.isArray(data?.features))
    throw new Error("The place service returned unusable results.");
  return data.features.slice(0, 5).flatMap((feature, index) => {
    const coordinates = feature?.geometry?.coordinates;
    if (
      feature?.geometry?.type !== "Point" ||
      !Array.isArray(coordinates) ||
      !melbourneCoordinates(...coordinates)
    )
      return [];
    const p = feature.properties;
    if (!p || typeof p.name !== "string" || !p.name.trim()) return [];
    const label = [
      ...new Set(
        [p.name, p.street, p.city || p.district, p.state].filter(
          (value) => typeof value === "string" && value.trim(),
        ),
      ),
    ]
      .join(", ")
      .slice(0, 400);
    return [
      {
        id: `${p.osm_type || "place"}-${p.osm_id || index}`,
        label,
        longitude: coordinates[0],
        latitude: coordinates[1],
      },
    ];
  });
}
export function parseRoute(data) {
  if (data?.code === "NoRoute" || data?.code === "NoSegment")
    throw new Error(
      "No driving route was found between these places. Try another starting place.",
    );
  const route = data?.routes?.[0];
  if (
    data?.code !== "Ok" ||
    !route ||
    !Number.isFinite(route.distance) ||
    route.distance < 0 ||
    !Number.isFinite(route.duration) ||
    route.duration < 0 ||
    route.geometry?.type !== "LineString" ||
    !Array.isArray(route.geometry.coordinates) ||
    route.geometry.coordinates.length < 2 ||
    route.geometry.coordinates.length > 20000 ||
    route.geometry.coordinates.some(
      (point) =>
        !Array.isArray(point) ||
        point.length !== 2 ||
        !validCoordinates(...point),
    )
  ) {
    throw new Error("The routing service returned unusable trip information.");
  }
  return {
    distance: route.distance,
    duration: route.duration,
    coordinates: route.geometry.coordinates,
  };
}
export function tripDistance(metres) {
  return metres < 1000
    ? `${Math.round(metres)} m`
    : `${(metres / 1000).toFixed(1)} km`;
}
export function tripDuration(seconds) {
  const minutes = Math.max(1, Math.ceil(seconds / 60));
  return minutes < 60
    ? `${minutes} min`
    : `${Math.floor(minutes / 60)} hr ${minutes % 60} min`;
}
// Lets the page ignore a slow reply that arrives after a newer search started.
export function requestSlot() {
  let version = 0;
  let controller;
  return {
    start() {
      controller?.abort();
      controller = new AbortController();
      const signal = controller.signal,
        current = ++version;
      return { signal, current: () => current === version && !signal.aborted };
    },
    cancel() {
      version++;
      controller?.abort();
    },
  };
}
