<script setup>
defineProps({
  loading: Boolean,
  error: { type: String, default: "" },
});
defineEmits(["retry"]);
</script>

<template>
  <div v-if="loading" class="alert alert-secondary" role="status">
    Loading activities...
  </div>
  <div v-else-if="error" class="alert alert-warning" role="alert">
    <p class="mb-2">{{ error }}</p>
    <button
      type="button"
      class="btn btn-secondary btn-sm"
      @click="$emit('retry')"
    >
      Try again
    </button>
  </div>
</template>
