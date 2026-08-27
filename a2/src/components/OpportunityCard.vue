<script setup>
defineProps({
  opportunity: { type: Object, required: true },
});
</script>

<template>
  <div class="card h-100">
    <div class="card-body">
      <span class="badge text-bg-success mb-2">{{ opportunity.activityType }}</span>
      <h3 class="h5 card-title">{{ opportunity.title }}</h3>
      <p class="text-muted small mb-2">{{ opportunity.suburb }}</p>
      <p v-if="opportunity.beginnerFriendly" class="text-success small">
        Beginners welcome
      </p>
    </div>
  </div>
</template>
