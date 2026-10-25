<script setup>
import { computed, ref } from "vue";
import { useSavedActivities } from "../composables/useSavedActivities.js";
const props = defineProps({
  activityId: { type: String, required: true },
  title: { type: String, required: true },
});
const { savedIds, savedError, savedBusy, toggleSaved, refreshSaved } =
  useSavedActivities();
const saved = computed(() => savedIds.value.includes(props.activityId)),
  message = ref("");
async function toggle() {
  message.value = "";
  if (await toggleSaved(props.activityId))
    message.value = saved.value
      ? "Saved on this browser."
      : "Removed from your saved list.";
}
</script>
<template>
  <div class="my-2">
    <button
      class="btn btn-outline-secondary btn-sm"
      :aria-pressed="saved"
      :aria-label="`${saved ? 'Remove saved activity' : 'Save activity'}: ${title}`"
      :disabled="savedBusy || !!savedError"
      @click="toggle"
    >
      {{ saved ? "Saved — remove" : "Save activity" }}
    </button>
    <p v-if="message" role="status" class="small mb-0 mt-1">{{ message }}</p>
    <p v-if="savedError" role="alert" class="small text-danger mt-1">
      {{ savedError }}
      <button class="btn btn-link btn-sm p-0" @click="refreshSaved">
        Retry saved list
      </button>
    </p>
  </div>
</template>
