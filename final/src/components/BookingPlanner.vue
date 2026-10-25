<script setup>
import { computed, ref, watch, onUnmounted } from "vue";
import { cloudMode, currentUser } from "../identity.js";
import { useBookings } from "../composables/useBookings.js";
import {
  dayKey,
  monthShift,
  calendarDays,
  sessionTime,
  overlaps,
  bookingReason,
} from "../utils/bookingCalendar.js";
const props = defineProps({ activityId: { type: String, default: "" } });
const {
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
  submit,
  retry,
} = useBookings();
const month = ref(dayKey(Date.now()).slice(0, 7)),
  selectedDay = ref(""),
  now = ref(Date.now()),
  initialMonth = ref(false);
const timer = setInterval(() => {
  now.value = Date.now();
}, 30000);
onUnmounted(() => clearInterval(timer));
const scoped = computed(() =>
  sessions.value.filter(
    (s) => !props.activityId || s.activityId === props.activityId,
  ),
);
watch(
  scoped,
  (rows) => {
    if (!initialMonth.value && rows.length) {
      month.value = dayKey(
        rows.find((s) => s.endMillis > now.value)?.startMillis ??
          rows[0].startMillis,
      ).slice(0, 7);
      initialMonth.value = true;
    }
  },
  { immediate: true },
);
watch(
  () => props.activityId,
  () => {
    initialMonth.value = false;
    selectedDay.value = "";
  },
);
const days = computed(() => calendarDays(month.value));
const monthTitle = computed(() =>
  new Intl.DateTimeFormat("en-AU", {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(`${month.value}-01T12:00:00Z`)),
);
const shown = computed(() =>
  scoped.value.filter(
    (s) =>
      dayKey(s.startMillis).startsWith(month.value) &&
      (!selectedDay.value || dayKey(s.startMillis) === selectedDay.value),
  ),
);
const mine = computed(() =>
  bookings.value
    .filter((b) => b.status === "confirmed" && b.endMillis > now.value)
    .sort((a, b) => a.startMillis - b.startMillis),
);
const currentBooking = (session) =>
  bookings.value.find((b) => b.id === session.id);
const isMine = (session) => currentBooking(session)?.status === "confirmed";
const clash = (session) =>
  mine.value.some((b) => b.sessionId !== session.id && overlaps(b, session));
const onDay = (day) =>
  scoped.value.filter((s) => dayKey(s.startMillis) === day);
const myDay = (day) =>
  mine.value.filter((s) => dayKey(s.startMillis) === day).length;
function move(amount) {
  month.value = monthShift(month.value, amount);
  selectedDay.value = "";
}
</script>
<template>
  <section aria-labelledby="booking-title" class="card card-body my-4">
    <h2 id="booking-title" class="h4">Book a demonstration session</h2>
    <p>
      These are fictional future sessions for the coursework demonstration. Each
      reservation is for one person. No email is sent when you book or cancel.
    </p>
    <p class="small">
      All calendar dates and times use Melbourne time (AEST/AEDT). Locations
      remain approximate; these are not real events.
    </p>
    <p v-if="!cloudMode" class="alert alert-info">
      Reservations require the connected Firebase version.
    </p>
    <p v-else-if="!online" role="status" class="alert alert-warning">
      Offline: availability may be out of date. Booking and cancellation require
      a connection. Any request already submitted may still be processed.
    </p>
    <p v-else-if="!sessionsReady && !error" role="status">
      {{
        online
          ? "Connecting to live availability…"
          : "Offline: shown availability may be out of date. Connect before booking or cancelling."
      }}
    </p>
    <div v-if="error || actionError" class="alert alert-warning" role="alert">
      <p>{{ error || actionError }}</p>
      <button class="btn btn-outline-primary" @click="retry">
        Refresh availability and bookings
      </button>
    </div>
    <p v-if="!currentUser">
      <RouterLink to="/login">Log in</RouterLink> to reserve a place and see
      your own bookings.
    </p>
    <p v-else-if="!bookingsReady" role="status">
      Connecting to your reservations…
    </p>
    <p v-if="pending" role="status" class="alert alert-info">
      Request pending. Your place is confirmed only when the server reports
      “confirmed”. Processing order can differ from click order. If you
      disconnect, the request may still be processed.
    </p>
    <div v-if="sessions.length" class="row g-4">
      <div class="col-lg-5">
        <div class="d-flex flex-wrap gap-2 align-items-center mb-3">
          <button
            class="btn btn-outline-secondary"
            aria-label="Previous month"
            @click="move(-1)"
          >
            ←
          </button>
          <h3 class="h5 mb-0" aria-live="polite">{{ monthTitle }}</h3>
          <button
            class="btn btn-outline-secondary"
            aria-label="Next month"
            @click="move(1)"
          >
            →
          </button>
        </div>
        <p class="small" id="calendar-help">
          Choose a date to filter the session list. Each date states how many
          sessions it has and how many you booked.
        </p>
        <div
          class="booking-calendar"
          role="group"
          aria-label="Session dates"
          aria-describedby="calendar-help"
        >
          <span
            v-for="label in ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']"
            :key="label"
            class="small text-center"
            aria-hidden="true"
            >{{ label }}</span
          >
          <template v-for="(day, index) in days" :key="day || `blank-${index}`">
            <span v-if="!day"></span>
            <button
              v-else
              class="btn booking-day"
              :class="
                selectedDay === day ? 'btn-primary' : 'btn-outline-secondary'
              "
              :aria-pressed="selectedDay === day"
              :aria-label="`${day}: ${onDay(day).length} sessions, ${myDay(day)} booked by you`"
              @click="selectedDay = day"
            >
              {{ Number(day.slice(-2))
              }}<span v-if="onDay(day).length" class="d-block small"
                >{{ onDay(day).length }}<span aria-hidden="true">●</span></span
              ><span v-if="myDay(day)" class="d-block small">✓</span>
            </button>
          </template>
        </div>
        <button class="btn btn-link px-0 mt-2" @click="selectedDay = ''">
          Show all sessions this month
        </button>
        <p v-if="selectedDay" role="status">
          Showing {{ selectedDay }} (Melbourne).
        </p>
      </div>
      <div class="col-lg-7">
        <h3 class="h5">
          {{ selectedDay ? "Sessions on this date" : "Sessions this month" }}
        </h3>
        <p v-if="!shown.length" role="status">
          No sessions match this date or month.
        </p>
        <ul class="list-unstyled">
          <li v-for="s in shown" :key="s.id" class="border rounded p-3 mb-3">
            <h4 class="h6">{{ s.title }}</h4>
            <p>
              {{ sessionTime(s.startMillis) }}<br />Ends
              {{ sessionTime(s.endMillis) }}<br />{{ s.suburb }} ·
              {{ s.capacity - s.reservedCount }} of {{ s.capacity }} places
              available
            </p>
            <RouterLink :to="`/opportunities/${s.activityId}`"
              >Activity and access details</RouterLink
            >
            <p v-if="isMine(s)" class="mt-2">
              <strong>Your reservation: confirmed</strong>
            </p>
            <p v-else-if="clash(s)" class="mt-2">
              Overlaps one of your confirmed reservations.
            </p>
            <p v-if="s.startMillis <= now || !s.open" class="mt-2">
              {{
                s.startMillis <= now
                  ? "This session has started or ended."
                  : "Reservations are closed."
              }}
            </p>
            <div v-if="currentUser" class="mt-2">
              <button
                v-if="isMine(s)"
                class="btn btn-outline-danger"
                :disabled="pending || !connected || s.startMillis <= now"
                @click="submit(s, 'cancel')"
              >
                Cancel reservation
              </button>
              <button
                v-else
                class="btn btn-primary"
                :disabled="
                  pending ||
                  !connected ||
                  !s.open ||
                  s.startMillis <= now ||
                  s.reservedCount >= s.capacity ||
                  clash(s)
                "
                @click="submit(s, 'reserve')"
              >
                Reserve one place
              </button>
            </div>
          </li>
        </ul>
      </div>
    </div>
    <div v-if="currentUser && bookingsReady" class="mt-3">
      <h3 class="h5">My confirmed reservations</h3>
      <p v-if="!mine.length">You have no current confirmed reservations.</p>
      <ul>
        <li v-for="b in mine" :key="b.id">
          {{ b.title }} — {{ sessionTime(b.startMillis) }} to
          {{ sessionTime(b.endMillis) }}
          <button
            class="btn btn-link text-danger"
            :disabled="pending || !connected || b.startMillis <= now"
            @click="submit(b, 'cancel')"
          >
            Cancel {{ b.title }}
          </button>
        </li>
      </ul>
    </div>
    <div v-if="currentUser && requests.length" class="mt-3">
      <h3 class="h5">Recent request results</h3>
      <ul aria-live="polite">
        <li v-for="r in requests.slice(0, 5)" :key="r.id">
          {{ r.action === "cancel" ? "Cancellation" : "Reservation" }} —
          {{
            sessions.find((s) => s.id === r.sessionId)?.title || r.sessionId
          }}: <strong>{{ r.status || "pending" }}</strong
          >.
          {{ r.status ? bookingReason(r.reason) : "Waiting for the server." }}
        </li>
      </ul>
    </div>
  </section>
</template>
<style scoped>
.booking-calendar {
  display: grid;
  grid-template-columns: repeat(7, minmax(0, 1fr));
  gap: 0.25rem;
}
.booking-day {
  min-height: 3.8rem;
  padding: 0.25rem;
  font-size: 0.9rem;
  overflow-wrap: anywhere;
}
.booking-calendar button:focus-visible {
  outline: 3px solid #142e57;
  outline-offset: 2px;
}
</style>
