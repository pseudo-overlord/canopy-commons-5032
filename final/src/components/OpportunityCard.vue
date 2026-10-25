<script setup>
import { formatDate, formatDuration } from "../utils/format.js";
import SaveActivity from "./SaveActivity.vue";

defineProps({
  opportunity: { type: Object, required: true },
});
</script>

<template>
  <div class="card h-100">
    <img
      :src="`/art/${opportunity.art}.webp`"
      class="card-img-top"
      alt=""
      loading="lazy"
    />
    <div class="card-body">
      <span class="badge text-bg-success mb-2">{{
        opportunity.activityType
      }}</span>
      <h3 class="h5 card-title">{{ opportunity.title }}</h3>
      <p class="text-muted small mb-2">
        {{ opportunity.suburb }} &middot;
        {{ formatDuration(opportunity.durationMinutes) }}
      </p>
      <p class="card-text">{{ formatDate(opportunity.startsAt) }}</p>
      <p v-if="opportunity.beginnerFriendly" class="text-success small">
        Beginners welcome
      </p>
    </div>
    <div class="card-footer bg-white border-top-0">
      <RouterLink
        :to="`/opportunities/${opportunity.id}`"
        class="btn btn-primary btn-sm"
      >
        View details
      </RouterLink>
      <SaveActivity :activity-id="opportunity.id" :title="opportunity.title" />
    </div>
  </div>
</template>
