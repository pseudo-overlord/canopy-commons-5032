import { ref } from "vue";

// One shared list so Home, Discover and the details page use the same data.
const opportunities = ref([]);
const loading = ref(false);
const error = ref("");

async function loadOpportunities() {
  loading.value = true;
  error.value = "";

  try {
    const response = await fetch("/opportunities.json");
    if (!response.ok) {
      throw new Error("Request failed");
    }
    opportunities.value = await response.json();
  } catch {
    error.value = "Sorry, we could not load the activities.";
  }

  loading.value = false;
}

export function useOpportunities() {
  return { opportunities, loading, error, loadOpportunities };
}
