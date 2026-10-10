import { ref, watch } from "vue";
import { collection, getDocs, doc, setDoc } from "firebase/firestore";
import { getFirebaseServices } from "./firebase.js";
import { currentUser } from "./identity.js";
const { db } = getFirebaseServices();
export const ratings = ref([]),
  ratingsError = ref("");
export async function refreshRatings() {
  try {
    const result = await getDocs(collection(db, "canopyRatings"));
    ratings.value = result.docs.map((item) => item.data());
    ratingsError.value = "";
    return true;
  } catch {
    ratingsError.value = "Ratings could not be loaded. Please retry.";
    return false;
  }
}
watch(currentUser, refreshRatings, { immediate: true });
export async function saveRating(email, activityId, value) {
  const user = currentUser.value;
  if (!user || user.email !== email)
    throw new Error("Please log in to save your rating.");
  if (
    !/^[a-z0-9-]{1,100}$/.test(activityId) ||
    !Number.isInteger(value) ||
    value < 1 ||
    value > 5
  )
    throw new Error("Choose an activity and a rating from 1 to 5.");
  await setDoc(doc(db, "canopyRatings", `${user.uid}_${activityId}`), {
    uid: user.uid,
    activityId,
    value,
  });
  if (currentUser.value?.uid === user.uid && !(await refreshRatings()))
    throw new Error(
      "Rating saved, but the summary could not be refreshed. Reload ratings to see it.",
    );
}
export const ratingsFor = (id) =>
  ratings.value.filter((item) => item.activityId === id);
export function averageRating(id) {
  const rows = ratingsFor(id);
  return rows.length
    ? rows.reduce((sum, item) => sum + item.value, 0) / rows.length
    : null;
}
export function myRatings(email) {
  return currentUser.value?.email === email
    ? ratings.value.filter((item) => item.uid === currentUser.value.uid)
    : [];
}
export function myRating(email, id) {
  return myRatings(email).find((item) => item.activityId === id)?.value ?? null;
}
