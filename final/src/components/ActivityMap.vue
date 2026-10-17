<script setup>
import { computed, nextTick, onMounted, onUnmounted, ref, watch } from "vue";
import "leaflet/dist/leaflet.css";
import { mapClient } from "../services/mapClient.js";
import { requestSlot, tripDistance, tripDuration } from "../utils/map.js";

const props = defineProps({ activities: { type: Array, required: true } });
const mapElement = ref(),
  queryInput = ref(),
  query = ref(""),
  results = ref([]),
  searched = ref(false);
const origin = ref(null),
  destinationId = ref(props.activities[0]?.id || ""),
  trip = ref(null);
const searchBusy = ref(false),
  routeBusy = ref(false),
  searchError = ref(""),
  routeError = ref(""),
  mapError = ref("");
const destination = computed(() =>
  props.activities.find((item) => item.id === destinationId.value),
);
const searchChannel = requestSlot(),
  routeChannel = requestSlot();
let L, map, activityLayer, originLayer, routeLayer, resizeObserver;
const failureMessage = (error) =>
  error.name === "TimeoutError"
    ? "The map service timed out. Please retry."
    : error instanceof TypeError
      ? "Could not reach the map service. Check your connection and retry."
      : error.message;

function clearTrip() {
  routeChannel.cancel();
  trip.value = null;
  routeError.value = "";
  routeBusy.value = false;
  routeLayer?.clearLayers();
}
function queryChanged() {
  searchChannel.cancel();
  results.value = [];
  searched.value = false;
  searchError.value = "";
  searchBusy.value = false;
  origin.value = null;
  originLayer?.clearLayers();
  clearTrip();
}
function clearOrigin() {
  query.value = "";
  queryChanged();
  mapClient.clearCache();
  queryInput.value?.focus();
}
function drawActivities() {
  if (!map) return;
  activityLayer.clearLayers();
  props.activities.forEach((activity, index) => {
    const label = document.createElement("span");
    label.textContent = `${activity.title} — ${activity.suburb} (approximate)`;
    const selected = activity.id === destinationId.value;
    const marker = L.marker([activity.latitude, activity.longitude], {
      title: `Select ${activity.title}, ${activity.suburb}`,
      alt: `Activity ${index + 1}: ${activity.title}`,
      icon: L.divIcon({
        className: `canopy-map-pin${selected ? " selected" : ""}`,
        html: `<span>${index + 1}</span>`,
        iconSize: [32, 32],
        iconAnchor: [16, 16],
      }),
    })
      .bindTooltip(label)
      .on("click", () => {
        destinationId.value = activity.id;
      })
      .addTo(activityLayer);
    marker
      .getElement()
      ?.setAttribute(
        "aria-label",
        `Select ${activity.title}, ${activity.suburb}, approximate location`,
      );
  });
}
function fitActivities() {
  if (map && props.activities.length)
    map.fitBounds(
      props.activities.map((item) => [item.latitude, item.longitude]),
      { padding: [30, 30], maxZoom: 13, animate: false },
    );
}
watch(
  () => props.activities,
  () => {
    if (!props.activities.some((item) => item.id === destinationId.value))
      destinationId.value = props.activities[0]?.id || "";
    clearTrip();
    drawActivities();
    fitActivities();
  },
);
watch(destinationId, () => {
  clearTrip();
  drawActivities();
});

async function searchPlaces() {
  if (searchBusy.value) return;
  queryChanged();
  const request = searchChannel.start();
  searchBusy.value = true;
  try {
    const places = await mapClient.search(query.value, request.signal);
    if (!request.current()) return;
    results.value = places;
    searched.value = true;
  } catch (error) {
    if (!request.current()) return;
    searchError.value = failureMessage(error);
    if (query.value.trim().length < 3 || query.value.trim().length > 120) {
      await nextTick();
      queryInput.value?.focus();
    }
  } finally {
    if (request.current()) searchBusy.value = false;
  }
}
function chooseOrigin(place) {
  origin.value = place;
  clearTrip();
  originLayer?.clearLayers();
  if (map) {
    const label = document.createElement("span");
    label.textContent = `Starting place: ${place.label}`;
    L.circleMarker([place.latitude, place.longitude], {
      radius: 8,
      color: "#133d71",
      fillColor: "#ffffff",
      fillOpacity: 1,
      weight: 3,
    })
      .bindTooltip(label)
      .addTo(originLayer);
    if (destination.value)
      map.fitBounds(
        [
          [place.latitude, place.longitude],
          [destination.value.latitude, destination.value.longitude],
        ],
        { padding: [40, 40], maxZoom: 14, animate: false },
      );
  }
}
async function calculateRoute() {
  if (routeBusy.value || !origin.value || !destination.value) return;
  clearTrip();
  const request = routeChannel.start();
  routeBusy.value = true;
  try {
    const result = await mapClient.route(
      origin.value,
      destination.value,
      request.signal,
    );
    if (!request.current()) return;
    trip.value = result;
    if (map) {
      const line = L.polyline(
        result.coordinates.map(([longitude, latitude]) => [
          latitude,
          longitude,
        ]),
        { color: "#184f96", weight: 5 },
      ).addTo(routeLayer);
      map.fitBounds(line.getBounds(), { padding: [30, 30], animate: false });
    }
  } catch (error) {
    if (request.current()) routeError.value = failureMessage(error);
  } finally {
    if (request.current()) routeBusy.value = false;
  }
}
onMounted(async () => {
  try {
    const [leaflet, settings] = await Promise.all([
      import("leaflet"),
      mapClient.config(),
    ]);
    if (!mapElement.value) return;
    L = leaflet.default;
    map = L.map(mapElement.value, { scrollWheelZoom: false }).setView(
      [-37.8136, 144.9631],
      10,
    );
    activityLayer = L.layerGroup().addTo(map);
    originLayer = L.layerGroup().addTo(map);
    routeLayer = L.layerGroup().addTo(map);
    L.tileLayer(settings.tileUrl, {
      maxZoom: 18,
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap contributors</a>',
    })
      .on("tileerror", () => {
        mapError.value =
          "Some map tiles could not load. You can still use place search, the activity selector and the text trip summary.";
      })
      .addTo(map);
    resizeObserver = new ResizeObserver(() =>
      map?.invalidateSize({ animate: false }),
    );
    resizeObserver.observe(mapElement.value);
    drawActivities();
    fitActivities();
  } catch {
    mapError.value =
      "The map could not load. Activity cards and text trip planning remain available. Close and reopen the planner to retry the map.";
  }
});
onUnmounted(() => {
  searchChannel.cancel();
  routeChannel.cancel();
  resizeObserver?.disconnect();
  map?.remove();
  map = undefined;
});
</script>

<template>
  <section
    id="activity-trip-planner"
    class="card card-body mb-4"
    aria-labelledby="trip-heading"
  >
    <h2 id="trip-heading" class="h4">Plan a trip to an activity</h2>
    <p>
      Search for a starting place in Greater Melbourne, then estimate a drive to
      an activity's demonstration area.
    </p>
    <p class="small text-muted">
      Locations are approximate suburb reference points for fictional
      activities, not confirmed meeting points. Check the activity's access
      notes separately.
    </p>
    <div class="row g-4">
      <div class="col-lg-5">
        <form @submit.prevent="searchPlaces" novalidate>
          <label for="origin-query" class="form-label">Starting place</label>
          <p id="origin-help" class="small">
            Try a public place such as Flinders Street Station. Searches are
            sent to Photon; route coordinates are sent to FOSSGIS. No device
            location is requested.
          </p>
          <input
            ref="queryInput"
            id="origin-query"
            v-model="query"
            @input="queryChanged"
            type="search"
            class="form-control"
            maxlength="120"
            aria-describedby="origin-help origin-error"
            :aria-invalid="!!searchError"
            autocomplete="off"
          />
          <div class="d-flex flex-wrap gap-2 my-2">
            <button class="btn btn-primary" :disabled="searchBusy">
              {{ searchBusy ? "Searching…" : "Search places" }}
            </button>
            <button
              type="button"
              class="btn btn-outline-secondary"
              @click="clearOrigin"
            >
              Clear starting place
            </button>
          </div>
          <p
            id="origin-error"
            v-if="searchError"
            class="text-danger"
            role="alert"
          >
            {{ searchError }}
          </p>
        </form>
        <p role="status" v-if="searchBusy">Searching Greater Melbourne…</p>
        <p role="status" v-else-if="searched">
          {{
            results.length
              ? `${results.length} places found. Choose a starting place below.`
              : "No matching places found. Try a different place name."
          }}
        </p>
        <ul v-if="results.length" class="list-unstyled map-place-list">
          <li v-for="place in results" :key="place.id" class="mb-2">
            <button
              class="btn btn-outline-primary text-start w-100"
              :aria-pressed="origin?.id === place.id"
              @click="chooseOrigin(place)"
            >
              {{ place.label }}
            </button>
          </li>
        </ul>
        <p v-if="origin" role="status">
          <strong>From:</strong> {{ origin.label }}
        </p>
        <label for="trip-activity" class="form-label"
          >Destination activity</label
        >
        <select
          id="trip-activity"
          v-model="destinationId"
          class="form-select mb-2"
          :disabled="!activities.length"
        >
          <option v-if="!activities.length" value="">
            No activities match the current filters
          </option>
          <option
            v-for="(activity, index) in activities"
            :key="activity.id"
            :value="activity.id"
          >
            {{ index + 1 }}. {{ activity.title }} — {{ activity.suburb }}
          </option>
        </select>
        <p v-if="destination" class="small">
          {{ destination.mapLocationLabel }}
          <RouterLink :to="`/opportunities/${destination.id}`"
            >View activity and access details</RouterLink
          >
        </p>
        <button
          class="btn btn-primary"
          :disabled="!origin || !destination || routeBusy"
          @click="calculateRoute"
        >
          {{ routeBusy ? "Calculating…" : "Estimate driving route" }}
        </button>
        <p v-if="routeBusy" role="status" class="mt-2">
          Calculating the driving estimate…
        </p>
        <p v-if="routeError" role="alert" class="text-danger mt-2">
          {{ routeError }}
        </p>
        <div v-if="trip" role="status" class="alert alert-info mt-3">
          <h3 class="h6">Driving estimate</h3>
          <p>
            <strong
              >{{ tripDistance(trip.distance) }} ·
              {{ tripDuration(trip.duration) }}</strong
            >
          </p>
          <p class="mb-0 small">
            From {{ origin.label }} to the approximate
            {{ destination.suburb }} demonstration point. No live traffic,
            parking, walking or step-free access estimate is included.
          </p>
        </div>
      </div>
      <div class="col-lg-7">
        <p id="map-keyboard-help" class="small">
          Numbered markers match the activity selector. Use that selector
          without the map, or focus the map and use arrow keys to pan and +/− to
          zoom.
        </p>
        <div
          ref="mapElement"
          class="activity-map"
          role="region"
          aria-label="Activity locations and estimated driving route"
          aria-describedby="map-keyboard-help"
          tabindex="0"
        ></div>
        <p v-if="mapError" class="alert alert-warning mt-2" role="status">
          {{ mapError }}
        </p>
        <p class="small mt-2 mb-0">
          Place data ©
          <a
            href="https://www.openstreetmap.org/copyright"
            target="_blank"
            rel="noopener"
            >OpenStreetMap contributors</a
          >; search by
          <a
            href="https://github.com/komoot/photon"
            target="_blank"
            rel="noopener"
            >Photon</a
          >; routes by
          <a
            href="https://routing.openstreetmap.de/about.html"
            target="_blank"
            rel="noopener"
            >FOSSGIS / OSRM</a
          >.
          <a
            href="https://www.openstreetmap.org/fixthemap"
            target="_blank"
            rel="noopener"
            >Report a map issue</a
          >.
        </p>
      </div>
    </div>
  </section>
</template>

<style scoped>
.activity-map {
  height: 420px;
  width: 100%;
  background: #eef3ed;
  border: 1px solid #7d9183;
  border-radius: 0.5rem;
  z-index: 0;
}
.map-place-list {
  max-height: 18rem;
  overflow-y: auto;
  padding: 0.25rem;
}
.activity-map :deep(.canopy-map-pin) {
  background: #fff;
  border: 3px solid #245b3d;
  border-radius: 50%;
  display: grid;
  place-items: center;
  color: #153c2a;
  font-weight: 700;
}
.activity-map :deep(.canopy-map-pin.selected) {
  background: #153c2a;
  color: #fff;
  border-color: #fff;
  box-shadow: 0 0 0 2px #153c2a;
}
@media (max-width: 575px) {
  .activity-map {
    height: 320px;
  }
}
</style>
