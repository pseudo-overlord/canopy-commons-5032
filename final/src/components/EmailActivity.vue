<script setup>
import { ref, watch } from "vue";
import {
  addDoc,
  collection,
  serverTimestamp,
  onSnapshot,
} from "firebase/firestore";
import { onUnmounted } from "vue";
import { cloudMode, currentUser } from "../identity.js";
import { getFirebaseServices } from "../firebase.js";
const props = defineProps({ activityId: { type: String, required: true } });
const busy = ref(false),
  message = ref(""),
  error = ref("");
let stop,
  generation = 0;
function clearRequest() {
  generation++;
  stop?.();
  stop = undefined;
  busy.value = false;
  message.value = "";
  error.value = "";
}
watch([() => currentUser.value?.uid, () => props.activityId], clearRequest);
onUnmounted(clearRequest);
async function requestEmail() {
  if (busy.value) return;
  busy.value = true;
  error.value = "";
  message.value = "";
  const requestGeneration = ++generation;
  try {
    const user = currentUser.value;
    if (!user?.emailVerified)
      throw new Error("Verify your account email first from My account.");
    const { db } = getFirebaseServices();
    const request = await addDoc(
      collection(db, "canopyUsers", user.uid, "mailRequests"),
      { activityId: props.activityId, createdAt: serverTimestamp() },
    );
    if (requestGeneration !== generation) return;
    message.value = "Email requested. Waiting for the email service.";
    stop?.();
    stop = onSnapshot(
      request,
      (snapshot) => {
        if (requestGeneration !== generation) return;
        const status = snapshot.data()?.status;
        if (status === "accepted") {
          message.value =
            "The email service accepted your message with its attachment. Check your inbox and spam folder.";
          busy.value = false;
          stop?.();
        }
        if (["expired", "rejected"].includes(status)) {
          error.value =
            "The request could not be sent. Check your verified email or try again later (up to five requests per day).";
          busy.value = false;
          stop?.();
        }
      },
      () => {
        if (requestGeneration !== generation) return;
        error.value =
          "Could not check email status. The request may still be processed; avoid submitting it again immediately.";
        busy.value = false;
      },
    );
  } catch (failure) {
    if (requestGeneration !== generation) return;
    error.value = failure.message;
    busy.value = false;
  }
}
</script>
<template>
  <section
    v-if="cloudMode"
    class="card card-body my-3"
    aria-label="Email activity details"
  >
    <h2 class="h5">Keep the activity details</h2>
    <p v-if="currentUser">
      Email a text attachment to your verified account address:
      {{ currentUser.email }}.
    </p>
    <p v-else>
      <RouterLink to="/login">Log in</RouterLink> to email yourself the activity
      details.
    </p>
    <button
      v-if="currentUser"
      class="btn btn-outline-primary"
      :disabled="busy || !currentUser.emailVerified"
      @click="requestEmail"
    >
      {{ busy ? "Request pending…" : "Email me the details" }}
    </button>
    <p v-if="currentUser && !currentUser.emailVerified" class="mt-2">
      Verify your email from My account to enable sending.
    </p>
    <p v-if="message" role="status" class="mt-2">{{ message }}</p>
    <p v-if="error" role="alert" class="text-danger mt-2">{{ error }}</p>
  </section>
</template>
