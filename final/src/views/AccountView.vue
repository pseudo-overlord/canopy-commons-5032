<script setup>
import { computed, onMounted, ref } from "vue";
import {
  currentUser,
  cloudMode,
  requestVerification,
  refreshVerification,
} from "../identity.js";
import { myRatings } from "../feedback.js";
import { useOpportunities } from "../composables/useOpportunities.js";

const { opportunities, loadOpportunities } = useOpportunities();

const mine = computed(() =>
  currentUser.value ? myRatings(currentUser.value.email) : [],
);

const titleFor = (id) =>
  opportunities.value.find((item) => item.id === id)?.title || "Activity";

onMounted(loadOpportunities);
const verificationMessage = ref(""),
  verificationBusy = ref(false);
async function verify(refresh = false) {
  verificationBusy.value = true;
  try {
    await (refresh ? refreshVerification() : requestVerification());
    verificationMessage.value = refresh
      ? "Email verification status refreshed."
      : "Verification email requested. Check your inbox and spam folder.";
  } catch {
    verificationMessage.value =
      "Could not complete that request. Please try again shortly.";
  } finally {
    verificationBusy.value = false;
  }
}
</script>

<template>
  <div v-if="currentUser">
    <h1>My account</h1>
    <p>
      Signed in as <strong>{{ currentUser.name }}</strong>
      <span class="badge text-bg-success ms-2">{{ currentUser.role }}</span>
    </p>
    <p class="text-muted">{{ currentUser.email }}</p>
    <section
      v-if="cloudMode && !currentUser.emailVerified"
      class="alert alert-info"
    >
      <h2 class="h5">Verify your email</h2>
      <p>Verification enables activity emails to this address.</p>
      <button
        class="btn btn-primary me-2"
        :disabled="verificationBusy"
        @click="verify(false)"
      >
        Send verification email
      </button>
      <button
        class="btn btn-outline-primary"
        :disabled="verificationBusy"
        @click="verify(true)"
      >
        I have verified my email
      </button>
    </section>
    <p v-if="verificationMessage" role="status">{{ verificationMessage }}</p>

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
