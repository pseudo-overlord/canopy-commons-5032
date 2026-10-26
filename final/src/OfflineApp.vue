<script setup>
import { ref, computed, onMounted, onUnmounted } from "vue";
import { validateOpportunities } from "./utils/opportunities.js";
import { formatDate, formatTime, formatDuration } from "./utils/format.js";
import { useSavedActivities } from "./composables/useSavedActivities.js";
import SaveActivity from "./components/SaveActivity.vue";
const { savedIds, savedError, refreshSaved } = useSavedActivities();
const activities = ref([]),
  error = ref(""),
  loading = ref(true),
  cachedAt = ref(""),
  online = ref(navigator.onLine);
const path = location.pathname,
  savedOnly = path === "/saved",
  detailId = path.startsWith("/opportunities/")
    ? path.slice("/opportunities/".length)
    : "";
const privateRoute =
  !["/", "/offline.html", "/discover", "/saved"].includes(path) && !detailId;
const detail = computed(() => activities.value.find((a) => a.id === detailId));
const shown = computed(() =>
  activities.value.filter((a) => !savedOnly || savedIds.value.includes(a.id)),
);
const missing = computed(() =>
  savedIds.value.filter((id) => !activities.value.some((a) => a.id === id)),
);
function network() {
  online.value = navigator.onLine;
}
window.addEventListener("online", network);
window.addEventListener("offline", network);
onUnmounted(() => {
  window.removeEventListener("online", network);
  window.removeEventListener("offline", network);
});
async function load() {
  loading.value = true;
  error.value = "";
  try {
    const response = await fetch("/opportunities.json", {
      credentials: "omit",
      signal: AbortSignal.timeout(5000),
    });
    if (!response.ok) throw Error();
    activities.value = validateOpportunities(await response.json());
    cachedAt.value = response.headers.get("X-Canopy-Cached-At") || "";
  } catch {
    error.value =
      "The public activity copy is not available. Your saved list was kept. Reconnect and prepare the offline copy again.";
  } finally {
    loading.value = false;
  }
}
onMounted(load);
</script>
<template>
  <a href="#offline-content" class="skip-link">Skip to main content</a>
  <nav
    class="navbar bg-light border-bottom"
    aria-label="Offline library navigation"
  >
    <div class="container d-flex flex-wrap gap-3">
      <a href="/offline.html" class="navbar-brand">Canopy Commons</a
      ><a href="/offline.html">Public library</a
      ><a href="/saved">Saved activities ({{ savedIds.length }})</a
      ><a href="/discover">Return to main app</a>
    </div>
  </nav>
  <main id="offline-content" tabindex="-1" class="container my-4">
    <p class="alert alert-info" role="status">
      {{
        online
          ? "Public offline library — connection available."
          : "You are offline — reading the public library."
      }}
      Account details, reservations, ratings, email and live map services are
      not part of this library.
    </p>
    <p v-if="cachedAt" class="small">
      Public copy prepared
      {{
        new Date(cachedAt).toLocaleString("en-AU", {
          timeZone: "Australia/Melbourne",
          timeZoneName: "short",
        })
      }}. Details may have changed; reconnect for current session availability.
    </p>
    <p v-else class="small">
      An offline download has not been confirmed on this page. Connect and use
      Prepare offline copy in the main app before relying on an offline reload.
    </p>
    <p class="small">
      Saved activities are kept on this browser and shared across accounts on
      this device. They are not bookings. All activities and dates are fictional
      demonstration content.
    </p>
    <p class="small">
      The public copy includes descriptions, access notes and what to bring. It
      does not confirm attendance or current session availability.
    </p>
    <h1>
      {{
        privateRoute
          ? "This feature needs a connection"
          : detailId
            ? detail?.title || "Activity details"
            : savedOnly
              ? "Saved activities"
              : "Public activity library"
      }}
    </h1>
    <p v-if="privateRoute">
      Private and live features are unavailable here. You can still read public
      activity details and change your saved list.
    </p>
    <p v-if="loading" role="status">Opening activity details…</p>
    <div v-if="error" role="alert" class="alert alert-warning">
      {{ error }}
      <button class="btn btn-outline-secondary" @click="load">
        Retry activity copy
      </button>
    </div>
    <div v-if="savedError" role="alert" class="alert alert-warning">
      {{ savedError }}
      <button class="btn btn-outline-secondary" @click="refreshSaved">
        Retry saved list
      </button>
    </div>
    <template v-if="!loading && !error">
      <article v-if="detail" class="row g-4">
        <div class="col-lg-7">
          <img
            :src="`/art/${detail.art}.webp`"
            :alt="detail.title"
            class="detail-image"
          />
          <h2 class="h5">About this activity</h2>
          <p>{{ detail.description }}</p>
          <h2 class="h5">Access</h2>
          <p>{{ detail.accessibilityNotes }}</p>
          <h2 class="h5">What to bring</h2>
          <p>{{ detail.bring }}</p>
        </div>
        <div class="col-lg-5">
          <p>
            {{ formatDate(detail.startsAt) }} ·
            {{ formatTime(detail.startsAt) }} ·
            {{ formatDuration(detail.durationMinutes) }}
          </p>
          <p>{{ detail.place }}<br />{{ detail.suburb }}</p>
          <p>
            {{
              detail.beginnerFriendly
                ? "Beginners are welcome."
                : "Some previous experience is helpful."
            }}
          </p>
          <p class="small">{{ detail.mapLocationLabel }}</p>
          <SaveActivity :activity-id="detail.id" :title="detail.title" />
          <p><a href="/saved">Back to saved activities</a></p>
        </div>
      </article>
      <p v-else-if="detailId">
        This activity is not in the downloaded catalogue.
        <a href="/offline.html">Browse the available public copy.</a>
      </p>
      <template v-else>
        <p v-if="savedOnly && !savedIds.length" role="status">
          No saved activities yet.
          <a href="/offline.html">Browse the public library</a> and save one,
          even while offline.
        </p>
        <div class="row g-4">
          <article v-for="a in shown" :key="a.id" class="col-sm-6 col-lg-4">
            <div class="card h-100">
              <img :src="`/art/${a.art}.webp`" alt="" class="card-img-top" />
              <div class="card-body">
                <h2 class="h5">{{ a.title }}</h2>
                <p>{{ a.suburb }} · {{ formatDate(a.startsAt) }}</p>
                <p>{{ a.activityType }}</p>
                <a
                  :href="`/opportunities/${a.id}`"
                  class="btn btn-primary btn-sm"
                  >Read activity details</a
                ><SaveActivity :activity-id="a.id" :title="a.title" />
              </div>
            </div>
          </article>
        </div>
        <div
          v-if="savedOnly"
          v-for="id in missing"
          :key="id"
          class="alert alert-secondary mt-3"
        >
          Details for {{ id }} are not in this public copy. Your entry was
          kept.<SaveActivity :activity-id="id" :title="id" />
        </div>
      </template>
    </template>
  </main>
</template>
