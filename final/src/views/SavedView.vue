<script setup>
import { computed, onMounted } from "vue";
import { useSavedActivities } from "../composables/useSavedActivities.js";
import { useOpportunities } from "../composables/useOpportunities.js";
import OpportunityCard from "../components/OpportunityCard.vue";
import DataStatus from "../components/DataStatus.vue";
import SaveActivity from "../components/SaveActivity.vue";
const { savedIds, savedError, refreshSaved } = useSavedActivities();
const { opportunities, loading, error, loadOpportunities } = useOpportunities();
const saved = computed(() =>
  opportunities.value.filter((a) => savedIds.value.includes(a.id)),
);
const missing = computed(() =>
  savedIds.value.filter((id) => !opportunities.value.some((a) => a.id === id)),
);
onMounted(() => {
  refreshSaved();
  loadOpportunities();
});
</script>
<template>
  <h1>Saved activities</h1>
  <p>
    Saved activities stay on this browser. They are not bookings, and anyone
    using this browser will see them.
  </p>
  <p>
    Going somewhere without signal? Use “Prepare offline copy” at the bottom of
    this page while you are connected, and your saved activities and their
    details will still open with no internet. You can also
    <a href="/offline.html">open the offline library</a> directly.
  </p>
  <div v-if="savedError" class="alert alert-warning" role="alert">
    {{ savedError }}
    <button class="btn btn-outline-secondary" @click="refreshSaved">
      Retry saved list
    </button>
  </div>
  <DataStatus :loading="loading" :error="error" @retry="loadOpportunities" />
  <template v-if="!loading && !error && !savedError">
    <p v-if="!savedIds.length" role="status">
      No saved activities yet.
      <RouterLink to="/discover">Find an activity</RouterLink> and choose Save
      activity.
    </p>
    <div class="row g-4">
      <div v-for="a in saved" :key="a.id" class="col-sm-6 col-lg-4">
        <OpportunityCard :opportunity="a" />
      </div>
    </div>
    <div v-for="id in missing" :key="id" class="alert alert-secondary mt-3">
      Details for {{ id }} are not in the current catalogue. Your saved entry
      was kept.<SaveActivity :activity-id="id" :title="id" />
    </div>
  </template>
</template>
