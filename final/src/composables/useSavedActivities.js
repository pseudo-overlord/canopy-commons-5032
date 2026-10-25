import { ref } from "vue";
import { createSavedStore, savedKey } from "../utils/savedActivities.js";
const savedIds = ref([]),
  savedError = ref(""),
  savedBusy = ref(false);
const store = () =>
  createSavedStore({ storage: window.localStorage, locks: navigator.locks });
export function refreshSaved() {
  try {
    savedIds.value = store().load().ids;
    savedError.value = "";
  } catch (error) {
    savedError.value =
      error.message ||
      "Browser storage is unavailable. Your saved list was not changed.";
  }
}
async function toggleSaved(id) {
  if (savedBusy.value) return;
  savedBusy.value = true;
  try {
    savedIds.value = (await store().toggle(id)).ids;
    savedError.value = "";
    return true;
  } catch (error) {
    savedError.value =
      error.message ||
      "Could not save this activity. Your previous list was kept.";
    return false;
  } finally {
    savedBusy.value = false;
  }
}
window.addEventListener("storage", (event) => {
  if (event.key === savedKey || event.key === null) refreshSaved();
});
refreshSaved();
export function useSavedActivities() {
  return { savedIds, savedError, savedBusy, refreshSaved, toggleSaved };
}
