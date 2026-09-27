<script setup>
import { computed, onMounted, ref, watch } from "vue";
import { readAccounts, currentUser } from "../auth.js";
const accounts = ref([]),
  accountError = ref(""),
  accountLoading = ref(true);
watch(
  currentUser,
  () => {
    accounts.value = [];
  },
  { flush: "sync" },
);
const volunteerCount = computed(
  () => accounts.value.filter((a) => a.role === "volunteer").length,
);
const coordinatorCount = computed(
  () => accounts.value.filter((a) => a.role === "coordinator").length,
);
async function reloadAccounts() {
  const identity = currentUser.value;
  accountLoading.value = true;
  try {
    const loaded = await readAccounts();
    if (
      currentUser.value !== identity ||
      currentUser.value?.role !== "coordinator"
    )
      return;
    accounts.value = loaded.map(({ email, name, role }) => ({
      id: email,
      email,
      name,
      role,
    }));
    accountError.value = "";
  } catch (failure) {
    accountError.value = failure.message;
  } finally {
    accountLoading.value = false;
  }
}
onMounted(reloadAccounts);
</script>
<template>
  <h1>Coordinator overview</h1>
  <p>Registered accounts for this demonstration.</p>
  <p v-if="accountLoading" role="status">Loading account summary…</p>
  <div v-else class="row g-3 mb-4" aria-label="Account summary">
    <div class="col-sm-4">
      <div class="card card-body">
        <h2 class="h6">Accounts</h2>
        <strong>{{ accountError ? "Unavailable" : accounts.length }}</strong>
      </div>
    </div>
    <div class="col-sm-4">
      <div class="card card-body">
        <h2 class="h6">Volunteers</h2>
        <strong>{{ accountError ? "Unavailable" : volunteerCount }}</strong>
      </div>
    </div>
    <div class="col-sm-4">
      <div class="card card-body">
        <h2 class="h6">Coordinators</h2>
        <strong>{{ accountError ? "Unavailable" : coordinatorCount }}</strong>
      </div>
    </div>
  </div>
  <div v-if="accountError" class="alert alert-warning" role="alert">
    <p>{{ accountError }}</p>
    <button class="btn btn-secondary" @click="reloadAccounts">
      Reload accounts
    </button>
  </div>
</template>
