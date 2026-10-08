// The backend is chosen once at startup. Demo mode and Firebase mode are
// separate, so a Firebase problem does not quietly fall back to demo accounts.
export const cloudMode = import.meta.env?.VITE_AUTH_MODE === "firebase";
const backend = cloudMode
  ? await import("./cloudAuth.js")
  : await import("./auth.js");
export const {
  currentUser,
  authError,
  register,
  login,
  logout,
  restoreSession,
  initialiseAccounts,
  readAccounts,
  hasRole,
} = backend;
export const requestVerification = backend.requestVerification;
export const refreshVerification = backend.refreshVerification;
export const resetPassword = backend.resetPassword;
