import { ref } from "vue";
import { validateOpportunities } from "../utils/opportunities.js";

// One shared list so Home, Discover and the details page use the same data.
const opportunities = ref([]);
const loading = ref(false);
const error = ref("");

let pending;
function loadOpportunities() {
  if (pending) return pending;
  pending = fetchOpportunities().finally(() => {
    pending = undefined;
  });
  return pending;
}
async function fetchOpportunities() {
  loading.value = true;
  error.value = "";

  try {
    const response = await fetch("/opportunities.json", {
      signal: AbortSignal.timeout(15000),
    });
    if (!response.ok) {
      throw new Error("Request failed");
    }
    opportunities.value = validateOpportunities(await response.json());
  } catch {
    error.value =
      "Sorry, we could not load valid activity details. Check your connection and try again. Previously loaded data has not been overwritten.";
  }

  loading.value = false;
}

export function useOpportunities() {
  return { opportunities, loading, error, loadOpportunities };
}
