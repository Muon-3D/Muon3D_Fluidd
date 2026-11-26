import consola from "/.vite-e2e/4291/deps/consola.js?v=9b9fafc7";
import store from "/src/store/index.ts";
import { cloudState } from "/src/services/muon-cloud/state.ts";
import { useAuxApi } from "/src/aux_api/useAuxApi.ts";
import { hotspotState, normalizeStations } from "/src/services/hotspot/model.ts";
export const POLL_MS = 1e4;
export const MISSING_POLL_MS = 6e4;
export const MAX_FAILURES = 3;
let users = 0;
let timer = null;
let inFlight = false;
let slow = false;
let failures = 0;
let generation = 0;
let unwatch = null;
const visible = () => typeof document === "undefined" || document.visibilityState !== "hidden";
const connected = () => store.getters["socket/getConnectionState"] === true;
const printerKey = () => `${store.state.config?.apiUrl ?? ""}|${cloudState.activePrinterId ?? ""}`;
function forget() {
  hotspotState.stations = null;
  slow = false;
  failures = 0;
}
function clearTimer() {
  if (timer !== null) clearTimeout(timer);
  timer = null;
}
export async function pollHotspotOnce() {
  if (!connected()) {
    forget();
    return;
  }
  if (inFlight) return;
  inFlight = true;
  const gen = generation;
  try {
    const response = await useAuxApi().apStations();
    if (gen !== generation) return;
    hotspotState.stations = normalizeStations(response.data);
    slow = hotspotState.stations === null;
    failures = 0;
  } catch (e) {
    if (gen !== generation) return;
    const status = e?.response?.status;
    if (status === 404 || status === 403 || e?.name === "RemoteAuxRefused") {
      hotspotState.stations = null;
      slow = true;
      failures = 0;
    } else {
      failures++;
      if (failures >= MAX_FAILURES) {
        hotspotState.stations = null;
      } else {
        consola.debug("[hotspot] stations poll failed, keeping the last answer", e);
      }
    }
  } finally {
    if (gen === generation) inFlight = false;
  }
}
function schedule() {
  clearTimer();
  if (users === 0 || !visible() || !connected()) return;
  timer = setTimeout(async () => {
    timer = null;
    await pollHotspotOnce();
    schedule();
  }, slow ? MISSING_POLL_MS : POLL_MS);
}
function onVisibility() {
  if (users === 0) return;
  if (!visible()) {
    clearTimer();
    return;
  }
  pollHotspotOnce().then(schedule);
}
function onLineChanged() {
  generation++;
  inFlight = false;
  clearTimer();
  forget();
  if (users === 0 || !visible() || !connected()) return;
  pollHotspotOnce().then(schedule);
}
export function startHotspotPoll() {
  users++;
  if (users === 1) {
    document.addEventListener("visibilitychange", onVisibility);
    unwatch = store.watch(() => `${connected()}|${printerKey()}`, onLineChanged);
    if (visible()) pollHotspotOnce().then(schedule);
  }
  let stopped = false;
  return () => {
    if (stopped) return;
    stopped = true;
    users--;
    if (users === 0) {
      document.removeEventListener("visibilitychange", onVisibility);
      if (unwatch) unwatch();
      unwatch = null;
      clearTimer();
    }
  };
}

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbInBvbGxlci50cyJdLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgY29uc29sYSBmcm9tICdjb25zb2xhJ1xuaW1wb3J0IHN0b3JlIGZyb20gJ0Avc3RvcmUnXG5pbXBvcnQgeyBjbG91ZFN0YXRlIH0gZnJvbSAnQC9zZXJ2aWNlcy9tdW9uLWNsb3VkL3N0YXRlJ1xuaW1wb3J0IHsgdXNlQXV4QXBpIH0gZnJvbSAnQC9hdXhfYXBpL3VzZUF1eEFwaSdcbmltcG9ydCB7IGhvdHNwb3RTdGF0ZSwgbm9ybWFsaXplU3RhdGlvbnMgfSBmcm9tICcuL21vZGVsJ1xuXG4vKipcbiAqIE9uZSBsaWdodCBwb2xsIG9mIHRoZSBwcmludGVyJ3MgaG90c3BvdCBzdGF0aW9ucyAoS0FOLTQyOTcpLiBUaGUgcGFuZWwgbmV2ZXJcbiAqIHRha2VzIHByaW50ZXIgY29tcHV0ZSwgc28gaXQgaXMgb25lIHNtYWxsIEdFVCBhYm91dCBldmVyeSAxMCBzLCBwYXVzZWQgd2hpbGVcbiAqIHRoZSBwYWdlIGlzIGhpZGRlbiwgYW5kIHNsb3dlZCB0byBhIG1pbnV0ZSB3aGVuIHRoZSBwcmludGVyIGhhcyBubyBzdWNoXG4gKiByb3V0ZS4gQW55dGhpbmcgdGhhdCBzaG93cyB0aGUgY291bnQgc3RhcnRzIGl0IGFuZCBzdG9wcyBpdCB3aGVuIGl0IGdvZXMuXG4gKi9cbmV4cG9ydCBjb25zdCBQT0xMX01TID0gMTBfMDAwXG5leHBvcnQgY29uc3QgTUlTU0lOR19QT0xMX01TID0gNjBfMDAwXG5cbi8qKiBBZnRlciB0aGlzIG1hbnkgZmFpbHVyZXMgaW4gYSByb3cgdGhlIGxhc3QgY291bnQgaXMgbm8gbG9uZ2VyIGJlbGlldmFibGU6IHNob3cgbm90aGluZy4gKi9cbmV4cG9ydCBjb25zdCBNQVhfRkFJTFVSRVMgPSAzXG5cbmxldCB1c2VycyA9IDBcbmxldCB0aW1lcjogUmV0dXJuVHlwZTx0eXBlb2Ygc2V0VGltZW91dD4gfCBudWxsID0gbnVsbFxubGV0IGluRmxpZ2h0ID0gZmFsc2VcbmxldCBzbG93ID0gZmFsc2VcbmxldCBmYWlsdXJlcyA9IDBcbmxldCBnZW5lcmF0aW9uID0gMFxubGV0IHVud2F0Y2g6ICgoKSA9PiB2b2lkKSB8IG51bGwgPSBudWxsXG5cbmNvbnN0IHZpc2libGUgPSAoKSA9PiB0eXBlb2YgZG9jdW1lbnQgPT09ICd1bmRlZmluZWQnIHx8IGRvY3VtZW50LnZpc2liaWxpdHlTdGF0ZSAhPT0gJ2hpZGRlbidcbmNvbnN0IGNvbm5lY3RlZCA9ICgpID0+IHN0b3JlLmdldHRlcnNbJ3NvY2tldC9nZXRDb25uZWN0aW9uU3RhdGUnXSA9PT0gdHJ1ZVxuY29uc3QgcHJpbnRlcktleSA9ICgpID0+IGAke3N0b3JlLnN0YXRlLmNvbmZpZz8uYXBpVXJsID8/ICcnfXwke2Nsb3VkU3RhdGUuYWN0aXZlUHJpbnRlcklkID8/ICcnfWBcblxuZnVuY3Rpb24gZm9yZ2V0ICgpIHtcbiAgaG90c3BvdFN0YXRlLnN0YXRpb25zID0gbnVsbFxuICBzbG93ID0gZmFsc2VcbiAgZmFpbHVyZXMgPSAwXG59XG5cbmZ1bmN0aW9uIGNsZWFyVGltZXIgKCkge1xuICBpZiAodGltZXIgIT09IG51bGwpIGNsZWFyVGltZW91dCh0aW1lcilcbiAgdGltZXIgPSBudWxsXG59XG5cbi8qKiBGZXRjaCBvbmNlLiBSZXNvbHZlcyB3aGVuIHRoZSBzaGFyZWQgc3RhdGUgaXMgdXBkYXRlZC4gRXhwb3J0ZWQgZm9yIHRlc3RzLiAqL1xuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIHBvbGxIb3RzcG90T25jZSAoKTogUHJvbWlzZTx2b2lkPiB7XG4gIGlmICghY29ubmVjdGVkKCkpIHtcbiAgICAvLyBObyBwcmludGVyIG9uIHRoZSBsaW5lOiBub3RoaW5nIHRvIGFzaywgYW5kIG5vdGhpbmcgdHJ1ZSB0byBzaG93LlxuICAgIGZvcmdldCgpXG4gICAgcmV0dXJuXG4gIH1cbiAgaWYgKGluRmxpZ2h0KSByZXR1cm5cbiAgaW5GbGlnaHQgPSB0cnVlXG4gIGNvbnN0IGdlbiA9IGdlbmVyYXRpb25cbiAgdHJ5IHtcbiAgICBjb25zdCByZXNwb25zZSA9IGF3YWl0IHVzZUF1eEFwaSgpLmFwU3RhdGlvbnMoKVxuICAgIGlmIChnZW4gIT09IGdlbmVyYXRpb24pIHJldHVyblxuICAgIGhvdHNwb3RTdGF0ZS5zdGF0aW9ucyA9IG5vcm1hbGl6ZVN0YXRpb25zKHJlc3BvbnNlLmRhdGEpXG4gICAgc2xvdyA9IGhvdHNwb3RTdGF0ZS5zdGF0aW9ucyA9PT0gbnVsbFxuICAgIGZhaWx1cmVzID0gMFxuICB9IGNhdGNoIChlKSB7XG4gICAgaWYgKGdlbiAhPT0gZ2VuZXJhdGlvbikgcmV0dXJuXG4gICAgY29uc3Qgc3RhdHVzID0gKGUgYXMgeyByZXNwb25zZT86IHsgc3RhdHVzPzogbnVtYmVyIH0gfSk/LnJlc3BvbnNlPy5zdGF0dXNcbiAgICBpZiAoc3RhdHVzID09PSA0MDQgfHwgc3RhdHVzID09PSA0MDMgfHwgKGUgYXMgRXJyb3IpPy5uYW1lID09PSAnUmVtb3RlQXV4UmVmdXNlZCcpIHtcbiAgICAgIC8vIFRoaXMgcHJpbnRlciBvciByb3V0ZSBoYXMgbm8gc3VjaCBhbnN3ZXI6IHNob3cgbm90aGluZy5cbiAgICAgIGhvdHNwb3RTdGF0ZS5zdGF0aW9ucyA9IG51bGxcbiAgICAgIHNsb3cgPSB0cnVlXG4gICAgICBmYWlsdXJlcyA9IDBcbiAgICB9IGVsc2Uge1xuICAgICAgZmFpbHVyZXMrK1xuICAgICAgaWYgKGZhaWx1cmVzID49IE1BWF9GQUlMVVJFUykge1xuICAgICAgICBob3RzcG90U3RhdGUuc3RhdGlvbnMgPSBudWxsXG4gICAgICB9IGVsc2Uge1xuICAgICAgICBjb25zb2xhLmRlYnVnKCdbaG90c3BvdF0gc3RhdGlvbnMgcG9sbCBmYWlsZWQsIGtlZXBpbmcgdGhlIGxhc3QgYW5zd2VyJywgZSlcbiAgICAgIH1cbiAgICB9XG4gIH0gZmluYWxseSB7XG4gICAgaWYgKGdlbiA9PT0gZ2VuZXJhdGlvbikgaW5GbGlnaHQgPSBmYWxzZVxuICB9XG59XG5cbmZ1bmN0aW9uIHNjaGVkdWxlICgpIHtcbiAgY2xlYXJUaW1lcigpXG4gIGlmICh1c2VycyA9PT0gMCB8fCAhdmlzaWJsZSgpIHx8ICFjb25uZWN0ZWQoKSkgcmV0dXJuXG4gIHRpbWVyID0gc2V0VGltZW91dChhc3luYyAoKSA9PiB7XG4gICAgdGltZXIgPSBudWxsXG4gICAgYXdhaXQgcG9sbEhvdHNwb3RPbmNlKClcbiAgICBzY2hlZHVsZSgpXG4gIH0sIHNsb3cgPyBNSVNTSU5HX1BPTExfTVMgOiBQT0xMX01TKVxufVxuXG5mdW5jdGlvbiBvblZpc2liaWxpdHkgKCkge1xuICBpZiAodXNlcnMgPT09IDApIHJldHVyblxuICBpZiAoIXZpc2libGUoKSkge1xuICAgIGNsZWFyVGltZXIoKVxuICAgIHJldHVyblxuICB9XG4gIC8vIEJhY2sgb24gc2NyZWVuOiBhc2sgbm93LCB0aGVuIGNhcnJ5IG9uLlxuICBwb2xsSG90c3BvdE9uY2UoKS50aGVuKHNjaGVkdWxlKVxufVxuXG4vKiogVGhlIHByaW50ZXIgc3dpdGNoZWQgb3IgdGhlIGNvbm5lY3Rpb24gY2FtZSBvciB3ZW50OiBkcm9wIHRoZSBvbGQgYW5zd2VyLCB0aGVuIGFzayBhZ2FpbiBhdCBvbmNlLiAqL1xuZnVuY3Rpb24gb25MaW5lQ2hhbmdlZCAoKSB7XG4gIGdlbmVyYXRpb24rK1xuICBpbkZsaWdodCA9IGZhbHNlXG4gIGNsZWFyVGltZXIoKVxuICBmb3JnZXQoKVxuICBpZiAodXNlcnMgPT09IDAgfHwgIXZpc2libGUoKSB8fCAhY29ubmVjdGVkKCkpIHJldHVyblxuICBwb2xsSG90c3BvdE9uY2UoKS50aGVuKHNjaGVkdWxlKVxufVxuXG4vKiogU3RhcnQgcG9sbGluZzsgcmV0dXJucyB0aGUgc3RvcCBmdW5jdGlvbi4gU2V2ZXJhbCBjYWxsZXJzIHNoYXJlIG9uZSBwb2xsLiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHN0YXJ0SG90c3BvdFBvbGwgKCk6ICgpID0+IHZvaWQge1xuICB1c2VycysrXG4gIGlmICh1c2VycyA9PT0gMSkge1xuICAgIGRvY3VtZW50LmFkZEV2ZW50TGlzdGVuZXIoJ3Zpc2liaWxpdHljaGFuZ2UnLCBvblZpc2liaWxpdHkpXG4gICAgdW53YXRjaCA9IHN0b3JlLndhdGNoKCgpID0+IGAke2Nvbm5lY3RlZCgpfXwke3ByaW50ZXJLZXkoKX1gLCBvbkxpbmVDaGFuZ2VkKVxuICAgIGlmICh2aXNpYmxlKCkpIHBvbGxIb3RzcG90T25jZSgpLnRoZW4oc2NoZWR1bGUpXG4gIH1cbiAgbGV0IHN0b3BwZWQgPSBmYWxzZVxuICByZXR1cm4gKCkgPT4ge1xuICAgIGlmIChzdG9wcGVkKSByZXR1cm5cbiAgICBzdG9wcGVkID0gdHJ1ZVxuICAgIHVzZXJzLS1cbiAgICBpZiAodXNlcnMgPT09IDApIHtcbiAgICAgIGRvY3VtZW50LnJlbW92ZUV2ZW50TGlzdGVuZXIoJ3Zpc2liaWxpdHljaGFuZ2UnLCBvblZpc2liaWxpdHkpXG4gICAgICBpZiAodW53YXRjaCkgdW53YXRjaCgpXG4gICAgICB1bndhdGNoID0gbnVsbFxuICAgICAgY2xlYXJUaW1lcigpXG4gICAgfVxuICB9XG59XG4iXSwibWFwcGluZ3MiOiJBQUFBLE9BQU8sYUFBYTtBQUNwQixPQUFPLFdBQVc7QUFDbEIsU0FBUyxrQkFBa0I7QUFDM0IsU0FBUyxpQkFBaUI7QUFDMUIsU0FBUyxjQUFjLHlCQUF5QjtBQVF6QyxhQUFNLFVBQVU7QUFDaEIsYUFBTSxrQkFBa0I7QUFHeEIsYUFBTSxlQUFlO0FBRTVCLElBQUksUUFBUTtBQUNaLElBQUksUUFBOEM7QUFDbEQsSUFBSSxXQUFXO0FBQ2YsSUFBSSxPQUFPO0FBQ1gsSUFBSSxXQUFXO0FBQ2YsSUFBSSxhQUFhO0FBQ2pCLElBQUksVUFBK0I7QUFFbkMsTUFBTSxVQUFVLE1BQU0sT0FBTyxhQUFhLGVBQWUsU0FBUyxvQkFBb0I7QUFDdEYsTUFBTSxZQUFZLE1BQU0sTUFBTSxRQUFRLDJCQUEyQixNQUFNO0FBQ3ZFLE1BQU0sYUFBYSxNQUFNLEdBQUcsTUFBTSxNQUFNLFFBQVEsVUFBVSxFQUFFLElBQUksV0FBVyxtQkFBbUIsRUFBRTtBQUVo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