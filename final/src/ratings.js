import { ref } from "vue";
import { currentUser, readAccounts } from "./auth.js";
import { readCollection, withWriteLock, writeCollection } from "./storage.js";

const RATINGS_KEY = "canopy-ratings";
export const ratings = ref([]);
export const ratingsError = ref("");

function validRatings(records) {
  const identities = new Set();
  return records.every((item) => {
    if (
      !item ||
      typeof item.email !== "string" ||
      !item.email.trim() ||
      item.email !== item.email.trim().toLowerCase() ||
      typeof item.activityId !== "string" ||
      !item.activityId.trim() ||
      !Number.isInteger(item.value) ||
      item.value < 1 ||
      item.value > 5
    )
      return false;
    const identity = JSON.stringify([item.email, item.activityId]);
    if (identities.has(identity)) return false;
    identities.add(identity);
    return true;
  });
}

function readRatings() {
  return readCollection(RATINGS_KEY, validRatings, "ratings");
}

export function refreshRatings() {
  try {
    ratings.value = readRatings();
    ratingsError.value = "";
    return true;
  } catch (error) {
    ratingsError.value = `${error.message} Displayed ratings may be out of date.`;
    return false;
  }
}

refreshRatings();
if (typeof window !== "undefined") {
  window.addEventListener("storage", (event) => {
    if (event.key === RATINGS_KEY || event.key === null) refreshRatings();
  });
  window.addEventListener("focus", refreshRatings);
}

// Read the saved ratings again inside the lock, so another tab cannot have
// its newer rating overwritten. Only update the page after the save works.
export async function saveRating(email, activityId, value) {
  const ownsRating = () => currentUser.value?.email === email;
  if (!ownsRating())
    throw new Error("Please log in as the person submitting this rating.");
  if (typeof activityId !== "string" || !activityId.trim())
    throw new Error("Choose an activity to rate.");
  if (!Number.isInteger(value) || value < 1 || value > 5)
    throw new Error("Please choose a whole-number rating from 1 to 5.");

  await withWriteLock(() => {
    if (
      !ownsRating() ||
      !readAccounts().some((account) => account.email === email)
    ) {
      throw new Error(
        "Your account changed. Please log in again before saving a rating.",
      );
    }
    const next = readRatings();
    const existing = next.find(
      (item) => item.email === email && item.activityId === activityId,
    );
    if (existing) existing.value = value;
    else next.push({ email, activityId, value });

    writeCollection(RATINGS_KEY, next, "ratings");
    ratings.value = next;
    ratingsError.value = "";
  });
}

export function ratingsFor(activityId) {
  return ratings.value.filter((item) => item.activityId === activityId);
}

export function averageRating(activityId) {
  const found = ratingsFor(activityId);
  if (!found.length) return null;
  return found.reduce((sum, item) => sum + item.value, 0) / found.length;
}

export function myRating(email, activityId) {
  const found = ratings.value.find(
    (item) => item.email === email && item.activityId === activityId,
  );
  return found ? found.value : null;
}

export function myRatings(email) {
  return ratings.value.filter((item) => item.email === email);
}
