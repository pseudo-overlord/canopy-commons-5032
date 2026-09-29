<script setup>
import { computed, onUnmounted, ref, watch } from "vue";
import { currentUser } from "../auth.js";
import {
  averageRating,
  myRating,
  ratingsError,
  ratingsFor,
  refreshRatings,
  saveRating,
} from "../ratings.js";

const props = defineProps({
  activityId: { type: String, required: true },
});

const chosen = ref(null);
const message = ref("");
const error = ref("");
const busy = ref(false);
let requestVersion = 0;

const average = computed(() => averageRating(props.activityId));
const count = computed(() => ratingsFor(props.activityId).length);
const saved = computed(() =>
  currentUser.value
    ? myRating(currentUser.value.email, props.activityId)
    : null,
);

// Clear the form when the account or the activity changes, so a reply from an
// earlier request cannot appear as a success on the new one.
watch(
  [currentUser, () => currentUser.value?.email, () => props.activityId],
  () => {
    requestVersion += 1;
    busy.value = false;
    chosen.value = saved.value;
    message.value = "";
    error.value = "";
  },
  { immediate: true, flush: "sync" },
);

// Show a rating changed in another tab, but keep the choice the user is part
// way through making.
watch(saved, (value, previous) => {
  if (!busy.value && (chosen.value === previous || chosen.value === null)) {
    chosen.value = value;
  }
});

onUnmounted(() => {
  requestVersion += 1;
});

const submitRating = async () => {
  if (busy.value) return;

  message.value = "";
  error.value = "";

  if (!currentUser.value) {
    error.value = "Please log in before saving a rating.";
    return;
  }

  if (!chosen.value) {
    error.value = "Please choose a rating from 1 to 5.";
    return;
  }

  const request = ++requestVersion;
  const wasRated = saved.value !== null;
  busy.value = true;

  try {
    await saveRating(currentUser.value.email, props.activityId, chosen.value);
    if (request !== requestVersion) return;
    message.value = wasRated
      ? "Your rating was updated."
      : "Thanks for rating this activity.";
  } catch (failure) {
    if (request !== requestVersion) return;
    error.value =
      failure?.message || "Your rating could not be saved. Please try again.";
  } finally {
    if (request === requestVersion) busy.value = false;
  }
};

const reloadRatings = () => {
  message.value = "";
  error.value = "";
  refreshRatings();
};
</script>

<template>
  <div class="card mb-4">
    <div class="card-body">
      <h2 class="h5">Ratings</h2>

      <div
        v-if="ratingsError && !error"
        class="alert alert-warning"
        role="alert"
      >
        <p class="mb-2">{{ ratingsError }}</p>
        <button
          type="button"
          class="btn btn-outline-secondary btn-sm"
          :disabled="busy"
          @click="reloadRatings"
        >
          Reload ratings
        </button>
      </div>

      <p v-if="count">
        Average rating: <strong>{{ average.toFixed(1) }} / 5</strong> from
        {{ count }} {{ count === 1 ? "person" : "people" }}.
      </p>
      <p v-else-if="!ratingsError" class="text-muted">
        No ratings yet. Be the first.
      </p>
      <p v-else class="text-muted">
        No saved ratings are available to display.
      </p>

      <div v-if="currentUser">
        <p v-if="saved">You rated this {{ saved }} / 5.</p>

        <form :aria-busy="busy" @submit.prevent="submitRating">
          <div class="mb-2">
            <fieldset>
              <legend class="h6">
                Your rating, from 1 (lowest) to 5 (highest)
              </legend>
              <div class="btn-group">
                <template v-for="value in 5" :key="value">
                  <input
                    :id="`star-${value}`"
                    v-model="chosen"
                    type="radio"
                    class="btn-check"
                    :value="value"
                    name="rating"
                    :disabled="busy"
                    @change="
                      message = '';
                      error = '';
                    "
                  />
                  <label class="btn btn-outline-primary" :for="`star-${value}`">
                    {{ value }}
                  </label>
                </template>
              </div>
            </fieldset>
          </div>

          <div v-if="error" class="text-danger mb-2" role="alert">
            {{ error }}
          </div>
          <div v-if="message" class="text-success mb-2" role="status">
            {{ message }}
          </div>

          <button type="submit" class="btn btn-primary btn-sm" :disabled="busy">
            {{
              busy
                ? "Saving rating..."
                : saved
                  ? "Update my rating"
                  : "Save my rating"
            }}
          </button>
        </form>
      </div>

      <p v-else class="mb-0">
        <RouterLink to="/login">Log in</RouterLink> to rate this activity.
      </p>
    </div>
  </div>
</template>
