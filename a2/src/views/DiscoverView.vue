<script setup>
import { onMounted, ref } from "vue";

const opportunities = ref([]);

// Load the activities from the JSON file in the public folder.
async function loadOpportunities() {
  const response = await fetch("/opportunities.json");
  opportunities.value = await response.json();
}

onMounted(loadOpportunities);
</script>

<template>
  <h1>Discover activities</h1>
  <p class="lead">Search for something happening near you.</p>

  <ul class="list-group">
    <li v-for="item in opportunities" :key="item.id" class="list-group-item">
      <strong>{{ item.title }}</strong> &mdash; {{ item.suburb }}
    </li>
  </ul>
</template>
