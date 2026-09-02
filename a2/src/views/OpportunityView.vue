<script setup>
import { computed, onMounted } from "vue";
import { useRoute } from "vue-router";
import DataStatus from "../components/DataStatus.vue";
import { useOpportunities } from "../composables/useOpportunities.js";
import { formatDate, formatTime, formatDuration } from "../utils/format.js";
import InterestForm from "../components/InterestForm.vue";

const route = useRoute();
const { opportunities, loading, error, loadOpportunities } = useOpportunities();

// Find the activity whose id matches the one in the address bar.
const opportunity = computed(() =>
  opportunities.value.find((item) => item.id === route.params.id),
);

onMounted(loadOpportunities);
</script>

<template>
  <RouterLink to="/discover" class="btn btn-link ps-0">&larr; Back to all activities</RouterLink>

  <DataStatus :loading="loading" :error="error" @retry="loadOpportunities" />

  <div v-if="!loading && !error && opportunity" class="row g-4">
    <div class="col-lg-7">
    <span class="badge text-bg-success mb-2">{{ opportunity.activityType }}</span>
    <h1>{{ opportunity.title }}</h1>

    <div class="row mb-3">
      <div class="col-sm-6">
        <h2 class="h6 text-muted">When</h2>
        <p>
          {{ formatDate(opportunity.startsAt) }}<br />
          {{ formatTime(opportunity.startsAt) }} &middot;
          {{ formatDuration(opportunity.durationMinutes) }}
        </p>
      </div>
      <div class="col-sm-6">
        <h2 class="h6 text-muted">Where</h2>
        <p>{{ opportunity.place }}<br />{{ opportunity.suburb }}</p>
      </div>
    </div>

    <h2 class="h5">About this activity</h2>
    <p>{{ opportunity.description }}</p>

    <h2 class="h5">Who can come</h2>
    <p>
      {{
        opportunity.beginnerFriendly
          ? "Beginners are welcome. No experience needed."
          : "Some previous experience is helpful for this activity."
      }}
    </p>

    <h2 class="h5">Access</h2>
    <p>{{ opportunity.accessibilityNotes }}</p>

    <h2 class="h5">What to bring</h2>
    <p>{{ opportunity.bring }}</p>
    </div>

    <div class="col-lg-5">
      <InterestForm :key="opportunity.id" :opportunity-title="opportunity.title" />
    </div>
  </div>

  <div v-else-if="!loading && !error" class="alert alert-secondary">
    <h1 class="h4">Activity not found</h1>
    <p>We could not find that activity. It may have been removed.</p>
    <RouterLink to="/discover" class="btn btn-primary">See all activities</RouterLink>
  </div>
</template>
