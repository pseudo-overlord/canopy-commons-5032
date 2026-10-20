// Works out what a booking request should do. Everything it needs is read
// inside a single transaction.
export const terminalBookingStatuses = [
  "confirmed",
  "cancelled",
  "rejected",
  "expired",
];
export function decideBooking({
  request,
  session,
  booking,
  schedule,
  quota,
  now,
}) {
  const reject = (reason) => ({ status: "rejected", reason });
  if (
    !request ||
    !["reserve", "cancel"].includes(request.action) ||
    !/^[a-z0-9-]{1,100}$/.test(request.sessionId || "") ||
    !Number.isSafeInteger(request.expectedRevision) ||
    request.expectedRevision < 0
  )
    return reject("invalid-request");
  if (
    !Number.isFinite(request.createdAt) ||
    request.createdAt > now + 30000 ||
    now - request.createdAt > 10 * 60000
  )
    return { status: "expired", reason: "request-expired" };
  if (
    !session ||
    !Number.isFinite(session.startMillis) ||
    !Number.isFinite(session.endMillis) ||
    session.endMillis <= session.startMillis ||
    session.endMillis - session.startMillis > 12 * 3600000 ||
    !Number.isInteger(session.capacity) ||
    session.capacity < 1 ||
    session.capacity > 100 ||
    !Number.isInteger(session.reservedCount) ||
    session.reservedCount < 0 ||
    session.reservedCount > session.capacity
  )
    return reject("session-unavailable");
  const revision = booking?.revision ?? 0;
  if (!Number.isSafeInteger(revision) || request.expectedRevision !== revision)
    return reject("stale-booking");
  const entries = schedule?.entries ?? [];
  if (
    !Array.isArray(entries) ||
    entries.length > 40 ||
    entries.some(
      (item) =>
        !/^[a-z0-9-]{1,100}$/.test(item.sessionId || "") ||
        !Number.isFinite(item.startMillis) ||
        !Number.isFinite(item.endMillis) ||
        item.endMillis <= item.startMillis,
    ) ||
    new Set(entries.map((item) => item.sessionId)).size !== entries.length
  )
    return reject("schedule-unavailable");
  const future = entries.filter((item) => item.endMillis > now);
  if (request.action === "cancel") {
    if (booking?.status !== "confirmed")
      return { status: "cancelled", reason: "already-cancelled" };
    if (session.startMillis <= now) return reject("session-started");
    if (session.reservedCount < 1) return reject("session-unavailable");
    return {
      status: "cancelled",
      reason: "cancelled",
      change: true,
      revision: revision + 1,
      reservedCount: session.reservedCount - 1,
      entries: future.filter((item) => item.sessionId !== request.sessionId),
    };
  }
  if (booking?.status === "confirmed")
    return { status: "confirmed", reason: "already-confirmed" };
  if (session.open !== true || session.startMillis <= now)
    return reject("session-closed");
  if (session.reservedCount >= session.capacity) return reject("full");
  if (
    future.some(
      (item) =>
        item.startMillis < session.endMillis &&
        session.startMillis < item.endMillis,
    )
  )
    return reject("time-conflict");
  if (future.length >= 40) return reject("schedule-limit");
  const day = new Date(now).toISOString().slice(0, 10);
  const count = quota?.day === day ? quota.count : 0;
  if (!Number.isInteger(count) || count < 0 || count >= 30)
    return reject("daily-limit");
  return {
    status: "confirmed",
    reason: "reserved",
    change: true,
    revision: revision + 1,
    reservedCount: session.reservedCount + 1,
    quota: { day, count: count + 1 },
    entries: [
      ...future,
      {
        sessionId: request.sessionId,
        startMillis: session.startMillis,
        endMillis: session.endMillis,
      },
    ],
  };
}

export async function processBooking({
  db,
  requestRef,
  uid,
  now = Date.now,
  timestamp,
  expiresAt,
  accountAllowed = true,
}) {
  return db.runTransaction(async (tx) => {
    const request = (await tx.get(requestRef)).data();
    if (!request || terminalBookingStatuses.includes(request.status)) return;
    const finish = (result) =>
      tx.update(requestRef, {
        status: result.status,
        reason: result.reason,
        updatedAt: timestamp(),
        expiresAt,
      });
    if (!accountAllowed) {
      finish({ status: "rejected", reason: "account-unavailable" });
      return;
    }
    if (!/^[a-z0-9-]{1,100}$/.test(request.sessionId || "")) {
      finish({ status: "rejected", reason: "invalid-request" });
      return;
    }
    const sessionRef = db.doc(`canopySessions/${request.sessionId}`);
    const bookingRef = db.doc(
      `canopyUsers/${uid}/bookings/${request.sessionId}`,
    );
    const scheduleRef = db.doc(`canopyBookingSchedules/${uid}`),
      quotaRef = db.doc(`canopyBookingLimits/${uid}`);
    const [sessionDoc, bookingDoc, scheduleDoc, quotaDoc] = await Promise.all(
      [sessionRef, bookingRef, scheduleRef, quotaRef].map((ref) => tx.get(ref)),
    );
    const session = sessionDoc.data();
    const result = decideBooking({
      request: { ...request, createdAt: request.createdAt?.toMillis() },
      session,
      booking: bookingDoc.data(),
      schedule: scheduleDoc.data(),
      quota: quotaDoc.data(),
      now: now(),
    });
    if (result.change) {
      tx.update(sessionRef, { reservedCount: result.reservedCount });
      tx.set(scheduleRef, { entries: result.entries, updatedAt: timestamp() });
      if (result.quota) tx.set(quotaRef, result.quota);
      tx.set(bookingRef, {
        sessionId: request.sessionId,
        activityId: session.activityId,
        title: session.title,
        suburb: session.suburb,
        startMillis: session.startMillis,
        endMillis: session.endMillis,
        timezone: "Australia/Melbourne",
        status: result.status,
        revision: result.revision,
        updatedAt: timestamp(),
      });
    }
    finish(result);
  });
}
