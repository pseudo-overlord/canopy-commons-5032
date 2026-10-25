export const savedKey = "canopy.saved-activities";
export function parseSaved(raw) {
  if (raw === null) return { version: 1, ids: [] };
  let data;
  try {
    data = JSON.parse(raw);
  } catch {
    throw new Error(
      "The saved list could not be read. Your stored data was kept.",
    );
  }
  const ids =
    data?.version === 0 ? data.savedIds : data?.version === 1 ? data.ids : null;
  if (
    !Array.isArray(ids) ||
    ids.length > 50 ||
    ids.some(
      (id) => typeof id !== "string" || !/^[a-z0-9-]{1,100}$/.test(id),
    ) ||
    new Set(ids).size !== ids.length
  )
    throw new Error(
      "The saved list has an unsupported format. Your stored data was kept.",
    );
  return { version: 1, ids: [...ids] };
}
export function createSavedStore({ storage, locks, now = () => Date.now() }) {
  function load() {
    return parseSaved(storage.getItem(savedKey));
  }
  async function toggle(id) {
    if (typeof id !== "string" || !/^[a-z0-9-]{1,100}$/.test(id))
      throw new Error("This activity cannot be saved.");
    if (!locks?.request)
      throw new Error(
        "This browser cannot safely update a shared saved list. Use a current browser with Web Locks support.",
      );
    return locks.request(savedKey, { mode: "exclusive" }, () => {
      const data = load(),
        exists = data.ids.includes(id);
      if (!exists && data.ids.length >= 50)
        throw new Error(
          "Your list is full (50 activities). Remove one before saving another.",
        );
      const ids = exists
        ? data.ids.filter((item) => item !== id)
        : [...data.ids, id];
      storage.setItem(
        savedKey,
        JSON.stringify({
          version: 1,
          ids,
          updatedAt: new Date(now()).toISOString(),
        }),
      );
      return { version: 1, ids };
    });
  }
  return { load, toggle };
}
