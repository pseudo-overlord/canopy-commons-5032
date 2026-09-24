// All tabs share one lock, so reading, checking and writing happen together
// and two tabs cannot save over each other.
export async function withWriteLock(work) {
  const locks = globalThis.navigator?.locks;
  if (!locks?.request) {
    throw new Error(
      "This browser cannot safely save accounts or ratings. Use a current browser on HTTPS or localhost. Existing data has not been changed.",
    );
  }
  return locks.request("canopy-records-write", work);
}

export function readCollection(key, valid, label) {
  let raw;
  try {
    raw = globalThis.localStorage.getItem(key);
  } catch {
    throw new Error(
      `Could not read ${label} in this browser. Allow site storage and try again.`,
    );
  }
  if (raw === null) return [];
  let records;
  try {
    records = JSON.parse(raw);
  } catch {
    throw new Error(
      `Saved ${label} could not be read. Existing data has been preserved.`,
    );
  }
  if (!Array.isArray(records) || !valid(records)) {
    throw new Error(
      `Saved ${label} has an invalid format. Existing data has been preserved.`,
    );
  }
  return records;
}

export function writeCollection(key, records, label) {
  try {
    globalThis.localStorage.setItem(key, JSON.stringify(records));
  } catch {
    throw new Error(
      `Could not save ${label} in this browser. Please allow site storage or free space, then try again.`,
    );
  }
}
