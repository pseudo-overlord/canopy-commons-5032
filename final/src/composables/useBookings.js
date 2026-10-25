import { ref, watch, onUnmounted, computed } from "vue";
import {
  collection,
  onSnapshot,
  query,
  orderBy,
  limit,
  doc,
  setDoc,
  serverTimestamp,
} from "firebase/firestore";
import { cloudMode, currentUser } from "../identity.js";
import { getFirebaseServices } from "../firebase.js";
import { validSession } from "../utils/bookingCalendar.js";

export function useBookings() {
  const sessions = ref([]),
    bookings = ref([]),
    requests = ref([]),
    error = ref(""),
    actionError = ref("");
  const online = ref(navigator.onLine),
    sessionsReady = ref(false),
    bookingsReady = ref(false),
    requestsReady = ref(false),
    submitting = ref(false);
  let stopSessions,
    privateStops = [],
    generation = 0,
    stopped = false;
  const pending = computed(
    () =>
      submitting.value ||
      requests.value.some(
        (item) =>
          !["confirmed", "cancelled", "expired", "rejected"].includes(
            item.status,
          ),
      ),
  );
  const connected = computed(
    () =>
      online.value &&
      sessionsReady.value &&
      bookingsReady.value &&
      requestsReady.value,
  );
  function network() {
    online.value = navigator.onLine;
  }
  window.addEventListener("online", network);
  window.addEventListener("offline", network);
  function subscribeSessions() {
    stopSessions?.();
    sessionsReady.value = false;
    error.value = "";
    if (!cloudMode) return;
    const { db } = getFirebaseServices();
    stopSessions = onSnapshot(
      collection(db, "canopySessions"),
      { includeMetadataChanges: true },
      (snapshot) => {
        if (stopped) return;
        const rows = snapshot.docs
          .map((item) => ({ ...item.data(), id: item.id }))
          .filter((item) => item.visible === true);
        if (!rows.every(validSession)) {
          sessionsReady.value = false;
          error.value =
            "Session data could not be validated. Please retry later.";
          return;
        }
        sessions.value = rows.sort((a, b) => a.startMillis - b.startMillis);
        sessionsReady.value = !snapshot.metadata.fromCache;
        error.value = "";
      },
      () => {
        sessionsReady.value = false;
        error.value = "Could not load session availability. Please retry.";
      },
    );
  }
  function subscribePrivate() {
    const current = ++generation;
    privateStops.forEach((stop) => stop());
    privateStops = [];
    bookings.value = [];
    requests.value = [];
    bookingsReady.value = false;
    requestsReady.value = false;
    submitting.value = false;
    actionError.value = "";
    if (!cloudMode || !currentUser.value?.uid) return;
    const { db } = getFirebaseServices(),
      uid = currentUser.value.uid;
    privateStops.push(
      onSnapshot(
        collection(db, "canopyUsers", uid, "bookings"),
        { includeMetadataChanges: true },
        (snapshot) => {
          if (generation !== current) return;
          bookings.value = snapshot.docs.map((item) => ({
            ...item.data(),
            id: item.id,
          }));
          bookingsReady.value = !snapshot.metadata.fromCache;
        },
        () => {
          if (generation === current) {
            bookingsReady.value = false;
            actionError.value =
              "Could not read your reservations. Please retry.";
          }
        },
      ),
    );
    privateStops.push(
      onSnapshot(
        query(
          collection(db, "canopyUsers", uid, "bookingRequests"),
          orderBy("createdAt", "desc"),
          limit(20),
        ),
        { includeMetadataChanges: true },
        (snapshot) => {
          if (generation !== current) return;
          requests.value = snapshot.docs.map((item) => ({
            ...item.data(),
            id: item.id,
          }));
          requestsReady.value = !snapshot.metadata.fromCache;
        },
        () => {
          if (generation === current) {
            requestsReady.value = false;
            actionError.value =
              "Could not check request status. A submitted request may still be processed. Check your reservations before retrying.";
          }
        },
      ),
    );
  }
  const stopUser = watch(() => currentUser.value?.uid, subscribePrivate, {
    immediate: true,
  });
  subscribeSessions();
  async function submit(session, action) {
    if (pending.value) return;
    actionError.value = "";
    if (!connected.value || !currentUser.value?.uid) {
      actionError.value =
        "Connect and log in before requesting a reservation change.";
      return;
    }
    const current = generation,
      uid = currentUser.value.uid;
    submitting.value = true;
    try {
      const { db } = getFirebaseServices();
      const ref = doc(collection(db, "canopyUsers", uid, "bookingRequests"));
      const revision =
        bookings.value.find((item) => item.id === session.id)?.revision ?? 0;
      await setDoc(ref, {
        sessionId: session.id,
        action,
        expectedRevision: revision,
        createdAt: serverTimestamp(),
      });
    } catch {
      if (generation === current)
        actionError.value =
          "Could not confirm the request reached the server. If your connection dropped it may still be queued. Check request status and your bookings before retrying.";
    } finally {
      if (generation === current) submitting.value = false;
    }
  }
  function retry() {
    subscribeSessions();
    subscribePrivate();
  }
  onUnmounted(() => {
    stopped = true;
    generation++;
    stopUser();
    stopSessions?.();
    privateStops.forEach((stop) => stop());
    window.removeEventListener("online", network);
    window.removeEventListener("offline", network);
  });
  return {
    sessions,
    bookings,
    requests,
    error,
    actionError,
    online,
    sessionsReady,
    bookingsReady,
    connected,
    pending,
    submitting,
    submit,
    retry,
  };
}
