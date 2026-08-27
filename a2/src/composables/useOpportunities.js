import { ref } from "vue";

// One shared list so Home and Discover use the same data.
const opportunities = ref([]);

async function loadOpportunities() {
  const response = await fetch("/opportunities.json");
  opportunities.value = await response.json();
}

export function useOpportunities() {
  return { opportunities, loadOpportunities };
}
