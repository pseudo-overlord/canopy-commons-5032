<script setup>
import { computed, onMounted } from "vue";
import { useRoute } from "vue-router";
import DataStatus from "../components/DataStatus.vue";
import BookingPlanner from "../components/BookingPlanner.vue";
import ActivityRating from "../components/ActivityRating.vue";
import EmailActivity from "../components/EmailActivity.vue";
import SaveActivity from "../components/SaveActivity.vue";
import { online } from "../offlineLibrary.js";
import { useOpportunities } from "../composables/useOpportunities.js";
import { formatDate, formatTime, formatDuration } from "../utils/format.js";

const route = useRoute();
const { opportunities, loading, error, loadOpportunities } = useOpportunities();

const opportunity = computed(() =>
  opportunities.value.find((item) => item.id === route.params.id),
);

onMounted(loadOpportunities);
</script>

<template>
  <RouterLink to="/discover" class="btn btn-link ps-0"
    >&larr; Back to all activities</RouterLink
  >

  <DataStatus :loading="loading" :error="error" @retry="loadOpportunities" />

  <div v-if="!loading && !error && opportunity" class="row g-4">
    <div class="col-lg-7">
      <span class="badge text-bg-success mb-2">{{
        opportunity.activityType
      }}</span>
      <h1>{{ opportunity.title }}</h1>
      <SaveActivity :activity-id="opportunity.id" :title="opportunity.title" />
      <EmailActivity v-if="online" :activity-id="opportunity.id" />
      <p v-else role="status">
        Offline: ratings, email and session availability require a connection.
        <a :href="`/opportunities/${opportunity.id}`"
          >Open this activity in the public offline reader</a
        >.
      </p>

      <img
        :src="`/art/${opportunity.art}.webp`"
        class="detail-image"
        :alt="opportunity.title"
      />

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
      <ActivityRating v-if="online" :activity-id="opportunity.id" />
      <p class="alert alert-secondary">
        The original activity date is a fictional example. Future demonstration
        sessions have their own dates below.
      </p>
    </div>
    <div v-if="online" class="col-12">
      <BookingPlanner :key="opportunity.id" :activity-id="opportunity.id" />
    </div>
  </div>

  <div v-else-if="!loading && !error" class="alert alert-secondary">
    <h1 class="h4">Activity not found</h1>
    <p>We could not find that activity. It may have been removed.</p>
    <RouterLink to="/discover" class="btn btn-primary"
      >See all activities</RouterLink
    >
  </div>
</template>
