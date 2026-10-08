<script setup>
import { computed, onMounted, ref, watch } from "vue";
import { readAccounts, cloudMode, currentUser } from "../identity.js";
import {
  averageRating,
  ratingsFor,
  ratingsError,
  refreshRatings,
} from "../ratings.js";
import { useOpportunities } from "../composables/useOpportunities.js";
import DataTable from "../components/DataTable.vue";
import DataStatus from "../components/DataStatus.vue";
const { opportunities, loading, error, loadOpportunities } = useOpportunities();
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
const activityColumns = [
  { key: "title", label: "Activity" },
  { key: "suburb", label: "Suburb" },
  { key: "type", label: "Type" },
  { key: "average", label: "Average / 5", numeric: true },
  { key: "count", label: "Ratings", numeric: true },
];
const accountColumns = [
  { key: "name", label: "Name" },
  { key: "email", label: "Email" },
  { key: "role", label: "Role" },
];
const summary = computed(() =>
  opportunities.value.map((item) => ({
    id: item.id,
    title: item.title,
    suburb: item.suburb,
    type: item.activityType,
    average: averageRating(item.id)?.toFixed(1) ?? null,
    count: ratingsFor(item.id).length,
  })),
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
    // Never include password hashes in the rendered records or CSV.
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
onMounted(() => {
  loadOpportunities();
  reloadAccounts();
  refreshRatings();
});
</script>
<template>
  <h1>Coordinator overview</h1>
  <p>
    Explore activity feedback and registered accounts. Search any column, sort a
    heading, or export the matching records.
  </p>
  <p v-if="!cloudMode" class="alert alert-info">
    Local demonstration data. Cloud integration is being tested.
  </p>
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
  <DataStatus :loading="loading" :error="error" @retry="loadOpportunities" />
  <div v-if="ratingsError" class="alert alert-warning" role="alert">
    <p>{{ ratingsError }}</p>
    <button class="btn btn-secondary" @click="refreshRatings">
      Reload ratings
    </button>
  </div>
  <DataTable
    v-if="!loading && !error && !ratingsError"
    id="activity-summary"
    title="Activities"
    :columns="activityColumns"
    :rows="summary"
  />
  <div v-if="accountError" class="alert alert-warning" role="alert">
    <p>{{ accountError }}</p>
    <button class="btn btn-secondary" @click="reloadAccounts">
      Reload accounts
    </button>
  </div>
  <DataTable
    v-else-if="!accountLoading"
    id="account-summary"
    title="Accounts"
    :columns="accountColumns"
    :rows="accounts"
  />
</template>
