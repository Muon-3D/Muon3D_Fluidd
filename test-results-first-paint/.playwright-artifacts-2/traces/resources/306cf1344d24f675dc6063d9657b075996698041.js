import.meta.env = {"BASE_URL": "/", "BUILD_COMMIT": "d1270d4565e29ad81538c770c7dd4b9bf74ff076", "DEV": true, "HASH": "d1270d4\n", "MODE": "development", "PROD": false, "SSR": false, "VERSION": "1.31.0-rc.7", "VITE_CONTROL_FIRST_PAINT": "true", "VUE_APP_I18N_FALLBACK_LOCALE": "en", "VUE_APP_I18N_LOCALE": "en", "VUE_MUON_SLICER_URL": "/slicer/embed.html"};import Vue from "/.vite-e2e/4291/deps/vue.js?v=9b9fafc7";
import { createAdapter } from "/src/services/foreign-printers/adapters/index.ts";
import { foreignRegistry, setForeignRecords } from "/src/services/foreign-printers/registry.ts";
import { forgetForeign, getCredentials, listForeign } from "/src/services/foreign-printers/store.ts";
const emptyStatus = () => ({
  state: "connecting",
  message: null,
  file: null,
  progress: null,
  timeLeft: null,
  temps: [],
  cameraUrl: null
});
const demoRecords = [
  {
    id: "demo-voron",
    kind: "moonraker",
    name: "Workshop Voron",
    model: "Voron 2.4",
    host: "192.168.1.25",
    via: "direct",
    formFactor: "open-frame",
    credentialsRef: null,
    addedAt: 0
  },
  {
    id: "demo-octoprint",
    kind: "octoprint",
    name: "Garden Printer",
    model: "Ender 3",
    host: "192.168.1.26",
    via: "direct",
    formFactor: "bed-slinger",
    credentialsRef: null,
    addedAt: 0
  },
  {
    id: "demo-bambu",
    kind: "bambu",
    name: "Studio X1",
    model: "X1 Carbon",
    host: "192.168.1.27",
    via: "m1",
    m1Name: "Muon M1",
    formFactor: "enclosed",
    credentialsRef: null,
    addedAt: 0
  }
];
const demoStatuses = {
  "demo-voron": {
    state: "printing",
    message: "Printing",
    file: "bracket.gcode",
    progress: 0.62,
    timeLeft: 1800,
    temps: [{ id: "nozzle", actual: 214, target: 215 }, { id: "bed", actual: 59, target: 60 }],
    cameraUrl: "http://192.168.1.25/webcam/?action=stream"
  },
  "demo-octoprint": {
    state: "idle",
    message: "Operational",
    file: null,
    progress: null,
    timeLeft: null,
    temps: [{ id: "nozzle", actual: 24, target: 0 }, { id: "bed", actual: 23, target: 0 }],
    cameraUrl: null
  },
  "demo-bambu": {
    state: "offline",
    message: "Needs an M1 bridge",
    file: null,
    progress: null,
    timeLeft: null,
    temps: [],
    cameraUrl: null
  }
};
export const liveForeign = Vue.observable({
  records: foreignRegistry.records,
  status: {}
});
const adapters = /* @__PURE__ */ new Map();
let loaded = false;
let demo = false;
function useRecords(records) {
  setForeignRecords(records);
  liveForeign.records = foreignRegistry.records;
}
export async function loadForeign() {
  if (loaded) return;
  loaded = true;
  if (import.meta.env.DEV && new URLSearchParams(window.location.search).get("foreignDemo") === "1") {
    demo = true;
    useRecords(demoRecords);
    Object.keys(demoStatuses).forEach((id) => Vue.set(liveForeign.status, id, demoStatuses[id]));
    return;
  }
  useRecords(await listForeign());
  for (const record of liveForeign.records) {
    if (record.via === "m1") {
      Vue.set(liveForeign.status, record.id, { ...emptyStatus(), state: "offline", message: "Needs an M1 bridge" });
    } else {
      Vue.set(liveForeign.status, record.id, emptyStatus());
    }
  }
}
export async function refreshForeign() {
  if (demo) return;
  loaded = true;
  const records = await listForeign();
  const known = new Set(records.map((record) => record.id));
  Object.keys(liveForeign.status).filter((id) => !known.has(id)).forEach((id) => Vue.delete(liveForeign.status, id));
  useRecords(records);
  for (const record of records) {
    if (liveForeign.status[record.id]) continue;
    Vue.set(liveForeign.status, record.id, record.via === "m1" ? { ...emptyStatus(), state: "offline", message: "Needs an M1 bridge" } : emptyStatus());
  }
}
export async function connectAll() {
  await loadForeign();
  if (demo) return;
  await Promise.all(liveForeign.records.map(async (record) => {
    if (record.via !== "direct" || adapters.has(record.id)) return;
    const credentials = await getCredentials(record.credentialsRef);
    const adapter = createAdapter(record, credentials);
    adapters.set(record.id, adapter);
    let persistedSerial = record.serial;
    adapter.onStatus((status) => {
      Vue.set(liveForeign.status, record.id, status);
      if (record.serial && record.serial !== persistedSerial) {
        persistedSerial = record.serial;
        import("/src/services/foreign-printers/store.ts").then(({ updateForeign }) => updateForeign(record.id, { serial: record.serial })).catch(() => {
        });
      }
    });
    await adapter.connect().catch(() => {
      Vue.set(liveForeign.status, record.id, { ...liveForeign.status[record.id], state: "offline" });
    });
  }));
}
export function adapterFor(id) {
  return adapters.get(id);
}
export async function forget(id) {
  adapters.get(id)?.close();
  adapters.delete(id);
  if (!demo) await forgetForeign(id);
  const index = liveForeign.records.findIndex((item) => item.id === id);
  if (index >= 0) liveForeign.records.splice(index, 1);
  const registryIndex = foreignRegistry.records.findIndex((item) => item.id === id);
  if (registryIndex >= 0) foreignRegistry.records.splice(registryIndex, 1);
  Vue.delete(liveForeign.status, id);
}
export function isForeignDemo() {
  return demo;
}

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImxpdmUudHMiXSwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IFZ1ZSBmcm9tICd2dWUnXG5pbXBvcnQgeyBjcmVhdGVBZGFwdGVyIH0gZnJvbSAnLi9hZGFwdGVycydcbmltcG9ydCB7IGZvcmVpZ25SZWdpc3RyeSwgc2V0Rm9yZWlnblJlY29yZHMgfSBmcm9tICcuL3JlZ2lzdHJ5J1xuaW1wb3J0IHsgZm9yZ2V0Rm9yZWlnbiwgZ2V0Q3JlZGVudGlhbHMsIGxpc3RGb3JlaWduIH0gZnJvbSAnLi9zdG9yZSdcbmltcG9ydCB0eXBlIHsgRm9yZWlnbkFkYXB0ZXIsIEZvcmVpZ25QcmludGVyUmVjb3JkLCBGb3JlaWduU3RhdHVzIH0gZnJvbSAnLi90eXBlcydcblxuY29uc3QgZW1wdHlTdGF0dXMgPSAoKTogRm9yZWlnblN0YXR1cyA9PiAoe1xuICBzdGF0ZTogJ2Nvbm5lY3RpbmcnLFxuICBtZXNzYWdlOiBudWxsLFxuICBmaWxlOiBudWxsLFxuICBwcm9ncmVzczogbnVsbCxcbiAgdGltZUxlZnQ6IG51bGwsXG4gIHRlbXBzOiBbXSxcbiAgY2FtZXJhVXJsOiBudWxsXG59KVxuXG5jb25zdCBkZW1vUmVjb3JkczogRm9yZWlnblByaW50ZXJSZWNvcmRbXSA9IFtcbiAge1xuICAgIGlkOiAnZGVtby12b3JvbicsXG4gICAga2luZDogJ21vb25yYWtlcicsXG4gICAgbmFtZTogJ1dvcmtzaG9wIFZvcm9uJyxcbiAgICBtb2RlbDogJ1Zvcm9uIDIuNCcsXG4gICAgaG9zdDogJzE5Mi4xNjguMS4yNScsXG4gICAgdmlhOiAnZGlyZWN0JyxcbiAgICBmb3JtRmFjdG9yOiAnb3Blbi1mcmFtZScsXG4gICAgY3JlZGVudGlhbHNSZWY6IG51bGwsXG4gICAgYWRkZWRBdDogMFxuICB9LFxuICB7XG4gICAgaWQ6ICdkZW1vLW9jdG9wcmludCcsXG4gICAga2luZDogJ29jdG9wcmludCcsXG4gICAgbmFtZTogJ0dhcmRlbiBQcmludGVyJyxcbiAgICBtb2RlbDogJ0VuZGVyIDMnLFxuICAgIGhvc3Q6ICcxOTIuMTY4LjEuMjYnLFxuICAgIHZpYTogJ2RpcmVjdCcsXG4gICAgZm9ybUZhY3RvcjogJ2JlZC1zbGluZ2VyJyxcbiAgICBjcmVkZW50aWFsc1JlZjogbnVsbCxcbiAgICBhZGRlZEF0OiAwXG4gIH0sXG4gIHtcbiAgICBpZDogJ2RlbW8tYmFtYnUnLFxuICAgIGtpbmQ6ICdiYW1idScsXG4gICAgbmFtZTogJ1N0dWRpbyBYMScsXG4gICAgbW9kZWw6ICdYMSBDYXJib24nLFxuICAgIGhvc3Q6ICcxOTIuMTY4LjEuMjcnLFxuICAgIHZpYTogJ20xJyxcbiAgICBtMU5hbWU6ICdNdW9uIE0xJyxcbiAgICBmb3JtRmFjdG9yOiAnZW5jbG9zZWQnLFxuICAgIGNyZWRlbnRpYWxzUmVmOiBudWxsLFxuICAgIGFkZGVkQXQ6IDBcbiAgfVxuXVxuXG5jb25zdCBkZW1vU3RhdHVzZXM6IFJlY29yZDxzdHJpbmcsIEZvcmVpZ25TdGF0dXM+ID0ge1xuICAnZGVtby12b3Jvbic6IHtcbiAgICBzdGF0ZTogJ3ByaW50aW5nJyxcbiAgICBtZXNzYWdlOiAnUHJpbnRpbmcnLFxuICAgIGZpbGU6ICdicmFja2V0Lmdjb2RlJyxcbiAgICBwcm9ncmVzczogMC42MixcbiAgICB0aW1lTGVmdDogMTgwMCxcbiAgICB0ZW1wczogW3sgaWQ6ICdub3p6bGUnLCBhY3R1YWw6IDIxNCwgdGFyZ2V0OiAyMTUgfSwgeyBpZDogJ2JlZCcsIGFjdHVhbDogNTksIHRhcmdldDogNjAgfV0sXG4gICAgY2FtZXJhVXJsOiAnaHR0cDovLzE5Mi4xNjguMS4yNS93ZWJjYW0vP2FjdGlvbj1zdHJlYW0nXG4gIH0sXG4gICdkZW1vLW9jdG9wcmludCc6IHtcbiAgICBzdGF0ZTogJ2lkbGUnLFxuICAgIG1lc3NhZ2U6ICdPcGVyYXRpb25hbCcsXG4gICAgZmlsZTogbnVsbCxcbiAgICBwcm9ncmVzczogbnVsbCxcbiAgICB0aW1lTGVmdDogbnVsbCxcbiAgICB0ZW1wczogW3sgaWQ6ICdub3p6bGUnLCBhY3R1YWw6IDI0LCB0YXJnZXQ6IDAgfSwgeyBpZDogJ2JlZCcsIGFjdHVhbDogMjMsIHRhcmdldDogMCB9XSxcbiAgICBjYW1lcmFVcmw6IG51bGxcbiAgfSxcbiAgJ2RlbW8tYmFtYnUnOiB7XG4gICAgc3RhdGU6ICdvZmZsaW5lJyxcbiAgICBtZXNzYWdlOiAnTmVlZHMgYW4gTTEgYnJpZGdlJyxcbiAgICBmaWxlOiBudWxsLFxuICAgIHByb2dyZXNzOiBudWxsLFxuICAgIHRpbWVMZWZ0OiBudWxsLFxuICAgIHRlbXBzOiBbXSxcbiAgICBjYW1lcmFVcmw6IG51bGxcbiAgfVxufVxuXG5leHBvcnQgY29uc3QgbGl2ZUZvcmVpZ24gPSBWdWUub2JzZXJ2YWJsZSh7XG4gIHJlY29yZHM6IGZvcmVpZ25SZWdpc3RyeS5yZWNvcmRzIGFzIEZvcmVpZ25QcmludGVyUmVjb3JkW10sXG4gIHN0YXR1czoge30gYXMgUmVjb3JkPHN0cmluZywgRm9yZWlnblN0YXR1cz5cbn0pXG5cbmNvbnN0IGFkYXB0ZXJzID0gbmV3IE1hcDxzdHJpbmcsIEZvcmVpZ25BZGFwdGVyPigpXG5sZXQgbG9hZGVkID0gZmFsc2VcbmxldCBkZW1vID0gZmFsc2VcblxuZnVuY3Rpb24gdXNlUmVjb3JkcyAocmVjb3JkczogRm9yZWlnblByaW50ZXJSZWNvcmRbXSkge1xuICBzZXRGb3JlaWduUmVjb3JkcyhyZWNvcmRzKVxuICBsaXZlRm9yZWlnbi5yZWNvcmRzID0gZm9yZWlnblJlZ2lzdHJ5LnJlY29yZHNcbn1cblxuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIGxvYWRGb3JlaWduICgpOiBQcm9taXNlPHZvaWQ+IHtcbiAgaWYgKGxvYWRlZCkgcmV0dXJuXG4gIGxvYWRlZCA9IHRydWVcbiAgaWYgKGltcG9ydC5tZXRhLmVudi5ERVYgJiYgbmV3IFVSTFNlYXJjaFBhcmFtcyh3aW5kb3cubG9jYXRpb24uc2VhcmNoKS5nZXQoJ2ZvcmVpZ25EZW1vJykgPT09ICcxJykge1xuICAgIGRlbW8gPSB0cnVlXG4gICAgdXNlUmVjb3JkcyhkZW1vUmVjb3JkcylcbiAgICBPYmplY3Qua2V5cyhkZW1vU3RhdHVzZXMpLmZvckVhY2goaWQgPT4gVnVlLnNldChsaXZlRm9yZWlnbi5zdGF0dXMsIGlkLCBkZW1vU3RhdHVzZXNbaWRdKSlcbiAgICByZXR1cm5cbiAgfVxuICB1c2VSZWNvcmRzKGF3YWl0IGxpc3RGb3JlaWduKCkpXG4gIGZvciAoY29uc3QgcmVjb3JkIG9mIGxpdmVGb3JlaWduLnJlY29yZHMpIHtcbiAgICBpZiAocmVjb3JkLnZpYSA9PT0gJ20xJykge1xuICAgICAgVnVlLnNldChsaXZlRm9yZWlnbi5zdGF0dXMsIHJlY29yZC5pZCwgeyAuLi5lbXB0eVN0YXR1cygpLCBzdGF0ZTogJ29mZmxpbmUnLCBtZXNzYWdlOiAnTmVlZHMgYW4gTTEgYnJpZGdlJyB9KVxuICAgIH0gZWxzZSB7XG4gICAgICBWdWUuc2V0KGxpdmVGb3JlaWduLnN0YXR1cywgcmVjb3JkLmlkLCBlbXB0eVN0YXR1cygpKVxuICAgIH1cbiAgfVxufVxuXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gcmVmcmVzaEZvcmVpZ24gKCk6IFByb21pc2U8dm9pZD4ge1xuICBpZiAoZGVtbykgcmV0dXJuXG4gIGxvYWRlZCA9IHRydWVcbiAgY29uc3QgcmVjb3JkcyA9IGF3YWl0IGxpc3RGb3JlaWduKClcbiAgY29uc3Qga25vd24gPSBuZXcgU2V0KHJlY29yZHMubWFwKHJlY29yZCA9PiByZWNvcmQuaWQpKVxuICBPYmplY3Qua2V5cyhsaXZlRm9yZWlnbi5zdGF0dXMpLmZpbHRlcihpZCA9PiAha25vd24uaGFzKGlkKSkuZm9yRWFjaChpZCA9PiBWdWUuZGVsZXRlKGxpdmVGb3JlaWduLnN0YXR1cywgaWQpKVxuICB1c2VSZWNvcmRzKHJlY29yZHMpXG4gIGZvciAoY29uc3QgcmVjb3JkIG9mIHJlY29yZHMpIHtcbiAgICBpZiAobGl2ZUZvcmVpZ24uc3RhdHVzW3JlY29yZC5pZF0pIGNvbnRpbnVlXG4gICAgVnVlLnNldChsaXZlRm9yZWlnbi5zdGF0dXMsIHJlY29yZC5pZCwgcmVjb3JkLnZpYSA9PT0gJ20xJ1xuICAgICAgPyB7IC4uLmVtcHR5U3RhdHVzKCksIHN0YXRlOiAnb2ZmbGluZScsIG1lc3NhZ2U6ICdOZWVkcyBhbiBNMSBicmlkZ2UnIH1cbiAgICAgIDogZW1wdHlTdGF0dXMoKSlcbiAgfVxufVxuXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gY29ubmVjdEFsbCAoKTogUHJvbWlzZTx2b2lkPiB7XG4gIGF3YWl0IGxvYWRGb3JlaWduKClcbiAgaWYgKGRlbW8pIHJldHVyblxuICBhd2FpdCBQcm9taXNlLmFsbChsaXZlRm9yZWlnbi5yZWNvcmRzLm1hcChhc3luYyByZWNvcmQgPT4ge1xuICAgIGlmIChyZWNvcmQudmlhICE9PSAnZGlyZWN0JyB8fCBhZGFwdGVycy5oYXMocmVjb3JkLmlkKSkgcmV0dXJuXG4gICAgY29uc3QgY3JlZGVudGlhbHMgPSBhd2FpdCBnZXRDcmVkZW50aWFscyhyZWNvcmQuY3JlZGVudGlhbHNSZWYpXG4gICAgY29uc3QgYWRhcHRlciA9IGNyZWF0ZUFkYXB0ZXIocmVjb3JkLCBjcmVkZW50aWFscylcbiAgICBhZGFwdGVycy5zZXQocmVjb3JkLmlkLCBhZGFwdGVyKVxuICAgIGxldCBwZXJzaXN0ZWRTZXJpYWwgPSByZWNvcmQuc2VyaWFsXG4gICAgYWRhcHRlci5vblN0YXR1cyhzdGF0dXMgPT4ge1xuICAgICAgVnVlLnNldChsaXZlRm9yZWlnbi5zdGF0dXMsIHJlY29yZC5pZCwgc3RhdHVzKVxuICAgICAgaWYgKHJlY29yZC5zZXJpYWwgJiYgcmVjb3JkLnNlcmlhbCAhPT0gcGVyc2lzdGVkU2VyaWFsKSB7XG4gICAgICAgIHBlcnNpc3RlZFNlcmlhbCA9IHJlY29yZC5zZXJpYWxcbiAgICAgICAgaW1wb3J0KCcuL3N0b3JlJylcbiAgICAgICAgICAudGhlbigoeyB1cGRhdGVGb3JlaWduIH0pID0+IHVwZGF0ZUZvcmVpZ24ocmVjb3JkLmlkLCB7IHNlcmlhbDogcmVjb3JkLnNlcmlhbCB9KSlcbiAgICAgICAgICAuY2F0Y2goKCkgPT4ge30pXG4gICAgICB9XG4gICAgfSlcbiAgICBhd2FpdCBhZGFwdGVyLmNvbm5lY3QoKS5jYXRjaCgoKSA9PiB7XG4gICAgICBWdWUuc2V0KGxpdmVGb3JlaWduLnN0YXR1cywgcmVjb3JkLmlkLCB7IC4uLmxpdmVGb3JlaWduLnN0YXR1c1tyZWNvcmQuaWRdLCBzdGF0ZTogJ29mZmxpbmUnIH0pXG4gICAgfSlcbiAgfSkpXG59XG5cbmV4cG9ydCBmdW5jdGlvbiBhZGFwdGVyRm9yIChpZDogc3RyaW5nKTogRm9yZWlnbkFkYXB0ZXIgfCB1bmRlZmluZWQge1xuICByZXR1cm4gYWRhcHRlcnMuZ2V0KGlkKVxufVxuXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gZm9yZ2V0IChpZDogc3RyaW5nKTogUHJvbWlzZTx2b2lkPiB7XG4gIGFkYXB0ZXJzLmdldChpZCk/LmNsb3NlKClcbiAgYWRhcHRlcnMuZGVsZXRlKGlkKVxuICBpZiAoIWRlbW8pIGF3YWl0IGZvcmdldEZvcmVpZ24oaWQpXG4gIGNvbnN0IGluZGV4ID0gbGl2ZUZvcmVpZ24ucmVjb3Jkcy5maW5kSW5kZXgoaXRlbSA9PiBpdGVtLmlkID09PSBpZClcbiAgaWYgKGluZGV4ID49IDApIGxpdmVGb3JlaWduLnJlY29yZHMuc3BsaWNlKGluZGV4LCAxKVxuICBjb25zdCByZWdpc3RyeUluZGV4ID0gZm9yZWlnblJlZ2lzdHJ5LnJlY29yZHMuZmluZEluZGV4KGl0ZW0gPT4gaXRlbS5pZCA9PT0gaWQpXG4gIGlmIChyZWdpc3RyeUluZGV4ID49IDApIGZvcmVpZ25SZWdpc3RyeS5yZWNvcmRzLnNwbGljZShyZWdpc3RyeUluZGV4LCAxKVxuICBWdWUuZGVsZXRlKGxpdmVGb3JlaWduLnN0YXR1cywgaWQpXG59XG5cbmV4cG9ydCBmdW5jdGlvbiBpc0ZvcmVpZ25EZW1vICgpOiBib29sZWFuIHtcbiAgcmV0dXJuIGRlbW9cbn1cbiJdLCJtYXBwaW5ncyI6IkFBQUEsT0FBTyxTQUFTO0FBQ2hCLFNBQVMscUJBQXFCO0FBQzlCLFNBQVMs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