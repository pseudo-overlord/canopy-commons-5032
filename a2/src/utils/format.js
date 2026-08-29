export function formatDate(value) {
  return new Date(value).toLocaleDateString("en-AU", {
    weekday: "short",
    day: "numeric",
    month: "short",
  });
}

export function formatTime(value) {
  return new Date(value).toLocaleTimeString("en-AU", {
    hour: "numeric",
    minute: "2-digit",
  });
}

export function formatDuration(minutes) {
  if (minutes < 60) return `${minutes} minutes`;
  const hours = minutes / 60;
  return hours === 1 ? "1 hour" : `${hours} hours`;
}
