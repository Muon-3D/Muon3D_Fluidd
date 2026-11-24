import { clampProgress, fetchJson, httpUrl, SocketAdapter, temp } from "/src/services/foreign-printers/adapters/base.ts";
import { localCameraUrl } from "/src/services/foreign-printers/address.ts";
export const OCTOPRINT_CAPABILITIES = {
  pauseResume: true,
  stop: true,
  camera: true,
  listFiles: true,
  printFromStorage: true,
  upload: true
};
export default class OctoPrintAdapter extends SocketAdapter {
  constructor(record, credentials, deps) {
    super(deps);
    this.record = record;
    this.credentials = credentials;
  }
  kind = "octoprint";
  capabilities = OCTOPRINT_CAPABILITIES;
  pollTimer = null;
  sessionAuth = "";
  async connect() {
    const key = this.credentials?.apiKey;
    this.readCamera().catch(() => {
    });
    try {
      const login = await fetchJson(this.deps, httpUrl(this.record.host, "/api/login"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ passive: true })
      }, key);
      this.sessionAuth = `${login.name}:${login.session}`;
      await this.openSocket(`ws://${this.record.host}/sockjs/websocket`);
    } catch {
      this.startPolling();
      await this.poll();
    }
  }
  onMessage(data) {
    let message;
    try {
      message = JSON.parse(data);
    } catch {
      return;
    }
    const current = message.current ?? message.history;
    if (!current) return;
    const state = current.state ?? {};
    const flags = state.flags ?? {};
    const printing = !!flags.printing;
    const paused = !!flags.paused;
    const error = !!flags.error;
    const job = current.job ?? {};
    const progress = clampProgress(current.progress?.completion, true);
    const temps = Array.isArray(current.temps) ? current.temps[current.temps.length - 1] : current.temps;
    const readings = temps ? [
      temp("nozzle", temps.tool0?.actual, temps.tool0?.target),
      temp("bed", temps.bed?.actual, temps.bed?.target)
    ].filter((item) => item !== null) : this.status.temps;
    this.setStatus({
      state: paused ? "paused" : error ? "error" : printing ? "printing" : state.text === "Offline" ? "offline" : "idle",
      message: typeof state.text === "string" ? state.text : null,
      file: job.file?.path ?? job.file?.name ?? null,
      progress,
      timeLeft: typeof current.progress?.printTimeLeft === "number" ? current.progress.printTimeLeft : null,
      temps: readings
    });
  }
  onOpen(socket) {
    socket.send(JSON.stringify({ auth: this.sessionAuth }));
    socket.send(JSON.stringify({ throttle: 2 }));
    if (this.pollTimer) clearInterval(this.pollTimer);
    this.pollTimer = null;
  }
  onDisconnect() {
    if (this.pollTimer) clearInterval(this.pollTimer);
    this.pollTimer = null;
  }
  async readCamera() {
    try {
      const settings = await fetchJson(this.deps, httpUrl(this.record.host, "/api/settings"), {}, this.credentials?.apiKey);
      const stream = settings?.webcam?.streamUrl ?? settings?.webcam?.snapshotUrl;
      if (typeof stream !== "string") return;
      this.setStatus({ cameraUrl: localCameraUrl(stream, this.record.host) });
    } catch {
    }
  }
  startPolling() {
    if (this.pollTimer) return;
    this.setStatus({ state: "connecting" });
    this.poll().catch(() => {
    });
    this.pollTimer = setInterval(() => {
      this.poll().catch(() => {
      });
    }, 3e3);
  }
  async poll() {
    try {
      const [job, printer] = await Promise.all([
        fetchJson(this.deps, httpUrl(this.record.host, "/api/job"), {}, this.credentials?.apiKey),
        fetchJson(this.deps, httpUrl(this.record.host, "/api/printer"), {}, this.credentials?.apiKey)
      ]);
      const state = printer.state ?? {};
      const flags = state.flags ?? {};
      const temps = printer.temperature ?? {};
      this.setStatus({
        state: flags.paused ? "paused" : flags.error ? "error" : flags.printing ? "printing" : "idle",
        message: state.text ?? null,
        file: job.job?.file?.path ?? job.job?.file?.name ?? null,
        progress: clampProgress(job.progress?.completion, true),
        timeLeft: typeof job.progress?.printTimeLeft === "number" ? job.progress.printTimeLeft : null,
        temps: [temp("nozzle", temps.tool0?.actual, temps.tool0?.target), temp("bed", temps.bed?.actual, temps.bed?.target)].filter((item) => item !== null)
      });
    } catch {
      this.setStatus({ state: "offline" });
    }
  }
  async command(body) {
    await fetchJson(this.deps, httpUrl(this.record.host, "/api/job"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body)
    }, this.credentials?.apiKey);
  }
  pause() {
    return this.command({ command: "pause", action: "pause" });
  }
  resume() {
    return this.command({ command: "pause", action: "resume" });
  }
  stop() {
    return this.command({ command: "cancel" });
  }
  async listFiles() {
    const response = await fetchJson(this.deps, httpUrl(this.record.host, "/api/files/local?recursive=true"), {}, this.credentials?.apiKey);
    return (response?.files ?? []).map((file) => ({
      path: file.path,
      name: file.name,
      size: file.size,
      modified: file.date
    }));
  }
  printFile(path) {
    return this.fileCommand(path, { command: "select", print: true });
  }
  async fileCommand(path, body) {
    await fetchJson(this.deps, httpUrl(this.record.host, `/api/files/local/${path.split("/").map(encodeURIComponent).join("/")}`), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body)
    }, this.credentials?.apiKey);
  }
  async upload(file, name, print) {
    const form = new FormData();
    form.append("file", file, name);
    if (print) form.append("print", "true");
    const headers = this.credentials?.apiKey ? { "X-Api-Key": this.credentials.apiKey } : void 0;
    const response = await this.deps.fetch(httpUrl(this.record.host, "/api/files/local"), {
      method: "POST",
      body: form,
      headers,
      cache: "no-store"
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    await response.json();
  }
  close() {
    if (this.pollTimer) clearInterval(this.pollTimer);
    this.pollTimer = null;
    super.close();
  }
}

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm9jdG9wcmludC50cyJdLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgdHlwZSB7IEFkYXB0ZXJEZXBzLCBGb3JlaWduQ2FwYWJpbGl0aWVzLCBGb3JlaWduQ3JlZGVudGlhbHMsIEZvcmVpZ25GaWxlLCBGb3JlaWduUHJpbnRlclJlY29yZCB9IGZyb20gJy4uL3R5cGVzJ1xuaW1wb3J0IHsgY2xhbXBQcm9ncmVzcywgZmV0Y2hKc29uLCBodHRwVXJsLCBTb2NrZXRBZGFwdGVyLCB0ZW1wIH0gZnJvbSAnLi9iYXNlJ1xuaW1wb3J0IHsgbG9jYWxDYW1lcmFVcmwgfSBmcm9tICcuLi9hZGRyZXNzJ1xuXG5leHBvcnQgY29uc3QgT0NUT1BSSU5UX0NBUEFCSUxJVElFUzogRm9yZWlnbkNhcGFiaWxpdGllcyA9IHtcbiAgcGF1c2VSZXN1bWU6IHRydWUsXG4gIHN0b3A6IHRydWUsXG4gIGNhbWVyYTogdHJ1ZSxcbiAgbGlzdEZpbGVzOiB0cnVlLFxuICBwcmludEZyb21TdG9yYWdlOiB0cnVlLFxuICB1cGxvYWQ6IHRydWVcbn1cblxuZXhwb3J0IGRlZmF1bHQgY2xhc3MgT2N0b1ByaW50QWRhcHRlciBleHRlbmRzIFNvY2tldEFkYXB0ZXIge1xuICByZWFkb25seSBraW5kID0gJ29jdG9wcmludCcgYXMgY29uc3RcbiAgcmVhZG9ubHkgY2FwYWJpbGl0aWVzID0gT0NUT1BSSU5UX0NBUEFCSUxJVElFU1xuICBwcml2YXRlIHBvbGxUaW1lcjogUmV0dXJuVHlwZTx0eXBlb2Ygc2V0SW50ZXJ2YWw+IHwgbnVsbCA9IG51bGxcbiAgcHJpdmF0ZSBzZXNzaW9uQXV0aCA9ICcnXG5cbiAgY29uc3RydWN0b3IgKFxuICAgIHByaXZhdGUgcmVhZG9ubHkgcmVjb3JkOiBGb3JlaWduUHJpbnRlclJlY29yZCxcbiAgICBwcml2YXRlIHJlYWRvbmx5IGNyZWRlbnRpYWxzOiBGb3JlaWduQ3JlZGVudGlhbHMgfCBudWxsLFxuICAgIGRlcHM6IEFkYXB0ZXJEZXBzXG4gICkge1xuICAgIHN1cGVyKGRlcHMpXG4gIH1cblxuICBhc3luYyBjb25uZWN0ICgpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICBjb25zdCBrZXkgPSB0aGlzLmNyZWRlbnRpYWxzPy5hcGlLZXlcbiAgICB0aGlzLnJlYWRDYW1lcmEoKS5jYXRjaCgoKSA9PiB7fSlcbiAgICB0cnkge1xuICAgICAgY29uc3QgbG9naW4gPSBhd2FpdCBmZXRjaEpzb24odGhpcy5kZXBzLCBodHRwVXJsKHRoaXMucmVjb3JkLmhvc3QsICcvYXBpL2xvZ2luJyksIHtcbiAgICAgICAgbWV0aG9kOiAnUE9TVCcsXG4gICAgICAgIGhlYWRlcnM6IHsgJ0NvbnRlbnQtVHlwZSc6ICdhcHBsaWNhdGlvbi9qc29uJyB9LFxuICAgICAgICBib2R5OiBKU09OLnN0cmluZ2lmeSh7IHBhc3NpdmU6IHRydWUgfSlcbiAgICAgIH0sIGtleSlcbiAgICAgIHRoaXMuc2Vzc2lvbkF1dGggPSBgJHtsb2dpbi5uYW1lfToke2xvZ2luLnNlc3Npb259YFxuICAgICAgYXdhaXQgdGhpcy5vcGVuU29ja2V0KGB3czovLyR7dGhpcy5yZWNvcmQuaG9zdH0vc29ja2pzL3dlYnNvY2tldGApXG4gICAgfSBjYXRjaCB7XG4gICAgICB0aGlzLnN0YXJ0UG9sbGluZygpXG4gICAgICBhd2FpdCB0aGlzLnBvbGwoKVxuICAgIH1cbiAgfVxuXG4gIHByb3RlY3RlZCBvbk1lc3NhZ2UgKGRhdGE6IHN0cmluZykge1xuICAgIGxldCBtZXNzYWdlOiBhbnlcbiAgICB0cnkge1xuICAgICAgbWVzc2FnZSA9IEpTT04ucGFyc2UoZGF0YSlcbiAgICB9IGNhdGNoIHtcbiAgICAgIHJldHVyblxuICAgIH1cbiAgICBjb25zdCBjdXJyZW50ID0gbWVzc2FnZS5jdXJyZW50ID8/IG1lc3NhZ2UuaGlzdG9yeVxuICAgIGlmICghY3VycmVudCkgcmV0dXJuXG4gICAgY29uc3Qgc3RhdGUgPSBjdXJyZW50LnN0YXRlID8/IHt9XG4gICAgY29uc3QgZmxhZ3MgPSBzdGF0ZS5mbGFncyA/PyB7fVxuICAgIGNvbnN0IHByaW50aW5nID0gISFmbGFncy5wcmludGluZ1xuICAgIGNvbnN0IHBhdXNlZCA9ICEhZmxhZ3MucGF1c2VkXG4gICAgY29uc3QgZXJyb3IgPSAhIWZsYWdzLmVycm9yXG4gICAgY29uc3Qgam9iID0gY3VycmVudC5qb2IgPz8ge31cbiAgICBjb25zdCBwcm9ncmVzcyA9IGNsYW1wUHJvZ3Jlc3MoY3VycmVudC5wcm9ncmVzcz8uY29tcGxldGlvbiwgdHJ1ZSlcbiAgICBjb25zdCB0ZW1wcyA9IEFycmF5LmlzQXJyYXkoY3VycmVudC50ZW1wcykgPyBjdXJyZW50LnRlbXBzW2N1cnJlbnQudGVtcHMubGVuZ3RoIC0gMV0gOiBjdXJyZW50LnRlbXBzXG4gICAgY29uc3QgcmVhZGluZ3MgPSB0ZW1wc1xuICAgICAgPyBbXG4gICAgICAgICAgdGVtcCgnbm96emxlJywgdGVtcHMudG9vbDA/LmFjdHVhbCwgdGVtcHMudG9vbDA/LnRhcmdldCksXG4gICAgICAgICAgdGVtcCgnYmVkJywgdGVtcHMuYmVkPy5hY3R1YWwsIHRlbXBzLmJlZD8udGFyZ2V0KVxuICAgICAgICBdLmZpbHRlcigoaXRlbSk6IGl0ZW0gaXMgTm9uTnVsbGFibGU8dHlwZW9mIGl0ZW0+ID0+IGl0ZW0gIT09IG51bGwpXG4gICAgICA6IHRoaXMuc3RhdHVzLnRlbXBzXG4gICAgdGhpcy5zZXRTdGF0dXMoe1xuICAgICAgc3RhdGU6IHBhdXNlZCA/ICdwYXVzZWQnIDogZXJyb3IgPyAnZXJyb3InIDogcHJpbnRpbmcgPyAncHJpbnRpbmcnIDogc3RhdGUudGV4dCA9PT0gJ09mZmxpbmUnID8gJ29mZmxpbmUnIDogJ2lkbGUnLFxuICAgICAgbWVzc2FnZTogdHlwZW9mIHN0YXRlLnRleHQgPT09ICdzdHJpbmcnID8gc3RhdGUudGV4dCA6IG51bGwsXG4gICAgICBmaWxlOiBqb2IuZmlsZT8ucGF0aCA/PyBqb2IuZmlsZT8ubmFtZSA/PyBudWxsLFxuICAgICAgcHJvZ3Jlc3MsXG4gICAgICB0aW1lTGVmdDogdHlwZW9mIGN1cnJlbnQucHJvZ3Jlc3M/LnByaW50VGltZUxlZnQgPT09ICdudW1iZXInID8gY3VycmVudC5wcm9ncmVzcy5wcmludFRpbWVMZWZ0IDogbnVsbCxcbiAgICAgIHRlbXBzOiByZWFkaW5nc1xuICAgIH0pXG4gIH1cblxuICBwcm90ZWN0ZWQgb25PcGVuIChzb2NrZXQ6IFdlYlNvY2tldCkge1xuICAgIHNvY2tldC5zZW5kKEpTT04uc3RyaW5naWZ5KHsgYXV0aDogdGhpcy5zZXNzaW9uQXV0aCB9KSlcbiAgICBzb2NrZXQuc2VuZChKU09OLnN0cmluZ2lmeSh7IHRocm90dGxlOiAyIH0pKVxuICAgIGlmICh0aGlzLnBvbGxUaW1lcikgY2xlYXJJbnRlcnZhbCh0aGlzLnBvbGxUaW1lcilcbiAgICB0aGlzLnBvbGxUaW1lciA9IG51bGxcbiAgfVxuXG4gIHByb3RlY3RlZCBvbkRpc2Nvbm5lY3QgKCkge1xuICAgIGlmICh0aGlzLnBvbGxUaW1lcikgY2xlYXJJbnRlcnZhbCh0aGlzLnBvbGxUaW1lcilcbiAgICB0aGlzLnBvbGxUaW1lciA9IG51bGxcbiAgfVxuXG4gIHByaXZhdGUgYXN5bmMgcmVhZENhbWVyYSAoKSB7XG4gICAgdHJ5IHtcbiAgICAgIGNvbnN0IHNldHRpbmdzID0gYXdhaXQgZmV0Y2hKc29uKHRoaXMuZGVwcywgaHR0cFVybCh0aGlzLnJlY29yZC5ob3N0LCAnL2FwaS9zZXR0aW5ncycpLCB7fSwgdGhpcy5jcmVkZW50aWFscz8uYXBpS2V5KVxuICAgICAgY29uc3Qgc3RyZWFtID0gc2V0dGluZ3M/LndlYmNhbT8uc3RyZWFtVXJsID8/IHNldHRpbmdzPy53ZWJjYW0/LnNuYXBzaG90VXJsXG4gICAgICBpZiAodHlwZW9mIHN0cmVhbSAhPT0gJ3N0cmluZycpIHJldHVyblxuICAgICAgdGhpcy5zZXRTdGF0dXMoeyBjYW1lcmFVcmw6IGxvY2FsQ2FtZXJhVXJsKHN0cmVhbSwgdGhpcy5yZWNvcmQuaG9zdCkgfSlcbiAgICB9IGNhdGNoIHt9XG4gIH1cblxuICBwcml2YXRlIHN0YXJ0UG9sbGluZyAoKSB7XG4gICAgaWYgKHRoaXMucG9sbFRpbWVyKSByZXR1cm5cbiAgICB0aGlzLnNldFN0YXR1cyh7IHN0YXRlOiAnY29ubmVjdGluZycgfSlcbiAgICB0aGlzLnBvbGwoKS5jYXRjaCgoKSA9PiB7fSlcbiAgICB0aGlzLnBvbGxUaW1lciA9IHNldEludGVydmFsKCgpID0+IHsgdGhpcy5wb2xsKCkuY2F0Y2goKCkgPT4ge30pIH0sIDMwMDApXG4gIH1cblxuICBwcml2YXRlIGFzeW5jIHBvbGwgKCkge1xuICAgIHRyeSB7XG4gICAgICBjb25zdCBbam9iLCBwcmludGVyXSA9IGF3YWl0IFByb21pc2UuYWxsKFtcbiAgICAgICAgZmV0Y2hKc29uKHRoaXMuZGVwcywgaHR0cFVybCh0aGlzLnJlY29yZC5ob3N0LCAnL2FwaS9qb2InKSwge30sIHRoaXMuY3JlZGVudGlhbHM/LmFwaUtleSksXG4gICAgICAgIGZldGNoSnNvbih0aGlzLmRlcHMsIGh0dHBVcmwodGhpcy5yZWNvcmQuaG9zdCwgJy9hcGkvcHJpbnRlcicpLCB7fSwgdGhpcy5jcmVkZW50aWFscz8uYXBpS2V5KVxuICAgICAgXSlcbiAgICAgIGNvbnN0IHN0YXRlID0gcHJpbnRlci5zdGF0ZSA/PyB7fVxuICAgICAgY29uc3QgZmxhZ3MgPSBzdGF0ZS5mbGFncyA/PyB7fVxuICAgICAgY29uc3QgdGVtcHMgPSBwcmludGVyLnRlbXBlcmF0dXJlID8/IHt9XG4gICAgICB0aGlzLnNldFN0YXR1cyh7XG4gICAgICAgIHN0YXRlOiBmbGFncy5wYXVzZWQgPyAncGF1c2VkJyA6IGZsYWdzLmVycm9yID8gJ2Vycm9yJyA6IGZsYWdzLnByaW50aW5nID8gJ3ByaW50aW5nJyA6ICdpZGxlJyxcbiAgICAgICAgbWVzc2FnZTogc3RhdGUudGV4dCA/PyBudWxsLFxuICAgICAgICBmaWxlOiBqb2Iuam9iPy5maWxlPy5wYXRoID8/IGpvYi5qb2I/LmZpbGU/Lm5hbWUgPz8gbnVsbCxcbiAgICAgICAgcHJvZ3Jlc3M6IGNsYW1wUHJvZ3Jlc3Moam9iLnByb2dyZXNzPy5jb21wbGV0aW9uLCB0cnVlKSxcbiAgICAgICAgdGltZUxlZnQ6IHR5cGVvZiBqb2IucHJvZ3Jlc3M/LnByaW50VGltZUxlZnQgPT09ICdudW1iZXInID8gam9iLnByb2dyZXNzLnByaW50VGltZUxlZnQgOiBudWxsLFxuICAgICAgICB0ZW1wczogW3RlbXAoJ25venpsZScsIHRlbXBzLnRvb2wwPy5hY3R1YWwsIHRlbXBzLnRvb2wwPy50YXJnZXQpLCB0ZW1wKCdiZWQnLCB0ZW1wcy5iZWQ/LmFjdHVhbCwgdGVtcHMuYmVkPy50YXJnZXQpXVxuICAgICAgICAgIC5maWx0ZXIoKGl0ZW0pOiBpdGVtIGlzIE5vbk51bGxhYmxlPHR5cGVvZiBpdGVtPiA9PiBpdGVtICE9PSBudWxsKVxuICAgICAgfSlcbiAgICB9IGNhdGNoIHtcbiAgICAgIHRoaXMuc2V0U3RhdHVzKHsgc3RhdGU6ICdvZmZsaW5lJyB9KVxuICAgIH1cbiAgfVxuXG4gIHByaXZhdGUgYXN5bmMgY29tbWFuZCAoYm9keTogb2JqZWN0KSB7XG4gICAgYXdhaXQgZmV0Y2hKc29uKHRoaXMuZGVwcywgaHR0cFVybCh0aGlzLnJlY29yZC5ob3N0LCAnL2FwaS9qb2InKSwge1xuICAgICAgbWV0aG9kOiAnUE9TVCcsXG4gICAgICBoZWFkZXJzOiB7ICdDb250ZW50LVR5cGUnOiAnYXBwbGljYXRpb24vanNvbicgfSxcbiAgICAgIGJvZHk6IEpTT04uc3RyaW5naWZ5KGJvZHkpXG4gICAgfSwgdGhpcy5jcmVkZW50aWFscz8uYXBpS2V5KVxuICB9XG5cbiAgcGF1c2UgKCk6IFByb21pc2U8dm9pZD4geyByZXR1cm4gdGhpcy5jb21tYW5kKHsgY29tbWFuZDogJ3BhdXNlJywgYWN0aW9uOiAncGF1c2UnIH0pIH1cbiAgcmVzdW1lICgpOiBQcm9taXNlPHZvaWQ+IHsgcmV0dXJuIHRoaXMuY29tbWFuZCh7IGNvbW1hbmQ6ICdwYXVzZScsIGFjdGlvbjogJ3Jlc3VtZScgfSkgfVxuICBzdG9wICgpOiBQcm9taXNlPHZvaWQ+IHsgcmV0dXJuIHRoaXMuY29tbWFuZCh7IGNvbW1hbmQ6ICdjYW5jZWwnIH0pIH1cblxuICBhc3luYyBsaXN0RmlsZXMgKCk6IFByb21pc2U8Rm9yZWlnbkZpbGVbXT4ge1xuICAgIGNvbnN0IHJlc3BvbnNlID0gYXdhaXQgZmV0Y2hKc29uKHRoaXMuZGVwcywgaHR0cFVybCh0aGlzLnJlY29yZC5ob3N0LCAnL2FwaS9maWxlcy9sb2NhbD9yZWN1cnNpdmU9dHJ1ZScpLCB7fSwgdGhpcy5jcmVkZW50aWFscz8uYXBpS2V5KVxuICAgIHJldHVybiAocmVzcG9uc2U/LmZpbGVzID8/IFtdKS5tYXAoKGZpbGU6IGFueSkgPT4gKHtcbiAgICAgIHBhdGg6IGZpbGUucGF0aCxcbiAgICAgIG5hbWU6IGZpbGUubmFtZSxcbiAgICAgIHNpemU6IGZpbGUuc2l6ZSxcbiAgICAgIG1vZGlmaWVkOiBmaWxlLmRhdGVcbiAgICB9KSlcbiAgfVxuXG4gIHByaW50RmlsZSAocGF0aDogc3RyaW5nKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgcmV0dXJuIHRoaXMuZmlsZUNvbW1hbmQocGF0aCwgeyBjb21tYW5kOiAnc2VsZWN0JywgcHJpbnQ6IHRydWUgfSlcbiAgfVxuXG4gIHByaXZhdGUgYXN5bmMgZmlsZUNvbW1hbmQgKHBhdGg6IHN0cmluZywgYm9keTogb2JqZWN0KSB7XG4gICAgYXdhaXQgZmV0Y2hKc29uKHRoaXMuZGVwcywgaHR0cFVybCh0aGlzLnJlY29yZC5ob3N0LCBgL2FwaS9maWxlcy9sb2NhbC8ke3BhdGguc3BsaXQoJy8nKS5tYXAoZW5jb2RlVVJJQ29tcG9uZW50KS5qb2luKCcvJyl9YCksIHtcbiAgICAgIG1ldGhvZDogJ1BPU1QnLFxuICAgICAgaGVhZGVyczogeyAnQ29udGVudC1UeXBlJzogJ2FwcGxpY2F0aW9uL2pzb24nIH0sXG4gICAgICBib2R5OiBKU09OLnN0cmluZ2lmeShib2R5KVxuICAgIH0sIHRoaXMuY3JlZGVudGlhbHM/LmFwaUtleSlcbiAgfVxuXG4gIGFzeW5jIHVwbG9hZCAoZmlsZTogRmlsZSB8IEJsb2IsIG5hbWU6IHN0cmluZywgcHJpbnQ6IGJvb2xlYW4pOiBQcm9taXNlPHZvaWQ+IHtcbiAgICBjb25zdCBmb3JtID0gbmV3IEZvcm1EYXRhKClcbiAgICBmb3JtLmFwcGVuZCgnZmlsZScsIGZpbGUsIG5hbWUpXG4gICAgaWYgKHByaW50KSBmb3JtLmFwcGVuZCgncHJpbnQnLCAndHJ1ZScpXG4gICAgY29uc3QgaGVhZGVycyA9IHRoaXMuY3JlZGVudGlhbHM/LmFwaUtleSA/IHsgJ1gtQXBpLUtleSc6IHRoaXMuY3JlZGVudGlhbHMuYXBpS2V5IH0gOiB1bmRlZmluZWRcbiAgICBjb25zdCByZXNwb25zZSA9IGF3YWl0IHRoaXMuZGVwcy5mZXRjaChodHRwVXJsKHRoaXMucmVjb3JkLmhvc3QsICcvYXBpL2ZpbGVzL2xvY2FsJyksIHtcbiAgICAgIG1ldGhvZDogJ1BPU1QnLFxuICAgICAgYm9keTogZm9ybSxcbiAgICAgIGhlYWRlcnMsXG4gICAgICBjYWNoZTogJ25vLXN0b3JlJ1xuICAgIH0pXG4gICAgaWYgKCFyZXNwb25zZS5vaykgdGhyb3cgbmV3IEVycm9yKGBIVFRQICR7cmVzcG9uc2Uuc3RhdHVzfWApXG4gICAgYXdhaXQgcmVzcG9uc2UuanNvbigpXG4gIH1cblxuICBjbG9zZSAoKSB7XG4gICAgaWYgKHRoaXMucG9sbFRpbWVyKSBjbGVhckludGVydmFsKHRoaXMucG9sbFRpbWVyKVxuICAgIHRoaXMucG9sbFRpbWVyID0gbnVsbFxuICAgIHN1cGVyLmNsb3NlKClcbiAgfVxufVxuIl0sIm1hcHBpbmdzIjoiQUFDQSxTQUFTLGVBQWUsV0FBVyxTQUFTLGVBQWUsWUFBWTtBQUN2RSxTQUFTLHNCQUFzQjtBQUV4QixhQUFNLHlCQUE4QztBQUFBLEVBQ3pELGFBQWE7QUFBQSxFQUNiLE1BQU07QUFBQSxFQUNOLFFBQVE7QUFBQSxFQUNSLFdBQVc7QUFBQSxFQUNYLGtCQUFrQjtBQUFBLEVBQ2xCLFFBQVE7QUFDVjtBQUVBLHFCQUFx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