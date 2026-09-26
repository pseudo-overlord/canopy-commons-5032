<script setup>
import { currentUser } from "../auth.js";
</script>

<template>
  <div v-if="currentUser">
    <h1>My account</h1>
    <p>
      Signed in as <strong>{{ currentUser.name }}</strong>
      <span class="badge text-bg-success ms-2">{{ currentUser.role }}</span>
    </p>
    <p class="text-muted">{{ currentUser.email }}</p>

    <RouterLink to="/discover" class="btn btn-primary mt-3">
      Find an activity
    </RouterLink>
  </div>
</template>
