<script setup>
import { computed, onMounted } from "vue";
import OpportunityCard from "../components/OpportunityCard.vue";
import DataStatus from "../components/DataStatus.vue";
import { useOpportunities } from "../composables/useOpportunities.js";

const { opportunities, loading, error, loadOpportunities } = useOpportunities();

const featured = computed(() =>
  opportunities.value.filter((item) => item.featured),
);

onMounted(loadOpportunities);
</script>

<template>
  <div class="row align-items-center mb-5">
    <div class="col-md-6">
      <h1>A greener city, one neighbourhood at a time</h1>
      <p class="lead">
        Find a planting day, learn something new, and help nature thrive where you live.
      </p>
      <RouterLink to="/discover" class="btn btn-primary btn-lg">
        Find an activity
      </RouterLink>
    </div>
    <div class="col-md-6 mt-4 mt-md-0">
      <img src="/art/canopy-hero.webp" class="hero-image" alt="Volunteers planting near a creek" />
    </div>
  </div>

  <h2 class="h3 mb-3">Featured activities</h2>

  <DataStatus :loading="loading" :error="error" @retry="loadOpportunities" />

  <div v-if="!loading && !error" class="row g-4">
    <div v-for="item in featured" :key="item.id" class="col-sm-6 col-lg-4">
      <OpportunityCard :opportunity="item" />
    </div>
  </div>

  <h2 class="h3 mt-5 mb-3">How it works</h2>
  <div class="row g-4">
    <div class="col-md-4">
      <h3 class="h5">1. Find your fit</h3>
      <p>Browse activities by suburb or by the kind of work you would enjoy.</p>
    </div>
    <div class="col-md-4">
      <h3 class="h5">2. Check the details</h3>
      <p>See the time, the meeting place, access notes and what to bring.</p>
    </div>
    <div class="col-md-4">
      <h3 class="h5">3. Register your interest</h3>
      <p>Fill in the short form and we will keep you posted.</p>
    </div>
  </div>
</template>
