import bcrypt from "bcryptjs";

// bcryptjs measures the password in bytes rather than characters, so some
// letters and emoji count as more than one.
export function passwordError(password) {
  if (typeof password !== "string" || !password)
    return "Please enter a password.";
  if (password.length < 8) return "Use a password of at least 8 characters.";
  if (bcrypt.truncates(password)) {
    return "That password is too long. Accented letters and emoji take up more room than plain letters, so try a shorter one.";
  }
  return "";
}

// New passwords use keyboard characters only: letters, numbers and symbols.
// Each of those is one byte, so a 72 character limit matches bcrypt's limit.
const KEYBOARD = /^[!-~]$/;
export const PASSWORD_MAX = 72;

export function characterWarning(password) {
  const bad = [...new Set([...(password ?? "")])].filter(
    (char) => !KEYBOARD.test(char),
  );
  if (!bad.length) return "";
  const names = bad
    .slice(0, 3)
    .map((char) => (char === " " ? "spaces" : `“${char}”`));
  const list =
    names.length > 1
      ? `${names.slice(0, -1).join(", ")} and ${names.at(-1)}`
      : names[0];
  const start = list[0].toUpperCase() + list.slice(1);
  return `${start} can't be used. Use letters, numbers and keyboard symbols only.`;
}

// Checks for a password chosen when creating an account.
export function newPasswordError(password) {
  if (typeof password !== "string" || !password)
    return "Please enter a password.";
  const warning = characterWarning(password);
  if (warning) return warning;
  if (password.length < 8) return "Use a password of at least 8 characters.";
  if (password.length > PASSWORD_MAX)
    return `Use a password of no more than ${PASSWORD_MAX} characters.`;
  return "";
}
