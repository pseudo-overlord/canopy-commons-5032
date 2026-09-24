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
