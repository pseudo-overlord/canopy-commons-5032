import { ref } from "vue";
export const online = ref(navigator.onLine);
export const offlineReady = ref(false);
export const offlineBusy = ref(false);
export const offlineError = ref("");
export const offlinePreparedAt = ref("");
export const offlineUpdate = ref(false);
let registration;
let reloadForUpdate = false;
let started = false;
const observed = new WeakSet();
const ours = (reg) =>
  reg &&
  [reg.active, reg.waiting, reg.installing].some(
    (worker) => worker && new URL(worker.scriptURL).pathname === "/sw.js",
  );
function ask(worker, type) {
  return new Promise((resolve, reject) => {
    if (!worker) {
      reject(Error("The offline copy is not ready yet."));
      return;
    }
    const channel = new MessageChannel(),
      timer = setTimeout(() => {
        channel.port1.close();
        reject(Error("The public download timed out. Reconnect and retry."));
      }, 30000);
    channel.port1.onmessage = (event) => {
      clearTimeout(timer);
      channel.port1.close();
      event.data?.error ? reject(Error(event.data.error)) : resolve(event.data);
    };
    worker.postMessage({ type }, [channel.port2]);
  });
}
function adopt(data) {
  offlineReady.value = data.ready === true;
  offlinePreparedAt.value = data.preparedAt || "";
}
function observe(reg) {
  registration = reg;
  offlineUpdate.value = !!reg.waiting;
  if (observed.has(reg)) return;
  observed.add(reg);
  const track = () => {
    const worker = reg.installing;
    worker?.addEventListener("statechange", () => {
      if (worker.state === "installed" && reg.active)
        offlineUpdate.value = true;
      if (worker.state === "activated") refreshOffline();
    });
  };
  reg.addEventListener("updatefound", track);
  track();
}
export async function refreshOffline() {
  if (!("serviceWorker" in navigator)) return;
  try {
    const reg = await navigator.serviceWorker.getRegistration("/");
    if (!ours(reg)) {
      adopt({ ready: false });
      return;
    }
    registration = reg;
    offlineUpdate.value = !!reg.waiting;
    adopt(await ask(reg.active, "STATUS"));
  } catch {
    offlineReady.value = false;
  }
}
export async function initialiseOffline() {
  if (started) return;
  started = true;
  window.addEventListener("online", () => {
    online.value = true;
    refreshOffline();
  });
  window.addEventListener("offline", () => {
    online.value = false;
  });
  if (!("serviceWorker" in navigator)) return;
  navigator.serviceWorker.addEventListener("controllerchange", () => {
    if (reloadForUpdate) location.reload();
    else refreshOffline();
  });
  const reg = await navigator.serviceWorker.getRegistration("/");
  if (ours(reg)) {
    observe(reg);
    await refreshOffline();
    if (navigator.onLine) reg.update().catch(() => {});
  }
}
export async function prepareOffline() {
  if (offlineBusy.value) return;
  offlineBusy.value = true;
  offlineError.value = "";
  try {
    if (!navigator.onLine)
      throw Error(
        "Connect before preparing or updating the public copy. Your saved list still works offline.",
      );
    if (!("serviceWorker" in navigator) || !window.isSecureContext)
      throw Error(
        "This browser cannot prepare offline pages. Use the HTTPS site in a current browser.",
      );
    const old = await navigator.serviceWorker.getRegistration("/");
    if (old && !ours(old))
      throw Error(
        "Another offline service is already using this site. No data was changed.",
      );
    const reg = await navigator.serviceWorker.register("/sw.js", {
      scope: "/",
      updateViaCache: "none",
    });
    observe(reg);
    if (reg.active) await reg.update();
    if (!reg.active) {
      let timer;
      try {
        await Promise.race([
          navigator.serviceWorker.ready,
          new Promise((_, reject) => {
            timer = setTimeout(
              () =>
                reject(
                  Error(
                    "The public download did not finish. Check your connection and retry.",
                  ),
                ),
              30000,
            );
          }),
        ]);
      } finally {
        clearTimeout(timer);
      }
    }
    if (reg.waiting) {
      offlineUpdate.value = true;
      return;
    }
    const state = await ask(reg.active, "STATUS");
    adopt(state);
    if (!state.ready) adopt(await ask(reg.active, "PREPARE"));
  } catch (error) {
    offlineError.value = error.message;
  } finally {
    offlineBusy.value = false;
  }
}
export function applyOfflineUpdate() {
  if (!registration?.waiting) return;
  reloadForUpdate = true;
  registration.waiting.postMessage({ type: "ACTIVATE_UPDATE" });
}
export async function removeOffline() {
  if (offlineBusy.value) return;
  offlineBusy.value = true;
  offlineError.value = "";
  try {
    const reg = await navigator.serviceWorker.getRegistration("/");
    if (ours(reg)) await reg.unregister();
    for (const name of await caches.keys())
      if (name.startsWith("canopy-public-v1-")) await caches.delete(name);
    registration = undefined;
    offlineUpdate.value = false;
    adopt({ ready: false });
  } catch {
    offlineError.value =
      "Could not remove the public copy. Browser storage may be unavailable. Your saved list was kept.";
  } finally {
    offlineBusy.value = false;
  }
}
