import { ref } from "vue";
import bcrypt from "bcryptjs";
import { readCollection, withWriteLock, writeCollection } from "./storage.js";
import { passwordError } from "./utils/password.js";

// Educational browser-only accounts, not a trusted identity service.
// Keep existing keys and records; never reset storage automatically.
const ACCOUNTS_KEY = "canopy-accounts";
const SESSION_KEY = "canopy-session";
const DEMO_EMAIL = "coordinator@example.com";
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const currentUser = ref(null);
export const authError = ref("");
let sessionRemovalPending = false;
let authRevision = 0;

function validAccounts(accounts) {
  const emails = new Set();
  return accounts.every((account) => {
    if (
      !account ||
      typeof account.name !== "string" ||
      !account.name.trim() ||
      typeof account.email !== "string" ||
      !EMAIL.test(account.email) ||
      account.email !== account.email.trim().toLowerCase() ||
      !["volunteer", "coordinator"].includes(account.role) ||
      typeof account.passwordHash !== "string" ||
      !/^\$2[aby]\$\d{2}\$[./A-Za-z0-9]{53}$/.test(account.passwordHash) ||
      emails.has(account.email)
    )
      return false;
    emails.add(account.email);
    return true;
  });
}

export function readAccounts() {
  return readCollection(ACCOUNTS_KEY, validAccounts, "accounts");
}

function checkedEmail(email) {
  if (typeof email !== "string" || !EMAIL.test(email.trim())) {
    throw new Error("Please enter a valid email address.");
  }
  return email.trim().toLowerCase();
}

function checkPassword(password) {
  const error = passwordError(password);
  if (error) throw new Error(error);
}

function publicAccount(account) {
  return { email: account.email, name: account.name, role: account.role };
}

export async function register(name, email, password) {
  if (typeof name !== "string" || !name.trim())
    throw new Error("Please enter your name.");
  const cleanEmail = checkedEmail(email);
  checkPassword(password);

  // Hashing takes a moment, so do it before taking the lock.
  const passwordHash = await bcrypt.hash(password, 10);
  await withWriteLock(() => {
    const accounts = readAccounts();
    if (accounts.some((account) => account.email === cleanEmail)) {
      throw new Error("That email is already registered. Try logging in.");
    }
    accounts.push({
      name: name.trim(),
      email: cleanEmail,
      role: "volunteer",
      passwordHash,
    });
    writeCollection(ACCOUNTS_KEY, accounts, "accounts");
  });
}

export async function login(email, password) {
  const cleanEmail = checkedEmail(email);
  checkPassword(password);
  const attempt = ++authRevision;
  const account = readAccounts().find((item) => item.email === cleanEmail);
  const failed = new Error("Email or password is incorrect.");
  if (!account || !(await bcrypt.compare(password, account.passwordHash)))
    throw failed;
  if (attempt !== authRevision)
    throw new Error("Sign-in was cancelled. Please try again.");

  const session = publicAccount(account);
  try {
    globalThis.sessionStorage.setItem(SESSION_KEY, JSON.stringify(session));
  } catch {
    throw new Error(
      "Could not start a session. Allow site storage and try logging in again.",
    );
  }
  currentUser.value = session;
  sessionRemovalPending = false;
}

export function logout() {
  authRevision += 1;
  try {
    globalThis.sessionStorage.removeItem(SESSION_KEY);
    sessionRemovalPending = false;
    authError.value = "";
  } catch {
    sessionRemovalPending = true;
    authError.value =
      "This tab is signed out, but the saved session could not be removed. Close this tab before using a shared device.";
  }
  currentUser.value = null;
}

export function restoreSession() {
  if (sessionRemovalPending) return;
  try {
    const session = JSON.parse(globalThis.sessionStorage.getItem(SESSION_KEY));
    const account =
      session && readAccounts().find((item) => item.email === session.email);
    currentUser.value = account ? publicAccount(account) : null;
    authError.value = "";
  } catch {
    currentUser.value = null;
    authError.value =
      "The saved session could not be restored. Existing data has been preserved; check site storage and log in again.";
  }
}

export function hasRole(role) {
  return currentUser.value?.role === role;
}

export function accountCount() {
  return readAccounts().length;
}

export async function seedCoordinator() {
  if (readAccounts().some((account) => account.role === "coordinator")) return;
  const passwordHash = await bcrypt.hash("coordinator123", 10);
  await withWriteLock(() => {
    const accounts = readAccounts();
    if (accounts.some((account) => account.role === "coordinator")) return;
    if (accounts.some((account) => account.email === DEMO_EMAIL)) {
      throw new Error(
        "The demo coordinator email is already in use. Existing accounts have been preserved.",
      );
    }
    accounts.push({
      name: "Priya Nair",
      email: DEMO_EMAIL,
      role: "coordinator",
      passwordHash,
    });
    writeCollection(ACCOUNTS_KEY, accounts, "accounts");
  });
}

export async function initialiseAccounts() {
  if (sessionRemovalPending) {
    logout();
    return;
  }
  try {
    await seedCoordinator();
    // Do not clear the message if a log out is still finishing.
    if (!sessionRemovalPending) authError.value = "";
  } catch (error) {
    authError.value = error.message;
  }
}
