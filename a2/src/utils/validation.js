// Three different kinds of check: required text, email format, and a number range.
export function validateInterest(form) {
  const errors = {};

  if (!form.name.trim()) {
    errors.name = "Please enter your name.";
  }

  if (!form.email.trim()) {
    errors.email = "Please enter your email address.";
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) {
    errors.email = "Please enter an email address like maya@example.com.";
  }

  const people = Number(form.partySize);
  if (String(form.partySize).trim() === "") {
    errors.partySize = "Please enter the number of people.";
  } else if (!Number.isInteger(people) || people < 1 || people > 10) {
    errors.partySize = "Please enter a whole number from 1 to 10.";
  }

  return errors;
}
