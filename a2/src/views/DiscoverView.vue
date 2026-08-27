<script setup>
import { onMounted, ref } from "vue";
import OpportunityCard from "../components/OpportunityCard.vue";

const opportunities = ref([]);

async function loadOpportunities() {
  const response = await fetch("/opportunities.json");
  opportunities.value = await response.json();
}

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
