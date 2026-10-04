import { initializeApp, getApps } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { firebaseConfig } from "./utils/firebaseConfig.js";

// Start Firebase only when it is first needed, so demo mode still runs without
// any Firebase settings. Only the public client settings belong here.
export function getFirebaseServices() {
  const config = firebaseConfig(import.meta.env);
  const app =
    getApps().find((item) => item.name === "canopy-commons") ??
    initializeApp(config, "canopy-commons");
  return { app, auth: getAuth(app), db: getFirestore(app) };
}
