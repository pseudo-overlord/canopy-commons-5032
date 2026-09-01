<script setup>
import { computed, onMounted, ref } from "vue";
import OpportunityCard from "../components/OpportunityCard.vue";
import DataStatus from "../components/DataStatus.vue";
import { useOpportunities } from "../composables/useOpportunities.js";

const { opportunities, loading, error, loadOpportunities } = useOpportunities();

const search = ref("");
const activityType = ref("All");
const beginnerOnly = ref(false);

// Build the dropdown options from the data instead of typing them out.
const types = computed(() => [
  ...new Set(opportunities.value.map((item) => item.activityType)),
]);

const filtered = computed(() =>
  opportunities.value.filter((item) => {
    const text = (item.title + " " + item.suburb).toLowerCase();
    const matchesSearch = text.includes(search.value.trim().toLowerCase());
    const matchesType =
      activityType.value === "All" || item.activityType === activityType.value;
    const matchesBeginner = !beginnerOnly.value || item.beginnerFriendly;

    return matchesSearch && matchesType && matchesBeginner;
  }),
);

const clearFilters = () => {
  search.value = "";
  activityType.value = "All";
  beginnerOnly.value = false;
};

onMounted(loadOpportunities);
</script>

<template>
  <h1>Discover activities</h1>
  <p class="lead">Search for something happening near you.</p>

  <div class="row g-3 mb-4">
    <div class="col-md-5">
      <label for="search" class="form-label">Search by title or suburb</label>
      <input id="search" v-model="search" type="search" class="form-control" />
    </div>
    <div class="col-md-4">
      <label for="type" class="form-label">Activity type</label>
      <select id="type" v-model="activityType" class="form-select">
        <option>All</option>
        <option v-for="type in types" :key="type">{{ type }}</option>
      </select>
    </div>
    <div class="col-md-3 d-flex align-items-end">
      <div class="form-check">
        <input id="beginner" v-model="beginnerOnly" type="checkbox" class="form-check-input" />
        <label for="beginner" class="form-check-label">Beginners welcome</label>
      </div>
    </div>
  </div>

  <DataStatus :loading="loading" :error="error" @retry="loadOpportunities" />

  <div v-if="!loading && !error" class="d-flex justify-content-between align-items-center mb-3">
    <p class="mb-0">
      {{ filtered.length }} {{ filtered.length === 1 ? "activity" : "activities" }} found
    </p>
    <button type="button" class="btn btn-secondary btn-sm" @click="clearFilters">
      Clear filters
    </button>
  </div>

  <template v-if="!loading && !error">
    <div v-if="filtered.length" class="row g-4">
      <div v-for="item in filtered" :key="item.id" class="col-sm-6 col-lg-4">
        <OpportunityCard :opportunity="item" />
      </div>
    </div>

    <div v-else class="alert alert-secondary">
      <p class="mb-2">No activities match your search.</p>
      <button type="button" class="btn btn-secondary btn-sm" @click="clearFilters">
        Show all activities
      </button>
    </div>
  </template>
</template>
