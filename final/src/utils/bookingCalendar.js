export const bookingTimezone = "Australia/Melbourne";
export function dayKey(millis) {
  const parts = new Intl.DateTimeFormat("en-AU", {
    timeZone: bookingTimezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(millis);
  const part = (name) => parts.find((item) => item.type === name).value;
  return `${part("year")}-${part("month")}-${part("day")}`;
}
export function monthShift(month, amount) {
  const [y, m] = month.split("-").map(Number),
    date = new Date(Date.UTC(y, m - 1 + amount, 1));
  return date.toISOString().slice(0, 7);
}
export function calendarDays(month) {
  const [year, m] = month.split("-").map(Number),
    count = new Date(Date.UTC(year, m, 0)).getUTCDate();
  const padding = (new Date(Date.UTC(year, m - 1, 1)).getUTCDay() + 6) % 7;
  return [
    ...Array(padding).fill(null),
    ...Array.from(
      { length: count },
      (_, i) => `${month}-${String(i + 1).padStart(2, "0")}`,
    ),
  ];
}
export function sessionTime(millis) {
  return new Intl.DateTimeFormat("en-AU", {
    timeZone: bookingTimezone,
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZoneName: "short",
  }).format(millis);
}
export function overlaps(a, b) {
  return a.startMillis < b.endMillis && b.startMillis < a.endMillis;
}
export function validSession(s) {
  return (
    /^[a-z0-9-]{1,100}$/.test(s.id || "") &&
    /^[a-z0-9-]{1,100}$/.test(s.activityId || "") &&
    typeof s.title === "string" &&
    s.title.length > 0 &&
    s.title.length <= 150 &&
    typeof s.suburb === "string" &&
    s.suburb.length <= 100 &&
    Number.isFinite(s.startMillis) &&
    Number.isFinite(s.endMillis) &&
    s.endMillis > s.startMillis &&
    s.endMillis - s.startMillis <= 12 * 3600000 &&
    Number.isInteger(s.capacity) &&
    s.capacity > 0 &&
    s.capacity <= 100 &&
    Number.isInteger(s.reservedCount) &&
    s.reservedCount >= 0 &&
    s.reservedCount <= s.capacity &&
    typeof s.open === "boolean"
  );
}
export const bookingReason = (reason) =>
  ({
    reserved: "Your place is confirmed.",
    cancelled: "Your reservation is cancelled.",
    "already-cancelled": "There is no active reservation to cancel.",
    "already-confirmed": "You already have a confirmed place.",
    full: "This session is full. Please choose another session.",
    "time-conflict":
      "This overlaps a confirmed reservation. Choose another time or cancel the other reservation.",
    "stale-booking":
      "Your reservation changed in another request. Check the latest status before trying again.",
    "session-closed": "This session is closed or has already started.",
    "session-started":
      "This session has started; online cancellation is closed.",
    "daily-limit":
      "You have reached 30 new reservations today (UTC). Cancellation is still available.",
    "schedule-limit":
      "You already have 40 current reservations. Cancel a reservation before adding another.",
    "request-expired":
      "This request expired without a new reservation. Check your bookings before trying again.",
  })[reason] ||
  "The request could not be completed. Refresh your bookings and try again later.";
