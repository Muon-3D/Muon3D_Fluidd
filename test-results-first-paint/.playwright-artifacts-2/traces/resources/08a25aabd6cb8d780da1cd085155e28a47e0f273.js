import { clampProgress, SocketAdapter, temp } from "/src/services/foreign-printers/adapters/base.ts";
import { localCameraUrl } from "/src/services/foreign-printers/address.ts";
import { v4 as uuidv4 } from "/.vite-e2e/4291/deps/uuid.js?v=9b9fafc7";
export const ELEGOO_CC_CAPABILITIES = {
  pauseResume: true,
  stop: true,
  camera: true,
  listFiles: true,
  printFromStorage: true,
  upload: false
};
export default class ElegooCentauriAdapter extends SocketAdapter {
  constructor(record, deps) {
    super(deps);
    this.record = record;
  }
  kind = "elegoo-cc";
  capabilities = ELEGOO_CC_CAPABILITIES;
  files = [];
  pending = /* @__PURE__ */ new Map();
  async connect() {
    const host = this.record.host.replace(/:\d+$/, "");
    return this.openSocket(`ws://${host}:3030/websocket`);
  }
  onMessage(data) {
    let message;
    try {
      message = JSON.parse(data);
    } catch {
      return;
    }
    const mainboard = message.MainboardID;
    if (typeof mainboard === "string" && mainboard) this.record.serial = mainboard;
    const status = message.Status;
    if (status) {
      const info = status.PrintInfo ?? {};
      const code = Number(info.Status);
      const label = status.CurrentStatus?.[0];
      const error = code === 14 || Number(info.ErrorNumber ?? 0) !== 0 || typeof label === "string" && /error|failed/i.test(label);
      const printing = status.CurrentStatus?.includes(1) || code > 0 && code <= 26;
      const temps = [
        temp("nozzle", status.TempOfNozzle, status.TempTargetNozzle),
        temp("bed", status.TempOfHotbed, status.TempTargetHotbed),
        temp("chamber", status.TempOfBox, status.TempTargetBox)
      ].filter((item) => item !== null);
      const elapsed = typeof info.CurrentTicks === "number" ? info.CurrentTicks : null;
      const total = typeof info.TotalTicks === "number" ? info.TotalTicks : null;
      this.setStatus({
        state: error ? "error" : [8, 9].includes(code) || label === 0 ? "idle" : [5, 6, 26].includes(code) ? "paused" : printing ? "printing" : code === 0 ? "idle" : this.status.state,
        message: error ? "The printer reported a print error." : typeof label === "string" ? label : null,
        file: typeof info.Filename === "string" ? info.Filename : null,
        progress: clampProgress(info.Progress, true) ?? (elapsed !== null && total ? clampProgress(elapsed / total) : null),
        timeLeft: elapsed !== null && total !== null ? Math.max(0, total - elapsed) : null,
        temps
      });
    }
    if (typeof message.Topic === "string" && message.Topic.startsWith("sdcp/response/")) this.onResponse(message);
    const response = message.Data?.Data ?? message.Data ?? {};
    const videoUrl = response.VideoUrl ?? message.VideoUrl;
    if (typeof videoUrl === "string") {
      this.setStatus({ cameraUrl: localCameraUrl(videoUrl, this.record.host) });
    }
  }
  envelope(cmd, data = {}) {
    const id = uuidv4().replace(/-/g, "");
    return {
      Id: "",
      Data: {
        Cmd: cmd,
        Data: data,
        RequestID: id,
        MainboardID: this.record.serial ?? "",
        TimeStamp: Math.floor((this.deps.now?.() ?? Date.now()) / 1e3),
        From: 1
      },
      Topic: `sdcp/request/${this.record.serial ?? ""}`
    };
  }
  sendUntrackedCommand(cmd, data = {}) {
    this.send(JSON.stringify(this.envelope(cmd, data)));
  }
  sendCommand(cmd, data = {}) {
    const envelope = this.envelope(cmd, data);
    const requestId = envelope.Data.RequestID;
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        if (!this.pending.delete(requestId)) return;
        reject(new Error(`The printer did not answer command ${cmd} within 5 seconds`));
      }, 5e3);
      this.pending.set(requestId, {
        cmd,
        resolve: (value) => resolve(value),
        reject,
        timer
      });
      try {
        this.send(JSON.stringify(envelope));
      } catch (error) {
        this.pending.delete(requestId);
        clearTimeout(timer);
        reject(error instanceof Error ? error : new Error(String(error)));
      }
    });
  }
  onResponse(message) {
    const envelope = message.Data ?? {};
    const response = envelope.Data ?? {};
    const cmd = Number(envelope.Cmd ?? response.Cmd);
    const requestId = typeof envelope.RequestID === "string" ? envelope.RequestID : null;
    const matched = requestId ? this.pending.get(requestId) : void 0;
    const fallback = matched ? void 0 : [...this.pending.entries()].find(([, pending2]) => pending2.cmd === cmd);
    const id = matched ? requestId : fallback?.[0];
    const pending = matched ?? fallback?.[1];
    if (!pending || !id) return;
    this.pending.delete(id);
    clearTimeout(pending.timer);
    const ack = Number(response.Ack ?? envelope.Ack);
    if (cmd === 258) {
      const files = response.Files ?? response.FileList ?? response.files ?? [];
      if (Array.isArray(files)) {
        this.files = files.map((file) => {
          const path = String(file.Path ?? file.path ?? file.Filename ?? file.name ?? "");
          return { path, name: String(file.Name ?? file.name ?? path.split("/").pop() ?? "") };
        });
      }
    }
    if (ack === 0) {
      pending.resolve(cmd === 258 ? this.files : void 0);
    } else {
      pending.reject(new Error(ack === 1 ? "The printer refused" : ack === 2 ? "File not found" : `The printer returned acknowledgement ${ack}`));
    }
  }
  rejectPending(error) {
    for (const pending of this.pending.values()) {
      clearTimeout(pending.timer);
      pending.reject(error);
    }
    this.pending.clear();
  }
  onDisconnect() {
    this.rejectPending(new Error("Printer is offline"));
  }
  close() {
    this.rejectPending(new Error("Printer is offline"));
    super.close();
  }
  pause() {
    return this.sendCommand(129);
  }
  resume() {
    return this.sendCommand(131);
  }
  stop() {
    return this.sendCommand(130);
  }
  printFile(path) {
    return this.sendCommand(128, { Filename: path.startsWith("/local/") ? path : `/local/${path}`, StartLayer: 0 });
  }
  async listFiles() {
    return this.sendCommand(258, { Url: "/local" });
  }
  sendCamera() {
    this.sendUntrackedCommand(386, { Enable: 1 });
  }
  onOpen(socket) {
    super.onOpen(socket);
    this.sendUntrackedCommand(1);
    this.sendUntrackedCommand(0);
    this.sendCamera();
  }
}

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImVsZWdvby1jYy50cyJdLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgdHlwZSB7IEFkYXB0ZXJEZXBzLCBGb3JlaWduQ2FwYWJpbGl0aWVzLCBGb3JlaWduRmlsZSwgRm9yZWlnblByaW50ZXJSZWNvcmQgfSBmcm9tICcuLi90eXBlcydcbmltcG9ydCB7IGNsYW1wUHJvZ3Jlc3MsIFNvY2tldEFkYXB0ZXIsIHRlbXAgfSBmcm9tICcuL2Jhc2UnXG5pbXBvcnQgeyBsb2NhbENhbWVyYVVybCB9IGZyb20gJy4uL2FkZHJlc3MnXG5pbXBvcnQgeyB2NCBhcyB1dWlkdjQgfSBmcm9tICd1dWlkJ1xuXG5leHBvcnQgY29uc3QgRUxFR09PX0NDX0NBUEFCSUxJVElFUzogRm9yZWlnbkNhcGFiaWxpdGllcyA9IHtcbiAgcGF1c2VSZXN1bWU6IHRydWUsXG4gIHN0b3A6IHRydWUsXG4gIGNhbWVyYTogdHJ1ZSxcbiAgbGlzdEZpbGVzOiB0cnVlLFxuICBwcmludEZyb21TdG9yYWdlOiB0cnVlLFxuICB1cGxvYWQ6IGZhbHNlXG59XG5cbmludGVyZmFjZSBQZW5kaW5nQ29tbWFuZCB7XG4gIGNtZDogbnVtYmVyXG4gIHJlc29sdmU6ICh2YWx1ZTogdW5rbm93bikgPT4gdm9pZFxuICByZWplY3Q6IChlcnJvcjogRXJyb3IpID0+IHZvaWRcbiAgdGltZXI6IFJldHVyblR5cGU8dHlwZW9mIHNldFRpbWVvdXQ+XG59XG5cbmV4cG9ydCBkZWZhdWx0IGNsYXNzIEVsZWdvb0NlbnRhdXJpQWRhcHRlciBleHRlbmRzIFNvY2tldEFkYXB0ZXIge1xuICByZWFkb25seSBraW5kID0gJ2VsZWdvby1jYycgYXMgY29uc3RcbiAgcmVhZG9ubHkgY2FwYWJpbGl0aWVzID0gRUxFR09PX0NDX0NBUEFCSUxJVElFU1xuICBwcml2YXRlIGZpbGVzOiBGb3JlaWduRmlsZVtdID0gW11cbiAgcHJpdmF0ZSBwZW5kaW5nID0gbmV3IE1hcDxzdHJpbmcsIFBlbmRpbmdDb21tYW5kPigpXG5cbiAgY29uc3RydWN0b3IgKHByaXZhdGUgcmVhZG9ubHkgcmVjb3JkOiBGb3JlaWduUHJpbnRlclJlY29yZCwgZGVwczogQWRhcHRlckRlcHMpIHtcbiAgICBzdXBlcihkZXBzKVxuICB9XG5cbiAgYXN5bmMgY29ubmVjdCAoKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgY29uc3QgaG9zdCA9IHRoaXMucmVjb3JkLmhvc3QucmVwbGFjZSgvOlxcZCskLywgJycpXG4gICAgcmV0dXJuIHRoaXMub3BlblNvY2tldChgd3M6Ly8ke2hvc3R9OjMwMzAvd2Vic29ja2V0YClcbiAgfVxuXG4gIHByb3RlY3RlZCBvbk1lc3NhZ2UgKGRhdGE6IHN0cmluZykge1xuICAgIGxldCBtZXNzYWdlOiBhbnlcbiAgICB0cnkge1xuICAgICAgbWVzc2FnZSA9IEpTT04ucGFyc2UoZGF0YSlcbiAgICB9IGNhdGNoIHtcbiAgICAgIHJldHVyblxuICAgIH1cbiAgICBjb25zdCBtYWluYm9hcmQgPSBtZXNzYWdlLk1haW5ib2FyZElEXG4gICAgaWYgKHR5cGVvZiBtYWluYm9hcmQgPT09ICdzdHJpbmcnICYmIG1haW5ib2FyZCkgdGhpcy5yZWNvcmQuc2VyaWFsID0gbWFpbmJvYXJkXG4gICAgY29uc3Qgc3RhdHVzID0gbWVzc2FnZS5TdGF0dXNcbiAgICBpZiAoc3RhdHVzKSB7XG4gICAgICBjb25zdCBpbmZvID0gc3RhdHVzLlByaW50SW5mbyA/PyB7fVxuICAgICAgY29uc3QgY29kZSA9IE51bWJlcihpbmZvLlN0YXR1cylcbiAgICAgIGNvbnN0IGxhYmVsID0gc3RhdHVzLkN1cnJlbnRTdGF0dXM/LlswXVxuICAgICAgLy8gQ2VudGF1cmkgRkRNIGNvZGVzIGZyb20gRWxlZ29vJ3MgZWxlZ29vLWxpbmsgYWRhcHRlcjogNiBwYXVzZWQsXG4gICAgICAvLyA4IHN0b3BwZWQsIDkgY29tcGxldGUsIDEwIGNoZWNraW5nLCAxMyBwcmludGluZywgMTQgZXJyb3IuXG4gICAgICBjb25zdCBlcnJvciA9IGNvZGUgPT09IDE0IHx8IE51bWJlcihpbmZvLkVycm9yTnVtYmVyID8/IDApICE9PSAwIHx8ICh0eXBlb2YgbGFiZWwgPT09ICdzdHJpbmcnICYmIC9lcnJvcnxmYWlsZWQvaS50ZXN0KGxhYmVsKSlcbiAgICAgIGNvbnN0IHByaW50aW5nID0gc3RhdHVzLkN1cnJlbnRTdGF0dXM/LmluY2x1ZGVzKDEpIHx8IChjb2RlID4gMCAmJiBjb2RlIDw9IDI2KVxuICAgICAgY29uc3QgdGVtcHMgPSBbXG4gICAgICAgIHRlbXAoJ25venpsZScsIHN0YXR1cy5UZW1wT2ZOb3p6bGUsIHN0YXR1cy5UZW1wVGFyZ2V0Tm96emxlKSxcbiAgICAgICAgdGVtcCgnYmVkJywgc3RhdHVzLlRlbXBPZkhvdGJlZCwgc3RhdHVzLlRlbXBUYXJnZXRIb3RiZWQpLFxuICAgICAgICB0ZW1wKCdjaGFtYmVyJywgc3RhdHVzLlRlbXBPZkJveCwgc3RhdHVzLlRlbXBUYXJnZXRCb3gpXG4gICAgICBdLmZpbHRlcigoaXRlbSk6IGl0ZW0gaXMgTm9uTnVsbGFibGU8dHlwZW9mIGl0ZW0+ID0+IGl0ZW0gIT09IG51bGwpXG4gICAgICBjb25zdCBlbGFwc2VkID0gdHlwZW9mIGluZm8uQ3VycmVudFRpY2tzID09PSAnbnVtYmVyJyA/IGluZm8uQ3VycmVudFRpY2tzIDogbnVsbFxuICAgICAgY29uc3QgdG90YWwgPSB0eXBlb2YgaW5mby5Ub3RhbFRpY2tzID09PSAnbnVtYmVyJyA/IGluZm8uVG90YWxUaWNrcyA6IG51bGxcbiAgICAgIHRoaXMuc2V0U3RhdHVzKHtcbiAgICAgICAgc3RhdGU6IGVycm9yXG4gICAgICAgICAgPyAnZXJyb3InXG4gICAgICAgICAgOiBbOCwgOV0uaW5jbHVkZXMoY29kZSkgfHwgbGFiZWwgPT09IDAgPyAnaWRsZScgOiBbNSwgNiwgMjZdLmluY2x1ZGVzKGNvZGUpID8gJ3BhdXNlZCcgOiBwcmludGluZyA/ICdwcmludGluZycgOiBjb2RlID09PSAwID8gJ2lkbGUnIDogdGhpcy5zdGF0dXMuc3RhdGUsXG4gICAgICAgIG1lc3NhZ2U6IGVycm9yID8gJ1RoZSBwcmludGVyIHJlcG9ydGVkIGEgcHJpbnQgZXJyb3IuJyA6IHR5cGVvZiBsYWJlbCA9PT0gJ3N0cmluZycgPyBsYWJlbCA6IG51bGwsXG4gICAgICAgIGZpbGU6IHR5cGVvZiBpbmZvLkZpbGVuYW1lID09PSAnc3RyaW5nJyA/IGluZm8uRmlsZW5hbWUgOiBudWxsLFxuICAgICAgICBwcm9ncmVzczogY2xhbXBQcm9ncmVzcyhpbmZvLlByb2dyZXNzLCB0cnVlKSA/PyAoZWxhcHNlZCAhPT0gbnVsbCAmJiB0b3RhbCA/IGNsYW1wUHJvZ3Jlc3MoZWxhcHNlZCAvIHRvdGFsKSA6IG51bGwpLFxuICAgICAgICB0aW1lTGVmdDogZWxhcHNlZCAhPT0gbnVsbCAmJiB0b3RhbCAhPT0gbnVsbCA/IE1hdGgubWF4KDAsIHRvdGFsIC0gZWxhcHNlZCkgOiBudWxsLFxuICAgICAgICB0ZW1wc1xuICAgICAgfSlcbiAgICB9XG4gICAgaWYgKHR5cGVvZiBtZXNzYWdlLlRvcGljID09PSAnc3RyaW5nJyAmJiBtZXNzYWdlLlRvcGljLnN0YXJ0c1dpdGgoJ3NkY3AvcmVzcG9uc2UvJykpIHRoaXMub25SZXNwb25zZShtZXNzYWdlKVxuICAgIGNvbnN0IHJlc3BvbnNlID0gbWVzc2FnZS5EYXRhPy5EYXRhID8/IG1lc3NhZ2UuRGF0YSA/PyB7fVxuICAgIGNvbnN0IHZpZGVvVXJsID0gcmVzcG9uc2UuVmlkZW9VcmwgPz8gbWVzc2FnZS5WaWRlb1VybFxuICAgIGlmICh0eXBlb2YgdmlkZW9VcmwgPT09ICdzdHJpbmcnKSB7XG4gICAgICB0aGlzLnNldFN0YXR1cyh7IGNhbWVyYVVybDogbG9jYWxDYW1lcmFVcmwodmlkZW9VcmwsIHRoaXMucmVjb3JkLmhvc3QpIH0pXG4gICAgfVxuICB9XG5cbiAgcHJpdmF0ZSBlbnZlbG9wZSAoY21kOiBudW1iZXIsIGRhdGE6IFJlY29yZDxzdHJpbmcsIHVua25vd24+ID0ge30pIHtcbiAgICBjb25zdCBpZCA9IHV1aWR2NCgpLnJlcGxhY2UoLy0vZywgJycpXG4gICAgcmV0dXJuIHtcbiAgICAgIElkOiAnJyxcbiAgICAgIERhdGE6IHtcbiAgICAgICAgQ21kOiBjbWQsXG4gICAgICAgIERhdGE6IGRhdGEsXG4gICAgICAgIFJlcXVlc3RJRDogaWQsXG4gICAgICAgIE1haW5ib2FyZElEOiB0aGlzLnJlY29yZC5zZXJpYWwgPz8gJycsXG4gICAgICAgIFRpbWVTdGFtcDogTWF0aC5mbG9vcigodGhpcy5kZXBzLm5vdz8uKCkgPz8gRGF0ZS5ub3coKSkgLyAxMDAwKSxcbiAgICAgICAgRnJvbTogMVxuICAgICAgfSxcbiAgICAgIFRvcGljOiBgc2RjcC9yZXF1ZXN0LyR7dGhpcy5yZWNvcmQuc2VyaWFsID8/ICcnfWBcbiAgICB9XG4gIH1cblxuICBwcml2YXRlIHNlbmRVbnRyYWNrZWRDb21tYW5kIChjbWQ6IG51bWJlciwgZGF0YTogUmVjb3JkPHN0cmluZywgdW5rbm93bj4gPSB7fSkge1xuICAgIHRoaXMuc2VuZChKU09OLnN0cmluZ2lmeSh0aGlzLmVudmVsb3BlKGNtZCwgZGF0YSkpKVxuICB9XG5cbiAgcHJpdmF0ZSBzZW5kQ29tbWFuZDxUID0gdm9pZD4gKGNtZDogbnVtYmVyLCBkYXRhOiBSZWNvcmQ8c3RyaW5nLCB1bmtub3duPiA9IHt9KTogUHJvbWlzZTxUPiB7XG4gICAgY29uc3QgZW52ZWxvcGUgPSB0aGlzLmVudmVsb3BlKGNtZCwgZGF0YSlcbiAgICBjb25zdCByZXF1ZXN0SWQgPSBlbnZlbG9wZS5EYXRhLlJlcXVlc3RJRFxuICAgIHJldHVybiBuZXcgUHJvbWlzZTxUPigocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XG4gICAgICBjb25zdCB0aW1lciA9IHNldFRpbWVvdXQoKCkgPT4ge1xuICAgICAgICBpZiAoIXRoaXMucGVuZGluZy5kZWxldGUocmVxdWVzdElkKSkgcmV0dXJuXG4gICAgICAgIHJlamVjdChuZXcgRXJyb3IoYFRoZSBwcmludGVyIGRpZCBub3QgYW5zd2VyIGNvbW1hbmQgJHtjbWR9IHdpdGhpbiA1IHNlY29uZHNgKSlcbiAgICAgIH0sIDUwMDApXG4gICAgICB0aGlzLnBlbmRpbmcuc2V0KHJlcXVlc3RJZCwge1xuICAgICAgICBjbWQsXG4gICAgICAgIHJlc29sdmU6IHZhbHVlID0+IHJlc29sdmUodmFsdWUgYXMgVCksXG4gICAgICAgIHJlamVjdCxcbiAgICAgICAgdGltZXJcbiAgICAgIH0pXG4gICAgICB0cnkge1xuICAgICAgICB0aGlzLnNlbmQoSlNPTi5zdHJpbmdpZnkoZW52ZWxvcGUpKVxuICAgICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgICAgdGhpcy5wZW5kaW5nLmRlbGV0ZShyZXF1ZXN0SWQpXG4gICAgICAgIGNsZWFyVGltZW91dCh0aW1lcilcbiAgICAgICAgcmVqZWN0KGVycm9yIGluc3RhbmNlb2YgRXJyb3IgPyBlcnJvciA6IG5ldyBFcnJvcihTdHJpbmcoZXJyb3IpKSlcbiAgICAgIH1cbiAgICB9KVxuICB9XG5cbiAgcHJpdmF0ZSBvblJlc3BvbnNlIChtZXNzYWdlOiBhbnkpIHtcbiAgICBjb25zdCBlbnZlbG9wZSA9IG1lc3NhZ2UuRGF0YSA/PyB7fVxuICAgIGNvbnN0IHJlc3BvbnNlID0gZW52ZWxvcGUuRGF0YSA/PyB7fVxuICAgIGNvbnN0IGNtZCA9IE51bWJlcihlbnZlbG9wZS5DbWQgPz8gcmVzcG9uc2UuQ21kKVxuICAgIGNvbnN0IHJlcXVlc3RJZCA9IHR5cGVvZiBlbnZlbG9wZS5SZXF1ZXN0SUQgPT09ICdzdHJpbmcnID8gZW52ZWxvcGUuUmVxdWVzdElEIDogbnVsbFxuICAgIGNvbnN0IG1hdGNoZWQgPSByZXF1ZXN0SWQgPyB0aGlzLnBlbmRpbmcuZ2V0KHJlcXVlc3RJZCkgOiB1bmRlZmluZWRcbiAgICBjb25zdCBmYWxsYmFjayA9IG1hdGNoZWQgPyB1bmRlZmluZWQgOiBbLi4udGhpcy5wZW5kaW5nLmVudHJpZXMoKV0uZmluZCgoWywgcGVuZGluZ10pID0+IHBlbmRpbmcuY21kID09PSBjbWQpXG4gICAgY29uc3QgaWQgPSBtYXRjaGVkID8gcmVxdWVzdElkISA6IGZhbGxiYWNrPy5bMF1cbiAgICBjb25zdCBwZW5kaW5nID0gbWF0Y2hlZCA/PyBmYWxsYmFjaz8uWzFdXG4gICAgaWYgKCFwZW5kaW5nIHx8ICFpZCkgcmV0dXJuXG4gICAgdGhpcy5wZW5kaW5nLmRlbGV0ZShpZClcbiAgICBjbGVhclRpbWVvdXQocGVuZGluZy50aW1lcilcblxuICAgIGNvbnN0IGFjayA9IE51bWJlcihyZXNwb25zZS5BY2sgPz8gZW52ZWxvcGUuQWNrKVxuICAgIGlmIChjbWQgPT09IDI1OCkge1xuICAgICAgY29uc3QgZmlsZXMgPSByZXNwb25zZS5GaWxlcyA/PyByZXNwb25zZS5GaWxlTGlzdCA/PyByZXNwb25zZS5maWxlcyA/PyBbXVxuICAgICAgaWYgKEFycmF5LmlzQXJyYXkoZmlsZXMpKSB7XG4gICAgICAgIHRoaXMuZmlsZXMgPSBmaWxlcy5tYXAoKGZpbGU6IGFueSkgPT4ge1xuICAgICAgICAgIGNvbnN0IHBhdGggPSBTdHJpbmcoZmlsZS5QYXRoID8/IGZpbGUucGF0aCA/PyBmaWxlLkZpbGVuYW1lID8/IGZpbGUubmFtZSA/PyAnJylcbiAgICAgICAgICByZXR1cm4geyBwYXRoLCBuYW1lOiBTdHJpbmcoZmlsZS5OYW1lID8/IGZpbGUubmFtZSA/PyBwYXRoLnNwbGl0KCcvJykucG9wKCkgPz8gJycpIH1cbiAgICAgICAgfSlcbiAgICAgIH1cbiAgICB9XG4gICAgaWYgKGFjayA9PT0gMCkge1xuICAgICAgcGVuZGluZy5yZXNvbHZlKGNtZCA9PT0gMjU4ID8gdGhpcy5maWxlcyA6IHVuZGVmaW5lZClcbiAgICB9IGVsc2Uge1xuICAgICAgcGVuZGluZy5yZWplY3QobmV3IEVycm9yKGFjayA9PT0gMSA/ICdUaGUgcHJpbnRlciByZWZ1c2VkJyA6IGFjayA9PT0gMiA/ICdGaWxlIG5vdCBmb3VuZCcgOiBgVGhlIHByaW50ZXIgcmV0dXJuZWQgYWNrbm93bGVkZ2VtZW50ICR7YWNrfWApKVxuICAgIH1cbiAgfVxuXG4gIHByaXZhdGUgcmVqZWN0UGVuZGluZyAoZXJyb3I6IEVycm9yKSB7XG4gICAgZm9yIChjb25zdCBwZW5kaW5nIG9mIHRoaXMucGVuZGluZy52YWx1ZXMoKSkge1xuICAgICAgY2xlYXJUaW1lb3V0KHBlbmRpbmcudGltZXIpXG4gICAgICBwZW5kaW5nLnJlamVjdChlcnJvcilcbiAgICB9XG4gICAgdGhpcy5wZW5kaW5nLmNsZWFyKClcbiAgfVxuXG4gIHByb3RlY3RlZCBvdmVycmlkZSBvbkRpc2Nvbm5lY3QgKCkge1xuICAgIHRoaXMucmVqZWN0UGVuZGluZyhuZXcgRXJyb3IoJ1ByaW50ZXIgaXMgb2ZmbGluZScpKVxuICB9XG5cbiAgb3ZlcnJpZGUgY2xvc2UgKCkge1xuICAgIHRoaXMucmVqZWN0UGVuZGluZyhuZXcgRXJyb3IoJ1ByaW50ZXIgaXMgb2ZmbGluZScpKVxuICAgIHN1cGVyLmNsb3NlKClcbiAgfVxuXG4gIHBhdXNlICgpOiBQcm9taXNlPHZvaWQ+IHsgcmV0dXJuIHRoaXMuc2VuZENvbW1hbmQoMTI5KSB9XG4gIHJlc3VtZSAoKTogUHJvbWlzZTx2b2lkPiB7IHJldHVybiB0aGlzLnNlbmRDb21tYW5kKDEzMSkgfVxuICBzdG9wICgpOiBQcm9taXNlPHZvaWQ+IHsgcmV0dXJuIHRoaXMuc2VuZENvbW1hbmQoMTMwKSB9XG4gIHByaW50RmlsZSAocGF0aDogc3RyaW5nKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgcmV0dXJuIHRoaXMuc2VuZENvbW1hbmQoMTI4LCB7IEZpbGVuYW1lOiBwYXRoLnN0YXJ0c1dpdGgoJy9sb2NhbC8nKSA/IHBhdGggOiBgL2xvY2FsLyR7cGF0aH1gLCBTdGFydExheWVyOiAwIH0pXG4gIH1cblxuICBhc3luYyBsaXN0RmlsZXMgKCk6IFByb21pc2U8Rm9yZWlnbkZpbGVbXT4geyByZXR1cm4gdGhpcy5zZW5kQ29tbWFuZDxGb3JlaWduRmlsZVtdPigyNTgsIHsgVXJsOiAnL2xvY2FsJyB9KSB9XG5cbiAgcHJpdmF0ZSBzZW5kQ2FtZXJhICgpIHtcbiAgICB0aGlzLnNlbmRVbnRyYWNrZWRDb21tYW5kKDM4NiwgeyBFbmFibGU6IDEgfSlcbiAgfVxuXG4gIHByb3RlY3RlZCBvdmVycmlkZSBvbk9wZW4gKHNvY2tldDogV2ViU29ja2V0KSB7XG4gICAgc3VwZXIub25PcGVuKHNvY2tldClcbiAgICB0aGlzLnNlbmRVbnRyYWNrZWRDb21tYW5kKDEpXG4gICAgdGhpcy5zZW5kVW50cmFja2VkQ29tbWFuZCgwKVxuICAgIHRoaXMuc2VuZENhbWVyYSgpXG4gIH1cbn1cbiJdLCJtYXBwaW5ncyI6IkFBQ0EsU0FBUyxlQUFlLGVBQWUsWUFBWTtBQUNuRCxTQUFTLHNCQUFzQjtBQUMvQixTQUFTLE1BQU0sY0FBYztBQUV0QixhQUFNLHlCQUE4QztBQUFBLEVBQ3pELGFBQWE7QUFBQSxFQUNiLE1BQU07QUFBQSxFQUNOLFFBQVE7QUFBQSxFQUNSLFdBQVc7QUFBQSxFQUNYLGtCQUFrQjtBQUFBLEVBQ2xCLFFBQVE7QUFDVjtBQVNBLHFCQUFxQiw4QkFBOEIsY0FBYztBQUFBLEVBTS9ELFlBQThCLFFBQThCLE1BQW1CO0FBQzdFLFVBQU0sSUFBSTtBQURrQjtBQUFBLEVBRTlCO0FBQUEsRUFQUyxPQUFPO0FBQUEsRUFDUCxlQUFlO0FBQUEsRUFDaEIsUUFBdUIsQ0FBQztBQUFBLEVBQ3hCLFVBQVUsb0JBQUksSUFBNEI7QUFBQSxFQU1sRCxNQUFNLFVBQTBCO0FBQzlCLFVBQU0sT0FBTyxLQUFLLE9BQU8sS0FBSyxRQUFRLFNBQVMsRUFBRTtBQUNqRCxXQUFPLEtBQUssV0FBVyxRQUFRLElBQUksaUJBQWlCO0FBQUEsRUFDdEQ7QUFBQSxFQUVVLFVBQVcsTUFBYztBQUNqQyxRQUFJO0FBQ0osUUFBSTtBQUNGLGdCQUFVLEtBQUssTUFBTSxJQUFJO0FBQUEsSUFDM0IsUUFBUTtBQUNOO0FBQUEsSUFDRjtBQUNBLFVBQU0sWUFBWSxRQUFRO0FBQzFCLFFBQUksT0FBTyxjQUFjLFlBQVksVUFBVyxNQUFLLE9BQU8sU0FBUztBQUNyRSxVQUFNLFNBQVMsUUFBUTtBQUN2QixRQUFJLFFBQVE7QUFD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