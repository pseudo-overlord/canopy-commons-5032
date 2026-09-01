<script setup>
import { computed, onMounted } from "vue";
import OpportunityCard from "../components/OpportunityCard.vue";
import DataStatus from "../components/DataStatus.vue";
import { useOpportunities } from "../composables/useOpportunities.js";

const { opportunities, loading, error, loadOpportunities } = useOpportunities();

// Only the activities marked as featured in the data file.
const featured = computed(() => opportunities.value.filter((item) => item.featured));

onMounted(loadOpportunities);
</script>

<template>
  <h1>A greener city, one neighbourhood at a time</h1>
  <p class="lead">
    Find a planting day, learn something new, and help nature thrive where you live.
  </p>
  <RouterLink to="/discover" class="btn btn-primary btn-lg">Find an activity</RouterLink>

  <h2 class="h3 mt-5 mb-3">Featured activities</h2>

  <DataStatus :loading="loading" :error="error" @retry="loadOpportunities" />
  <div v-if="!loading && !error" class="row g-4">
    <div v-for="item in featured" :key="item.id" class="col-sm-6 col-lg-4">
      <OpportunityCard :opportunity="item" />
    </div>
  </div>
</template>
