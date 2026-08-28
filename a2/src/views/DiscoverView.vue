<script setup>
import { computed, onMounted, ref } from "vue";
import OpportunityCard from "../components/OpportunityCard.vue";
import { useOpportunities } from "../composables/useOpportunities.js";

const { opportunities, loadOpportunities } = useOpportunities();
const search = ref("");

const filtered = computed(() =>
  opportunities.value.filter((item) => {
    const text = (item.title + " " + item.suburb).toLowerCase();
    return text.includes(search.value.trim().toLowerCase());
  }),
);

onMounted(loadOpportunities);
</script>

<template>
  <h1>Discover activities</h1>
  <p class="lead">Search for something happening near you.</p>

  <div class="mb-4">
    <label for="search" class="form-label">Search by title or suburb</label>
    <input id="search" v-model="search" type="search" class="form-control" />
  </div>

  <p>{{ filtered.length }} {{ filtered.length === 1 ? "activity" : "activities" }} found</p>

  <div class="row g-4">
    <div v-for="item in filtered" :key="item.id" class="col-12">
      <OpportunityCard :opportunity="item" />
    </div>
  </div>
</template>
