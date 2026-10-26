<script setup>
import { onMounted } from "vue";
import {
  online,
  offlineReady,
  offlineBusy,
  offlineError,
  offlinePreparedAt,
  offlineUpdate,
  initialiseOffline,
  prepareOffline,
  applyOfflineUpdate,
  removeOffline,
} from "../offlineLibrary.js";
onMounted(() => {
  initialiseOffline().catch(() => {
    offlineError.value =
      "Could not check offline storage. Your saved list was kept.";
  });
});
</script>
<template>
  <aside
    class="border rounded p-3 my-4"
    aria-labelledby="offline-tools-heading"
  >
    <h2 id="offline-tools-heading" class="h5">Your offline activity library</h2>
    <p role="status">
      {{ online ? "Connection available." : "You are offline." }}
      {{
        offlineReady
          ? "Public activity details are downloaded."
          : "An offline download has not been confirmed."
      }}
    </p>
    <p v-if="offlinePreparedAt" class="small">
      Copy prepared
      {{
        new Date(offlinePreparedAt).toLocaleString("en-AU", {
          timeZone: "Australia/Melbourne",
          timeZoneName: "short",
        })
      }}. Details may be out of date; reconnect for current session
      availability.
    </p>
    <p class="small">
      Download public activity details and images to read later. Account
      information, bookings, ratings, email and map tiles are excluded. Saved
      activities stay on this browser, shared across accounts; removing this
      download keeps your saved list.
    </p>
    <div class="d-flex flex-wrap gap-2">
      <a href="/offline.html" class="btn btn-outline-primary btn-sm"
        >Open public offline library</a
      >
      <button
        class="btn btn-outline-secondary btn-sm"
        :disabled="offlineBusy || !online"
        @click="prepareOffline"
      >
        {{
          offlineBusy
            ? "Working…"
            : offlineReady
              ? "Check for updated offline copy"
              : "Prepare offline copy"
        }}
      </button>
      <button
        v-if="offlineReady"
        class="btn btn-outline-danger btn-sm"
        :disabled="offlineBusy"
        @click="removeOffline"
      >
        Remove offline download
      </button>
    </div>
    <p v-if="offlineBusy" role="status" class="mt-2">
      Preparing or changing the public download. Keep this page open.
    </p>
    <p v-if="offlineUpdate" role="status" class="mt-2">
      A new public copy is ready.
      <button class="btn btn-primary btn-sm" @click="applyOfflineUpdate">
        Use updated copy and reload
      </button>
    </p>
    <p v-if="offlineError" role="alert" class="text-danger mt-2">
      {{ offlineError }}
    </p>
  </aside>
</template>
