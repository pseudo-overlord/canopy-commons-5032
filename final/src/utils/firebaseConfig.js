export const FIREBASE_PROJECT = "cedar-falls-261029";

// These client settings are public identifiers, not secrets. Service
// credentials do not belong here.
export function firebaseConfig(env = {}) {
  const fields = {
    apiKey: "VITE_FIREBASE_API_KEY",
    authDomain: "VITE_FIREBASE_AUTH_DOMAIN",
    projectId: "VITE_FIREBASE_PROJECT_ID",
    appId: "VITE_FIREBASE_APP_ID",
  };
  const config = {};
  for (const [field, key] of Object.entries(fields)) {
    if (typeof env[key] !== "string" || !env[key].trim()) {
      throw new Error(`Missing Firebase setting: ${key}`);
    }
    config[field] = env[key].trim();
  }
  if (config.projectId !== FIREBASE_PROJECT) {
    throw new Error(
      "Firebase project does not match the approved Canopy project.",
    );
  }
  if (config.authDomain !== `${FIREBASE_PROJECT}.firebaseapp.com`) {
    throw new Error("Unexpected Firebase authentication domain.");
  }
  return config;
}
