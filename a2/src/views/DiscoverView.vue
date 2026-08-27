<script setup>
import { onMounted } from "vue";
import OpportunityCard from "../components/OpportunityCard.vue";
import { useOpportunities } from "../composables/useOpportunities.js";

const { opportunities, loadOpportunities } = useOpportunities();

onMounted(loadOpportunities);
</script>

<template>
  <h1>Discover activities</h1>
  <p class="lead">Search for something happening near you.</p>

  <div class="row g-4">
    <div v-for="item in opportunities" :key="item.id" class="col-12">
      <OpportunityCard :opportunity="item" />
    </div>
  </div>
</template>
