import { ref } from "vue";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
  onIdTokenChanged,
  sendEmailVerification,
  sendPasswordResetEmail,
  setPersistence,
  browserSessionPersistence,
} from "firebase/auth";
import { doc, setDoc, getDoc, getDocs, collection } from "firebase/firestore";
import { getFirebaseServices } from "./firebase.js";
import { passwordError } from "./utils/password.js";
import { createCloudSession } from "./utils/cloudSession.js";

const { auth, db } = getFirebaseServices();
// Keep the sign in to this tab so it ends when the tab is closed.
await setPersistence(auth, browserSessionPersistence);
export const currentUser = ref(null);
export const authError = ref("");
const session = createCloudSession({
  auth,
  signIn: (email, password) =>
    signInWithEmailAndPassword(auth, email, password),
  signOut: () => signOut(auth),
  publish: (user) => {
    currentUser.value = user;
  },
  claims: (user, refresh) => user.getIdTokenResult(refresh),
  recoverProfile: async (user) => {
    const profile = doc(db, "canopyUsers", user.uid);
    if (!(await getDoc(profile)).exists())
      await setDoc(profile, {
        name: user.displayName || "Volunteer",
        email: user.email,
      });
  },
});
export const authReady = new Promise((resolve) => {
  onIdTokenChanged(
    auth,
    async (user) => {
      try {
        await session.observe(user);
        authError.value = "";
      } catch {
        currentUser.value = null;
        authError.value =
          "Your account could not be verified. Please log in again.";
      } finally {
        resolve();
      }
    },
    () => {
      authError.value =
        "Authentication is unavailable. Please reload and try again.";
      resolve();
    },
  );
});

function credentials(email, password) {
  if (
    typeof email !== "string" ||
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())
  )
    throw new Error("Please enter a valid email address.");
  const error = passwordError(password);
  if (error) throw new Error(error);
  return email.trim().toLowerCase();
}
export async function register(name, email, password) {
  if (typeof name !== "string" || !name.trim() || name.trim().length > 100)
    throw new Error("Use a name between 1 and 100 characters.");
  const address = credentials(email, password);
  const { user } = await createUserWithEmailAndPassword(
    auth,
    address,
    password,
  );
  try {
    await updateProfile(user, { displayName: name.trim() });
    await setDoc(doc(db, "canopyUsers", user.uid), {
      name: name.trim(),
      email: address,
    });
  } catch {
    throw new Error(
      "Your sign-in account was created, but the profile could not be saved. Log in to recover your account; do not register again.",
    );
  } finally {
    await signOut(auth);
  }
}
export async function login(email, password) {
  await session.login(credentials(email, password), password);
}
export async function logout() {
  await session.logout();
}
export async function restoreSession() {
  await authReady;
}
export async function initialiseAccounts() {
  await authReady;
}
export function hasRole(role) {
  return currentUser.value?.role === role;
}
export async function readAccounts() {
  if (!hasRole("coordinator"))
    throw new Error("Coordinator access is required.");
  const snapshot = await getDocs(collection(db, "canopyUsers"));
  // The role comes from the saved profile and is only used for display.
  return snapshot.docs.map((item) => ({
    uid: item.id,
    name: item.data().name,
    email: item.data().email,
    role: item.data().role === "coordinator" ? "coordinator" : "volunteer",
  }));
}
export async function requestVerification() {
  if (!auth.currentUser) throw new Error("Please log in first.");
  await sendEmailVerification(auth.currentUser);
}
export async function refreshVerification() {
  await auth.currentUser?.reload();
  await auth.currentUser?.getIdToken(true);
}
export async function resetPassword(email) {
  await sendPasswordResetEmail(auth, email.trim());
}
