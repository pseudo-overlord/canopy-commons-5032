import { melbourneCoordinates } from "./map.js";
const textFields = [
  "id",
  "title",
  "suburb",
  "place",
  "activityType",
  "accessibilityNotes",
  "description",
  "bring",
  "art",
  "mapLocationLabel",
];
export function validateOpportunities(data) {
  if (!Array.isArray(data)) throw new Error("Activities must be a list.");
  const ids = new Set();
  for (const item of data) {
    if (
      !item ||
      textFields.some(
        (field) => typeof item[field] !== "string" || !item[field].trim(),
      ) ||
      !/^[a-z0-9-]+$/.test(item.id) ||
      !/^[a-z0-9-]+$/.test(item.art) ||
      typeof item.startsAt !== "string" ||
      !Number.isFinite(Date.parse(item.startsAt)) ||
      !Number.isInteger(item.durationMinutes) ||
      item.durationMinutes <= 0 ||
      typeof item.beginnerFriendly !== "boolean" ||
      typeof item.featured !== "boolean" ||
      ids.has(item.id)
    ) {
      throw new Error(
        "The activity list contains missing, invalid or duplicate details.",
      );
    }
    if (!melbourneCoordinates(item.longitude, item.latitude))
      throw new Error(
        "An activity has an invalid Melbourne map reference point.",
      );
    ids.add(item.id);
  }
  return data;
}
