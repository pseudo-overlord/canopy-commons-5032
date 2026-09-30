<script setup>
import { computed, onMounted } from "vue";
import { currentUser } from "../auth.js";
import { myRatings } from "../ratings.js";
import { useOpportunities } from "../composables/useOpportunities.js";

const { opportunities, loadOpportunities } = useOpportunities();

const mine = computed(() =>
  currentUser.value ? myRatings(currentUser.value.email) : [],
);

const titleFor = (id) =>
  opportunities.value.find((item) => item.id === id)?.title || "Activity";

onMounted(loadOpportunities);
</script>

<template>
  <div v-if="currentUser">
    <h1>My account</h1>
    <p>
      Signed in as <strong>{{ currentUser.name }}</strong>
      <span class="badge text-bg-success ms-2">{{ currentUser.role }}</span>
    </p>
    <p class="text-muted">{{ currentUser.email }}</p>

    <h2 class="h4 mt-4">My ratings</h2>
    <p v-if="!mine.length" class="alert alert-secondary">
      You have not rated any activities yet.
    </p>
    <ul v-else class="list-group">
      <li
        v-for="item in mine"
        :key="item.activityId"
        class="list-group-item d-flex justify-content-between"
      >
        <RouterLink :to="`/opportunities/${item.activityId}`">
          {{ titleFor(item.activityId) }}
        </RouterLink>
        <span>{{ item.value }} / 5</span>
      </li>
    </ul>

    <RouterLink to="/discover" class="btn btn-primary mt-3">
      Find an activity
    </RouterLink>
  </div>
</template>
