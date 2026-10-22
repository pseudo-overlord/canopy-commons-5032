import { initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore, FieldValue, Timestamp } from "firebase-admin/firestore";
import { defineSecret } from "firebase-functions/params";
import { onDocumentCreated } from "firebase-functions/v2/firestore";
import { createHash } from "node:crypto";
import { cloudEvent } from "@google-cloud/functions-framework";
import {
  buildActivityEmail,
  sendActivityEmail,
  validateRequest,
} from "./email.js";
import { processBooking } from "./bookings.js";

initializeApp();
const resendKey = defineSecret("CANOPY_RESEND_API_KEY");

// A background trigger means there is no public web address to call.
export const canopyActivityEmail = onDocumentCreated(
  {
    document: "canopyUsers/{uid}/mailRequests/{requestId}",
    region: "australia-southeast2",
    secrets: [resendKey],
    minInstances: 0,
    maxInstances: 1,
    concurrency: 1,
    memory: "256MiB",
    timeoutSeconds: 60,
    retry: true,
  },
  async (event) => {
    const db = getFirestore();
    const ref = event.data.ref;
    const expiresAt = Timestamp.fromMillis(
      Date.now() + 7 * 24 * 60 * 60 * 1000,
    );
    let prepared;
    // Build the message once so a retry sends exactly the same thing.
    await db.runTransaction(async (transaction) => {
      prepared = undefined;
      const live = await transaction.get(ref);
      const request = live.data();
      if (
        !request ||
        ["accepted", "rejected", "expired"].includes(request.status)
      )
        return;
      try {
        validateRequest(request, request.createdAt?.toMillis());
      } catch {
        transaction.update(ref, {
          status: "expired",
          updatedAt: FieldValue.serverTimestamp(),
          expiresAt,
        });
        return;
      }
      const delivery = ref.collection("private").doc("delivery");
      const existing = await transaction.get(delivery);
      if (existing.exists) {
        prepared = existing.data().payload;
        return;
      }

      const activity = await transaction.get(
        db.doc(`canopyActivities/${request.activityId}`),
      );
      const user = await getAuth().getUser(event.params.uid);
      let payload;
      try {
        payload = buildActivityEmail(user, activity.data());
      } catch {
        transaction.update(ref, {
          status: "rejected",
          updatedAt: FieldValue.serverTimestamp(),
          expiresAt,
        });
        return;
      }
      const quotaRef = db.doc(`canopyEmailLimits/${event.params.uid}`);
      const quota = (await transaction.get(quotaRef)).data();
      const globalRef = db.doc("canopyEmailLimits/global");
      const globalQuota = (await transaction.get(globalRef)).data();
      const day = new Date().toISOString().slice(0, 10);
      const count = quota?.day === day ? quota.count : 0;
      const total = globalQuota?.day === day ? globalQuota.count : 0;
      if (count >= 5 || total >= 50) {
        transaction.update(ref, {
          status: "rejected",
          reason: "daily-limit",
          updatedAt: FieldValue.serverTimestamp(),
          expiresAt,
        });
        return;
      }
      transaction.set(quotaRef, { day, count: count + 1 });
      transaction.set(globalRef, { day, count: total + 1 });
      transaction.set(delivery, { payload, expiresAt });
      transaction.update(ref, {
        status: "processing",
        updatedAt: FieldValue.serverTimestamp(),
        expiresAt,
      });
      prepared = payload;
    });
    if (!prepared) return;
    const requestKey = createHash("sha256").update(ref.path).digest("hex");
    const providerId = await sendActivityEmail(
      prepared,
      requestKey,
      resendKey.value(),
    );
    // The provider accepting the message does not prove it arrived.
    await ref.update({
      status: "accepted",
      providerId,
      updatedAt: FieldValue.serverTimestamp(),
    });
  },
);

// Deploying with gcloud needs the CloudEvent signature set out explicitly. The
// Firebase wrapper turns the event into the snapshot and parameters used above.
cloudEvent("canopyActivityEmail", canopyActivityEmail);

export const canopyBookingRequest = onDocumentCreated(
  {
    document: "canopyUsers/{uid}/bookingRequests/{requestId}",
    region: "australia-southeast2",
    minInstances: 0,
    maxInstances: 2,
    concurrency: 1,
    memory: "256MiB",
    timeoutSeconds: 60,
    retry: true,
  },
  async (event) => {
    let allowed = true;
    try {
      allowed = !(await getAuth().getUser(event.params.uid)).disabled;
    } catch (error) {
      if (error.code === "auth/user-not-found") allowed = false;
      else throw error;
    }
    await processBooking({
      db: getFirestore(),
      requestRef: event.data.ref,
      uid: event.params.uid,
      accountAllowed: allowed,
      timestamp: () => FieldValue.serverTimestamp(),
      expiresAt: Timestamp.fromMillis(Date.now() + 7 * 86400000),
    });
  },
);
cloudEvent("canopyBookingRequest", canopyBookingRequest);
