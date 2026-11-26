import { clampProgress, fetchJson, httpUrl, SocketAdapter, temp } from "/src/services/foreign-printers/adapters/base.ts";
import { localCameraUrl } from "/src/services/foreign-printers/address.ts";
import { uploadChecksum } from "/src/utils/uploadChecksum.ts";
export const MOONRAKER_CAPABILITIES = {
  pauseResume: true,
  stop: true,
  camera: true,
  listFiles: true,
  printFromStorage: true,
  upload: true
};
const OBJECTS = {
  print_stats: null,
  virtual_sdcard: null,
  extruder: null,
  heater_bed: null,
  pause_resume: null
};
export default class MoonrakerAdapter extends SocketAdapter {
  constructor(record, credentials, deps) {
    super(deps);
    this.record = record;
    this.credentials = credentials;
  }
  kind = "moonraker";
  capabilities = MOONRAKER_CAPABILITIES;
  requestId = 1;
  telemetry = {};
  async connect() {
    const host = this.record.host;
    const wsHost = host.includes(":") ? host : `${host}:80`;
    await this.openSocket(`ws://${wsHost}/websocket`);
    this.readCamera().catch(() => {
    });
  }
  onOpen(socket) {
    this.telemetry = {};
    socket.send(JSON.stringify({
      jsonrpc: "2.0",
      method: "server.connection.identify",
      params: { client_name: "Muon3D Fluidd", version: "1", type: "web", url: "https://github.com/Muon-3D/Muon3D_Fluidd", ...this.credentials?.apiKey ? { api_key: this.credentials.apiKey } : {} },
      id: this.requestId++
    }));
    socket.send(JSON.stringify({
      jsonrpc: "2.0",
      method: "printer.objects.subscribe",
      params: { objects: OBJECTS },
      id: this.requestId++
    }));
  }
  onMessage(data) {
    let message;
    try {
      message = JSON.parse(data);
    } catch {
      return;
    }
    if (message.error) {
      this.setStatus({ state: "error", message: String(message.error.message ?? "Moonraker rejected the request") });
      return;
    }
    if (["notify_klippy_shutdown", "notify_klippy_disconnected"].includes(message.method)) {
      this.setStatus({ state: "error", message: "Klipper is unavailable. Check the printer’s own screen." });
      return;
    }
    const payload = message.method === "notify_status_update" ? message.params?.[0] : message.result?.status;
    if (!payload || typeof payload !== "object") return;
    for (const name of Object.keys(OBJECTS)) {
      if (payload[name] && typeof payload[name] === "object") this.telemetry[name] = { ...this.telemetry[name], ...payload[name] };
    }
    const print = this.telemetry.print_stats ?? {};
    const sd = this.telemetry.virtual_sdcard ?? {};
    const state = String(print.state ?? "").toLowerCase();
    const progress = clampProgress(sd.progress);
    const duration = typeof print.print_duration === "number" ? print.print_duration : null;
    const timeLeft = duration !== null && progress !== null && progress > 0 ? Math.max(0, duration / progress - duration) : null;
    const temps = [
      temp("nozzle", this.telemetry.extruder?.temperature, this.telemetry.extruder?.target),
      temp("bed", this.telemetry.heater_bed?.temperature, this.telemetry.heater_bed?.target)
    ].filter((item) => item !== null);
    this.setStatus({
      state: state === "printing" ? "printing" : state === "paused" ? "paused" : state === "error" ? "error" : "idle",
      message: print.message ?? null,
      file: typeof print.filename === "string" && print.filename ? print.filename : null,
      progress,
      timeLeft,
      temps
    });
  }
  async readCamera() {
    try {
      const response = await fetchJson(this.deps, httpUrl(this.record.host, "/server/webcams/list"), {}, this.credentials?.apiKey);
      const webcams = response?.result?.webcams ?? response?.webcams ?? [];
      const camera = webcams.find((item) => item.enabled !== false && typeof item.stream_url === "string");
      if (!camera) return;
      this.setStatus({ cameraUrl: localCameraUrl(camera.stream_url, this.record.host) });
    } catch {
    }
  }
  async command(method) {
    await fetchJson(this.deps, httpUrl(this.record.host, method), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: "{}"
    }, this.credentials?.apiKey);
  }
  pause() {
    return this.command("/printer/print/pause");
  }
  resume() {
    return this.command("/printer/print/resume");
  }
  stop() {
    return this.command("/printer/print/cancel");
  }
  async listFiles() {
    const response = await fetchJson(this.deps, httpUrl(this.record.host, "/server/files/list?root=gcodes"), {}, this.credentials?.apiKey);
    const files = response?.result ?? response;
    return (Array.isArray(files) ? files : []).map((file) => ({
      path: String(file.path ?? file.filename ?? ""),
      name: String(file.path ?? file.filename ?? "").split("/").pop() ?? "",
      size: typeof file.size === "number" ? file.size : void 0,
      modified: typeof file.modified === "number" ? file.modified : void 0
    }));
  }
  printFile(path) {
    return this.commandWithBody("/printer/print/start", { filename: path });
  }
  async commandWithBody(path, body) {
    await fetchJson(this.deps, httpUrl(this.record.host, path), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body)
    }, this.credentials?.apiKey);
  }
  async upload(file, name, print) {
    const form = new FormData();
    form.append("checksum", await uploadChecksum(file));
    form.append("file", file, name);
    form.append("root", "gcodes");
    if (print) form.append("print", "true");
    const headers = this.credentials?.apiKey ? { "X-Api-Key": this.credentials.apiKey } : void 0;
    const response = await this.deps.fetch(httpUrl(this.record.host, "/server/files/upload"), {
      method: "POST",
      body: form,
      headers,
      cache: "no-store"
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    await response.json();
  }
}

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm1vb25yYWtlci50cyJdLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgdHlwZSB7IEFkYXB0ZXJEZXBzLCBGb3JlaWduQ2FwYWJpbGl0aWVzLCBGb3JlaWduQ3JlZGVudGlhbHMsIEZvcmVpZ25GaWxlLCBGb3JlaWduUHJpbnRlclJlY29yZCB9IGZyb20gJy4uL3R5cGVzJ1xuaW1wb3J0IHsgY2xhbXBQcm9ncmVzcywgZmV0Y2hKc29uLCBodHRwVXJsLCBTb2NrZXRBZGFwdGVyLCB0ZW1wIH0gZnJvbSAnLi9iYXNlJ1xuaW1wb3J0IHsgbG9jYWxDYW1lcmFVcmwgfSBmcm9tICcuLi9hZGRyZXNzJ1xuaW1wb3J0IHsgdXBsb2FkQ2hlY2tzdW0gfSBmcm9tICdAL3V0aWxzL3VwbG9hZENoZWNrc3VtJ1xuXG5leHBvcnQgY29uc3QgTU9PTlJBS0VSX0NBUEFCSUxJVElFUzogRm9yZWlnbkNhcGFiaWxpdGllcyA9IHtcbiAgcGF1c2VSZXN1bWU6IHRydWUsXG4gIHN0b3A6IHRydWUsXG4gIGNhbWVyYTogdHJ1ZSxcbiAgbGlzdEZpbGVzOiB0cnVlLFxuICBwcmludEZyb21TdG9yYWdlOiB0cnVlLFxuICB1cGxvYWQ6IHRydWVcbn1cblxuY29uc3QgT0JKRUNUUyA9IHtcbiAgcHJpbnRfc3RhdHM6IG51bGwsXG4gIHZpcnR1YWxfc2RjYXJkOiBudWxsLFxuICBleHRydWRlcjogbnVsbCxcbiAgaGVhdGVyX2JlZDogbnVsbCxcbiAgcGF1c2VfcmVzdW1lOiBudWxsXG59XG5cbmV4cG9ydCBkZWZhdWx0IGNsYXNzIE1vb25yYWtlckFkYXB0ZXIgZXh0ZW5kcyBTb2NrZXRBZGFwdGVyIHtcbiAgcmVhZG9ubHkga2luZCA9ICdtb29ucmFrZXInIGFzIGNvbnN0XG4gIHJlYWRvbmx5IGNhcGFiaWxpdGllcyA9IE1PT05SQUtFUl9DQVBBQklMSVRJRVNcbiAgcHJpdmF0ZSByZXF1ZXN0SWQgPSAxXG4gIHByaXZhdGUgdGVsZW1ldHJ5OiBSZWNvcmQ8c3RyaW5nLCBhbnk+ID0ge31cblxuICBjb25zdHJ1Y3RvciAoXG4gICAgcHJpdmF0ZSByZWFkb25seSByZWNvcmQ6IEZvcmVpZ25QcmludGVyUmVjb3JkLFxuICAgIHByaXZhdGUgcmVhZG9ubHkgY3JlZGVudGlhbHM6IEZvcmVpZ25DcmVkZW50aWFscyB8IG51bGwsXG4gICAgZGVwczogQWRhcHRlckRlcHNcbiAgKSB7XG4gICAgc3VwZXIoZGVwcylcbiAgfVxuXG4gIGFzeW5jIGNvbm5lY3QgKCk6IFByb21pc2U8dm9pZD4ge1xuICAgIGNvbnN0IGhvc3QgPSB0aGlzLnJlY29yZC5ob3N0XG4gICAgY29uc3Qgd3NIb3N0ID0gaG9zdC5pbmNsdWRlcygnOicpID8gaG9zdCA6IGAke2hvc3R9OjgwYFxuICAgIGF3YWl0IHRoaXMub3BlblNvY2tldChgd3M6Ly8ke3dzSG9zdH0vd2Vic29ja2V0YClcbiAgICB0aGlzLnJlYWRDYW1lcmEoKS5jYXRjaCgoKSA9PiB7fSlcbiAgfVxuXG4gIHByb3RlY3RlZCBvbk9wZW4gKHNvY2tldDogV2ViU29ja2V0KSB7XG4gICAgdGhpcy50ZWxlbWV0cnkgPSB7fVxuICAgIHNvY2tldC5zZW5kKEpTT04uc3RyaW5naWZ5KHtcbiAgICAgIGpzb25ycGM6ICcyLjAnLFxuICAgICAgbWV0aG9kOiAnc2VydmVyLmNvbm5lY3Rpb24uaWRlbnRpZnknLFxuICAgICAgcGFyYW1zOiB7IGNsaWVudF9uYW1lOiAnTXVvbjNEIEZsdWlkZCcsIHZlcnNpb246ICcxJywgdHlwZTogJ3dlYicsIHVybDogJ2h0dHBzOi8vZ2l0aHViLmNvbS9NdW9uLTNEL011b24zRF9GbHVpZGQnLCAuLi4odGhpcy5jcmVkZW50aWFscz8uYXBpS2V5ID8geyBhcGlfa2V5OiB0aGlzLmNyZWRlbnRpYWxzLmFwaUtleSB9IDoge30pIH0sXG4gICAgICBpZDogdGhpcy5yZXF1ZXN0SWQrK1xuICAgIH0pKVxuICAgIHNvY2tldC5zZW5kKEpTT04uc3RyaW5naWZ5KHtcbiAgICAgIGpzb25ycGM6ICcyLjAnLFxuICAgICAgbWV0aG9kOiAncHJpbnRlci5vYmplY3RzLnN1YnNjcmliZScsXG4gICAgICBwYXJhbXM6IHsgb2JqZWN0czogT0JKRUNUUyB9LFxuICAgICAgaWQ6IHRoaXMucmVxdWVzdElkKytcbiAgICB9KSlcbiAgfVxuXG4gIHByb3RlY3RlZCBvbk1lc3NhZ2UgKGRhdGE6IHN0cmluZykge1xuICAgIGxldCBtZXNzYWdlOiBhbnlcbiAgICB0cnkge1xuICAgICAgbWVzc2FnZSA9IEpTT04ucGFyc2UoZGF0YSlcbiAgICB9IGNhdGNoIHtcbiAgICAgIHJldHVyblxuICAgIH1cbiAgICBpZiAobWVzc2FnZS5lcnJvcikge1xuICAgICAgdGhpcy5zZXRTdGF0dXMoeyBzdGF0ZTogJ2Vycm9yJywgbWVzc2FnZTogU3RyaW5nKG1lc3NhZ2UuZXJyb3IubWVzc2FnZSA/PyAnTW9vbnJha2VyIHJlamVjdGVkIHRoZSByZXF1ZXN0JykgfSlcbiAgICAgIHJldHVyblxuICAgIH1cbiAgICBpZiAoWydub3RpZnlfa2xpcHB5X3NodXRkb3duJywgJ25vdGlmeV9rbGlwcHlfZGlzY29ubmVjdGVkJ10uaW5jbHVkZXMobWVzc2FnZS5tZXRob2QpKSB7XG4gICAgICB0aGlzLnNldFN0YXR1cyh7IHN0YXRlOiAnZXJyb3InLCBtZXNzYWdlOiAnS2xpcHBlciBpcyB1bmF2YWlsYWJsZS4gQ2hlY2sgdGhlIHByaW50ZXLigJlzIG93biBzY3JlZW4uJyB9KVxuICAgICAgcmV0dXJuXG4gICAgfVxuICAgIGNvbnN0IHBheWxvYWQgPSBtZXNzYWdlLm1ldGhvZCA9PT0gJ25vdGlmeV9zdGF0dXNfdXBkYXRlJyA/IG1lc3NhZ2UucGFyYW1zPy5bMF0gOiBtZXNzYWdlLnJlc3VsdD8uc3RhdHVzXG4gICAgaWYgKCFwYXlsb2FkIHx8IHR5cGVvZiBwYXlsb2FkICE9PSAnb2JqZWN0JykgcmV0dXJuXG4gICAgZm9yIChjb25zdCBuYW1lIG9mIE9iamVjdC5rZXlzKE9CSkVDVFMpKSB7XG4gICAgICBpZiAocGF5bG9hZFtuYW1lXSAmJiB0eXBlb2YgcGF5bG9hZFtuYW1lXSA9PT0gJ29iamVjdCcpIHRoaXMudGVsZW1ldHJ5W25hbWVdID0geyAuLi50aGlzLnRlbGVtZXRyeVtuYW1lXSwgLi4ucGF5bG9hZFtuYW1lXSB9XG4gICAgfVxuICAgIGNvbnN0IHByaW50ID0gdGhpcy50ZWxlbWV0cnkucHJpbnRfc3RhdHMgPz8ge31cbiAgICBjb25zdCBzZCA9IHRoaXMudGVsZW1ldHJ5LnZpcnR1YWxfc2RjYXJkID8/IHt9XG4gICAgY29uc3Qgc3RhdGUgPSBTdHJpbmcocHJpbnQuc3RhdGUgPz8gJycpLnRvTG93ZXJDYXNlKClcbiAgICBjb25zdCBwcm9ncmVzcyA9IGNsYW1wUHJvZ3Jlc3Moc2QucHJvZ3Jlc3MpXG4gICAgY29uc3QgZHVyYXRpb24gPSB0eXBlb2YgcHJpbnQucHJpbnRfZHVyYXRpb24gPT09ICdudW1iZXInID8gcHJpbnQucHJpbnRfZHVyYXRpb24gOiBudWxsXG4gICAgY29uc3QgdGltZUxlZnQgPSBkdXJhdGlvbiAhPT0gbnVsbCAmJiBwcm9ncmVzcyAhPT0gbnVsbCAmJiBwcm9ncmVzcyA+IDBcbiAgICAgID8gTWF0aC5tYXgoMCwgZHVyYXRpb24gLyBwcm9ncmVzcyAtIGR1cmF0aW9uKVxuICAgICAgOiBudWxsXG4gICAgY29uc3QgdGVtcHMgPSBbXG4gICAgICB0ZW1wKCdub3p6bGUnLCB0aGlzLnRlbGVtZXRyeS5leHRydWRlcj8udGVtcGVyYXR1cmUsIHRoaXMudGVsZW1ldHJ5LmV4dHJ1ZGVyPy50YXJnZXQpLFxuICAgICAgdGVtcCgnYmVkJywgdGhpcy50ZWxlbWV0cnkuaGVhdGVyX2JlZD8udGVtcGVyYXR1cmUsIHRoaXMudGVsZW1ldHJ5LmhlYXRlcl9iZWQ/LnRhcmdldClcbiAgICBdLmZpbHRlcigoaXRlbSk6IGl0ZW0gaXMgTm9uTnVsbGFibGU8dHlwZW9mIGl0ZW0+ID0+IGl0ZW0gIT09IG51bGwpXG4gICAgdGhpcy5zZXRTdGF0dXMoe1xuICAgICAgc3RhdGU6IHN0YXRlID09PSAncHJpbnRpbmcnID8gJ3ByaW50aW5nJyA6IHN0YXRlID09PSAncGF1c2VkJyA/ICdwYXVzZWQnIDogc3RhdGUgPT09ICdlcnJvcicgPyAnZXJyb3InIDogJ2lkbGUnLFxuICAgICAgbWVzc2FnZTogcHJpbnQubWVzc2FnZSA/PyBudWxsLFxuICAgICAgZmlsZTogdHlwZW9mIHByaW50LmZpbGVuYW1lID09PSAnc3RyaW5nJyAmJiBwcmludC5maWxlbmFtZSA/IHByaW50LmZpbGVuYW1lIDogbnVsbCxcbiAgICAgIHByb2dyZXNzLFxuICAgICAgdGltZUxlZnQsXG4gICAgICB0ZW1wc1xuICAgIH0pXG4gIH1cblxuICBwcml2YXRlIGFzeW5jIHJlYWRDYW1lcmEgKCkge1xuICAgIHRyeSB7XG4gICAgICBjb25zdCByZXNwb25zZSA9IGF3YWl0IGZldGNoSnNvbih0aGlzLmRlcHMsIGh0dHBVcmwodGhpcy5yZWNvcmQuaG9zdCwgJy9zZXJ2ZXIvd2ViY2Ftcy9saXN0JyksIHt9LCB0aGlzLmNyZWRlbnRpYWxzPy5hcGlLZXkpXG4gICAgICBjb25zdCB3ZWJjYW1zID0gcmVzcG9uc2U/LnJlc3VsdD8ud2ViY2FtcyA/PyByZXNwb25zZT8ud2ViY2FtcyA/PyBbXVxuICAgICAgY29uc3QgY2FtZXJhID0gd2ViY2Ftcy5maW5kKChpdGVtOiBhbnkpID0+IGl0ZW0uZW5hYmxlZCAhPT0gZmFsc2UgJiYgdHlwZW9mIGl0ZW0uc3RyZWFtX3VybCA9PT0gJ3N0cmluZycpXG4gICAgICBpZiAoIWNhbWVyYSkgcmV0dXJuXG4gICAgICB0aGlzLnNldFN0YXR1cyh7IGNhbWVyYVVybDogbG9jYWxDYW1lcmFVcmwoY2FtZXJhLnN0cmVhbV91cmwsIHRoaXMucmVjb3JkLmhvc3QpIH0pXG4gICAgfSBjYXRjaCB7fVxuICB9XG5cbiAgcHJpdmF0ZSBhc3luYyBjb21tYW5kIChtZXRob2Q6IHN0cmluZykge1xuICAgIGF3YWl0IGZldGNoSnNvbih0aGlzLmRlcHMsIGh0dHBVcmwodGhpcy5yZWNvcmQuaG9zdCwgbWV0aG9kKSwge1xuICAgICAgbWV0aG9kOiAnUE9TVCcsXG4gICAgICBoZWFkZXJzOiB7ICdDb250ZW50LVR5cGUnOiAnYXBwbGljYXRpb24vanNvbicgfSxcbiAgICAgIGJvZHk6ICd7fSdcbiAgICB9LCB0aGlzLmNyZWRlbnRpYWxzPy5hcGlLZXkpXG4gIH1cblxuICBwYXVzZSAoKTogUHJvbWlzZTx2b2lkPiB7IHJldHVybiB0aGlzLmNvbW1hbmQoJy9wcmludGVyL3ByaW50L3BhdXNlJykgfVxuICByZXN1bWUgKCk6IFByb21pc2U8dm9pZD4geyByZXR1cm4gdGhpcy5jb21tYW5kKCcvcHJpbnRlci9wcmludC9yZXN1bWUnKSB9XG4gIHN0b3AgKCk6IFByb21pc2U8dm9pZD4geyByZXR1cm4gdGhpcy5jb21tYW5kKCcvcHJpbnRlci9wcmludC9jYW5jZWwnKSB9XG5cbiAgYXN5bmMgbGlzdEZpbGVzICgpOiBQcm9taXNlPEZvcmVpZ25GaWxlW10+IHtcbiAgICBjb25zdCByZXNwb25zZSA9IGF3YWl0IGZldGNoSnNvbih0aGlzLmRlcHMsIGh0dHBVcmwodGhpcy5yZWNvcmQuaG9zdCwgJy9zZXJ2ZXIvZmlsZXMvbGlzdD9yb290PWdjb2RlcycpLCB7fSwgdGhpcy5jcmVkZW50aWFscz8uYXBpS2V5KVxuICAgIGNvbnN0IGZpbGVzID0gcmVzcG9uc2U/LnJlc3VsdCA/PyByZXNwb25zZVxuICAgIHJldHVybiAoQXJyYXkuaXNBcnJheShmaWxlcykgPyBmaWxlcyA6IFtdKS5tYXAoKGZpbGU6IGFueSkgPT4gKHtcbiAgICAgIHBhdGg6IFN0cmluZyhmaWxlLnBhdGggPz8gZmlsZS5maWxlbmFtZSA/PyAnJyksXG4gICAgICBuYW1lOiBTdHJpbmcoZmlsZS5wYXRoID8/IGZpbGUuZmlsZW5hbWUgPz8gJycpLnNwbGl0KCcvJykucG9wKCkgPz8gJycsXG4gICAgICBzaXplOiB0eXBlb2YgZmlsZS5zaXplID09PSAnbnVtYmVyJyA/IGZpbGUuc2l6ZSA6IHVuZGVmaW5lZCxcbiAgICAgIG1vZGlmaWVkOiB0eXBlb2YgZmlsZS5tb2RpZmllZCA9PT0gJ251bWJlcicgPyBmaWxlLm1vZGlmaWVkIDogdW5kZWZpbmVkXG4gICAgfSkpXG4gIH1cblxuICBwcmludEZpbGUgKHBhdGg6IHN0cmluZyk6IFByb21pc2U8dm9pZD4ge1xuICAgIHJldHVybiB0aGlzLmNvbW1hbmRXaXRoQm9keSgnL3ByaW50ZXIvcHJpbnQvc3RhcnQnLCB7IGZpbGVuYW1lOiBwYXRoIH0pXG4gIH1cblxuICBwcml2YXRlIGFzeW5jIGNvbW1hbmRXaXRoQm9keSAocGF0aDogc3RyaW5nLCBib2R5OiB1bmtub3duKSB7XG4gICAgYXdhaXQgZmV0Y2hKc29uKHRoaXMuZGVwcywgaHR0cFVybCh0aGlzLnJlY29yZC5ob3N0LCBwYXRoKSwge1xuICAgICAgbWV0aG9kOiAnUE9TVCcsXG4gICAgICBoZWFkZXJzOiB7ICdDb250ZW50LVR5cGUnOiAnYXBwbGljYXRpb24vanNvbicgfSxcbiAgICAgIGJvZHk6IEpTT04uc3RyaW5naWZ5KGJvZHkpXG4gICAgfSwgdGhpcy5jcmVkZW50aWFscz8uYXBpS2V5KVxuICB9XG5cbiAgYXN5bmMgdXBsb2FkIChmaWxlOiBGaWxlIHwgQmxvYiwgbmFtZTogc3RyaW5nLCBwcmludDogYm9vbGVhbik6IFByb21pc2U8dm9pZD4ge1xuICAgIGNvbnN0IGZvcm0gPSBuZXcgRm9ybURhdGEoKVxuICAgIGZvcm0uYXBwZW5kKCdjaGVja3N1bScsIGF3YWl0IHVwbG9hZENoZWNrc3VtKGZpbGUpKVxuICAgIGZvcm0uYXBwZW5kKCdmaWxlJywgZmlsZSwgbmFtZSlcbiAgICBmb3JtLmFwcGVuZCgncm9vdCcsICdnY29kZXMnKVxuICAgIGlmIChwcmludCkgZm9ybS5hcHBlbmQoJ3ByaW50JywgJ3RydWUnKVxuICAgIGNvbnN0IGhlYWRlcnMgPSB0aGlzLmNyZWRlbnRpYWxzPy5hcGlLZXkgPyB7ICdYLUFwaS1LZXknOiB0aGlzLmNyZWRlbnRpYWxzLmFwaUtleSB9IDogdW5kZWZpbmVkXG4gICAgY29uc3QgcmVzcG9uc2UgPSBhd2FpdCB0aGlzLmRlcHMuZmV0Y2goaHR0cFVybCh0aGlzLnJlY29yZC5ob3N0LCAnL3NlcnZlci9maWxlcy91cGxvYWQnKSwge1xuICAgICAgbWV0aG9kOiAnUE9TVCcsXG4gICAgICBib2R5OiBmb3JtLFxuICAgICAgaGVhZGVycyxcbiAgICAgIGNhY2hlOiAnbm8tc3RvcmUnXG4gICAgfSlcbiAgICBpZiAoIXJlc3BvbnNlLm9rKSB0aHJvdyBuZXcgRXJyb3IoYEhUVFAgJHtyZXNwb25zZS5zdGF0dXN9YClcbiAgICBhd2FpdCByZXNwb25zZS5qc29uKClcbiAgfVxufVxuIl0sIm1hcHBpbmdzIjoiQUFDQSxTQUFTLGVBQWUsV0FBVyxTQUFTLGVBQWUsWUFBWTtBQUN2RSxTQUFTLHNCQUFzQjtBQUMvQixTQUFTLHNCQUFzQjtBQUV4QixhQUFNLHlCQUE4QztBQUFBLEVBQ3pELGFBQWE7QUFBQSxFQUNiLE1BQU07QUFBQSxFQUNOLFFBQVE7QUFBQSxFQUNSLFdBQVc7QUFBQSxFQUNYLGtCQUFrQjtBQUFBLEVBQ2xCLFFBQVE7QUFDVjtBQUVBLE1BQU0sVUFBVTtBQUFBLEVBQ2QsYUFBYTtBQUFBLEVBQ2IsZ0JBQWdCO0FBQUEsRUFDaEIsVUFBVTtBQUFBLEVBQ1YsWUFBWTtBQUFBLEVBQ1osY0FBYztBQUNoQjtBQUVBLHFCQUFxQix5QkFBeUIsY0FBYztBQUFBLEVBTTFELFlBQ21CLFFBQ0EsYUFDakIsTUFDQTtBQUNBLFVBQU0sSUFBSTtBQUpPO0FBQ0E7QUFBQSxFQUluQjtBQUFBLEVBWFMsT0FBTztBQUFBLEVBQ1AsZUFBZTtBQUFBLEVBQ2hCLFlBQVk7QUFBQSxFQUNaLFlBQWlDLENBQUM7QUFBQSxFQVUxQyxNQUFNLFVBQTBCO0FBQzlCLFVBQU0sT0FBTyxLQUFLLE9BQU87QUFDekIsVUFBTSxTQUFTLEtBQUssU0FBUyxHQUFHLElBQUksT0FBTyxHQUFHLElBQUk7QUFDbEQsVUFBTSxLQUFLLFdBQVcsUUFBUSxNQUFNLFlBQVk7QUFDaEQsU0FBSyxXQUFXLEVBQUUsTUFBTSxNQUFNO0FBQUEsSUFBQyxDQUFDO0FBQUEs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