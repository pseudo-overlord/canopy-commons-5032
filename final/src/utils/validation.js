import { passwordError } from "./password.js";

// Three different kinds of check: required text, email format, and a number range.
export function validateInterest(form) {
  const errors = {};

  if (!form.name.trim()) {
    errors.name = "Please enter your name.";
  }

  if (!form.email.trim()) {
    errors.email = "Please enter your email address.";
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) {
    errors.email = "Please enter an email address like alexmurphy@example.com.";
  }

  const people = Number(form.partySize);
  if (String(form.partySize).trim() === "") {
    errors.partySize = "Please enter the number of people.";
  } else if (!Number.isInteger(people) || people < 1 || people > 10) {
    errors.partySize = "Please enter a whole number from 1 to 10.";
  }

  return errors;
}

// Checks for the register and login forms.
export function validateAccount(form, isRegistration) {
  const errors = {};

  if (isRegistration && !form.name.trim()) {
    errors.name = "Please enter your name.";
  }

  if (!form.email.trim()) {
    errors.email = "Please enter your email address.";
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) {
    errors.email = "Please enter an email address like alexmurphy@example.com.";
  }

  const passwordMessage = passwordError(form.password);
  if (passwordMessage) errors.password = passwordMessage;

  if (isRegistration && form.confirmPassword !== form.password) {
    errors.confirmPassword = "The passwords do not match.";
  }

  return errors;
}
