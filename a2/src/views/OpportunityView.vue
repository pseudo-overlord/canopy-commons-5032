<script setup>
import { computed, onMounted } from "vue";
import { useRoute } from "vue-router";
import { useOpportunities } from "../composables/useOpportunities.js";

const route = useRoute();
const { opportunities, loadOpportunities } = useOpportunities();

// Find the activity whose id matches the one in the address bar.
const opportunity = computed(() =>
  opportunities.value.find((item) => item.id === route.params.id),
);

onMounted(loadOpportunities);
</script>

<template>
  <RouterLink to="/discover" class="btn btn-link ps-0">&larr; Back to all activities</RouterLink>

  <div v-if="opportunity">
    <span class="badge text-bg-success mb-2">{{ opportunity.activityType }}</span>
    <h1>{{ opportunity.title }}</h1>
    <p class="text-muted">{{ opportunity.suburb }}</p>

    <h2 class="h5">About this activity</h2>
    <p>{{ opportunity.description }}</p>
  </div>
</template>
