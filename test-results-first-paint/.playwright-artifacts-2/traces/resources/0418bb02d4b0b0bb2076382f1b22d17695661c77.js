import Vue from "/.vite-e2e/4291/deps/vue.js?v=9b9fafc7";
export const REMEMBER_CONTROL_FOLDS = true;
export class ControlPreferenceStore {
  state = Vue.observable({ folds: {}, error: "", ready: false });
  context = null;
  generation = 0;
  readGeneration = 0;
  edited = {};
  revisions = {};
  revision = 0;
  queue = Promise.resolve();
  loading = null;
  remote;
  storage;
  constructor(remote, storage) {
    this.remote = remote;
    this.storage = storage;
  }
  isSelected(context) {
    return context.accountId === this.context?.accountId && context.printerId === this.context?.printerId;
  }
  select(context) {
    if (!this.isSelected(context)) {
      this.generation++;
      this.readGeneration++;
      this.context = { ...context };
      this.edited = {};
      this.revisions = {};
      this.state.folds = {};
      this.state.error = "";
      this.state.ready = false;
      this.loading = null;
      this.queue = Promise.resolve();
    } else {
      if (context.token !== this.context?.token) {
        this.readGeneration++;
        this.loading = null;
      }
      this.context = { ...context };
    }
    return this.refresh();
  }
  refresh() {
    if (this.loading) return this.loading;
    const context = this.context;
    const generation = this.generation;
    const readGeneration = this.readGeneration;
    const revision = this.revision;
    if (!context?.printerId || !validKey(context.printerId, 128)) return Promise.resolve();
    const pending = (async () => {
      try {
        let answer = { version: 1, folds: {} };
        if (REMEMBER_CONTROL_FOLDS) {
          if (context.accountId) {
            if (!context.token) throw new Error("Sign in again to sync your choices.");
            answer = await this.remote.read(context);
          } else {
            const saved = this.storage.getItem(this.browserKey(context));
            if (saved) answer = JSON.parse(saved);
          }
        }
        validatePreferences(answer);
        if (generation !== this.generation || readGeneration !== this.readGeneration || revision !== this.revision) return;
        this.state.folds = { ...answer.folds, ...this.edited };
        if (Object.keys(this.edited).length === 0) this.state.error = "";
        this.state.ready = true;
      } catch {
        if (generation === this.generation && readGeneration === this.readGeneration && revision === this.revision) this.state.error = "Your choices are not saved. Try again when the service or browser storage is available.";
      }
    })();
    this.loading = pending;
    pending.finally(() => {
      if (this.loading === pending) this.loading = null;
    });
    return pending;
  }
  setFold(key, open) {
    if (!validKey(key, 64)) return Promise.resolve();
    const context = this.context;
    const generation = this.generation;
    if (!context?.printerId || !validKey(context.printerId, 128)) {
      Vue.set(this.state.folds, key, open);
      this.state.error = "Your choices are not saved until this printer is identified.";
      return Promise.resolve();
    }
    this.edited[key] = open;
    const revision = ++this.revision;
    this.revisions[key] = revision;
    Vue.set(this.state.folds, key, open);
    const save = async () => {
      if (generation !== this.generation || !REMEMBER_CONTROL_FOLDS) return;
      try {
        if (context.accountId) {
          if (!context.token) throw new Error("Sign in again to sync your choices.");
          const answer = await this.remote.patch(context, { [key]: open });
          validatePreferences(answer);
          if (generation !== this.generation) return;
          if (this.revisions[key] === revision) delete this.edited[key];
          this.state.folds = { ...answer.folds, ...this.edited };
        } else {
          const saved = this.storage.getItem(this.browserKey(context));
          const current = saved ? JSON.parse(saved) : { version: 1, folds: {} };
          validatePreferences(current);
          const next = { version: 1, folds: { ...current.folds, [key]: open } };
          validatePreferences(next);
          this.storage.setItem(this.browserKey(context), JSON.stringify(next));
          if (this.revisions[key] === revision) delete this.edited[key];
          this.state.folds = { ...next.folds, ...this.edited };
        }
        if (generation === this.generation) {
          if (Object.keys(this.edited).length === 0) this.state.error = "";
          this.state.ready = true;
        }
      } catch {
        if (generation === this.generation) this.state.error = "Your choices are not saved. Try again when the service or browser storage is available.";
      }
    };
    this.queue = this.queue.then(save);
    return this.queue;
  }
  browserKey(context) {
    return `muon.control.v1.anonymous.${context.printerId}`;
  }
  async retry() {
    const generation = this.generation;
    await this.refresh();
    if (generation !== this.generation) return;
    await Promise.all(Object.entries(this.edited).map(([key, open]) => this.setFold(key, open)));
  }
}
function validKey(key, limit) {
  return key.length > 0 && key.length <= limit && /^[a-z0-9_.:-]+$/i.test(key);
}
export function validatePreferences(value) {
  const p = value;
  if (!p || ![1, 2].includes(p.version) || !p.folds || typeof p.folds !== "object" || Array.isArray(p.folds) || Object.keys(p.folds).length > 64 || Object.entries(p.folds).some(([k, v]) => !validKey(k, 64) || typeof v !== "boolean")) {
    throw new Error("Unsupported Control preferences.");
  }
}

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbInByZWZlcmVuY2VzLnRzIl0sInNvdXJjZXNDb250ZW50IjpbImltcG9ydCBWdWUgZnJvbSAndnVlJ1xuXG5leHBvcnQgY29uc3QgUkVNRU1CRVJfQ09OVFJPTF9GT0xEUyA9IHRydWVcbi8qKiBWZXJzaW9uIDIgaXMgYW4gYWNjb3VudCBhbnN3ZXIgdGhhdCBhbHNvIGNhcnJpZXMgZmllbGRzIHRoaXMgcGFnZSBubyBsb25nZXIgcmVhZHM7IHRoZSBmb2xkcyBhcmUgd2hhdCBjb3VudC4gKi9cbmV4cG9ydCBpbnRlcmZhY2UgQ29udHJvbFByZWZlcmVuY2VzIHsgdmVyc2lvbjogMSB8IDI7IGZvbGRzOiBSZWNvcmQ8c3RyaW5nLCBib29sZWFuPiB9XG5leHBvcnQgaW50ZXJmYWNlIFByZWZlcmVuY2VDb250ZXh0IHsgYWNjb3VudElkOiBzdHJpbmcgfCBudWxsOyBwcmludGVySWQ6IHN0cmluZyB8IG51bGw7IHRva2VuOiBzdHJpbmcgfCBudWxsIH1cbmV4cG9ydCBpbnRlcmZhY2UgUHJlZmVyZW5jZVJlbW90ZSB7XG4gIHJlYWQ6IChjb250ZXh0OiBQcmVmZXJlbmNlQ29udGV4dCkgPT4gUHJvbWlzZTxDb250cm9sUHJlZmVyZW5jZXM+O1xuICBwYXRjaDogKGNvbnRleHQ6IFByZWZlcmVuY2VDb250ZXh0LCBmb2xkczogUmVjb3JkPHN0cmluZywgYm9vbGVhbj4pID0+IFByb21pc2U8Q29udHJvbFByZWZlcmVuY2VzPjtcbn1cblxuZXhwb3J0IGNsYXNzIENvbnRyb2xQcmVmZXJlbmNlU3RvcmUge1xuICBzdGF0ZSA9IFZ1ZS5vYnNlcnZhYmxlKHsgZm9sZHM6IHt9IGFzIFJlY29yZDxzdHJpbmcsIGJvb2xlYW4+LCBlcnJvcjogJycsIHJlYWR5OiBmYWxzZSB9KVxuICBwcml2YXRlIGNvbnRleHQ6IFByZWZlcmVuY2VDb250ZXh0IHwgbnVsbCA9IG51bGxcbiAgcHJpdmF0ZSBnZW5lcmF0aW9uID0gMFxuICBwcml2YXRlIHJlYWRHZW5lcmF0aW9uID0gMFxuICBwcml2YXRlIGVkaXRlZDogUmVjb3JkPHN0cmluZywgYm9vbGVhbj4gPSB7fVxuICBwcml2YXRlIHJldmlzaW9uczogUmVjb3JkPHN0cmluZywgbnVtYmVyPiA9IHt9XG4gIHByaXZhdGUgcmV2aXNpb24gPSAwXG4gIHByaXZhdGUgcXVldWU6IFByb21pc2U8dm9pZD4gPSBQcm9taXNlLnJlc29sdmUoKVxuICBwcml2YXRlIGxvYWRpbmc6IFByb21pc2U8dm9pZD4gfCBudWxsID0gbnVsbFxuXG4gIHByaXZhdGUgcmVtb3RlOiBQcmVmZXJlbmNlUmVtb3RlXG4gIHByaXZhdGUgc3RvcmFnZTogUGljazxTdG9yYWdlLCAnZ2V0SXRlbScgfCAnc2V0SXRlbSc+XG5cbiAgY29uc3RydWN0b3IgKHJlbW90ZTogUHJlZmVyZW5jZVJlbW90ZSwgc3RvcmFnZTogUGljazxTdG9yYWdlLCAnZ2V0SXRlbScgfCAnc2V0SXRlbSc+KSB7XG4gICAgdGhpcy5yZW1vdGUgPSByZW1vdGVcbiAgICB0aGlzLnN0b3JhZ2UgPSBzdG9yYWdlXG4gIH1cblxuICBpc1NlbGVjdGVkIChjb250ZXh0OiBQcmVmZXJlbmNlQ29udGV4dCk6IGJvb2xlYW4ge1xuICAgIHJldHVybiBjb250ZXh0LmFjY291bnRJZCA9PT0gdGhpcy5jb250ZXh0Py5hY2NvdW50SWQgJiYgY29udGV4dC5wcmludGVySWQgPT09IHRoaXMuY29udGV4dD8ucHJpbnRlcklkXG4gIH1cblxuICBzZWxlY3QgKGNvbnRleHQ6IFByZWZlcmVuY2VDb250ZXh0KTogUHJvbWlzZTx2b2lkPiB7XG4gICAgaWYgKCF0aGlzLmlzU2VsZWN0ZWQoY29udGV4dCkpIHtcbiAgICAgIHRoaXMuZ2VuZXJhdGlvbisrXG4gICAgICB0aGlzLnJlYWRHZW5lcmF0aW9uKytcbiAgICAgIHRoaXMuY29udGV4dCA9IHsgLi4uY29udGV4dCB9XG4gICAgICB0aGlzLmVkaXRlZCA9IHt9XG4gICAgICB0aGlzLnJldmlzaW9ucyA9IHt9XG4gICAgICB0aGlzLnN0YXRlLmZvbGRzID0ge31cbiAgICAgIHRoaXMuc3RhdGUuZXJyb3IgPSAnJ1xuICAgICAgdGhpcy5zdGF0ZS5yZWFkeSA9IGZhbHNlXG4gICAgICB0aGlzLmxvYWRpbmcgPSBudWxsXG4gICAgICAvLyBPbGQgcmVxdWVzdHMga2VlcCB0aGVpciBjYXB0dXJlZCBzZXNzaW9uOyB0aGlzIGNvbnRleHQgZ2V0cyBpdHMgb3duIHF1ZXVlLlxuICAgICAgdGhpcy5xdWV1ZSA9IFByb21pc2UucmVzb2x2ZSgpXG4gICAgfSBlbHNlIHtcbiAgICAgIC8vIEEgcmVmcmVzaGVkIHRva2VuIGlzIG5ldyBhdXRob3JpdHkgZm9yIGZ1dHVyZSByZXF1ZXN0cywgbm90IGEgbmV3IHBlcnNvbidzXG4gICAgICAvLyBwcmVmZXJlbmNlcy4gS2VlcCBwZW5kaW5nIGVkaXRzIHdoaWxlIHJvdGF0aW5nIHRoZSBjYXB0dXJlZCBjcmVkZW50aWFscy5cbiAgICAgIGlmIChjb250ZXh0LnRva2VuICE9PSB0aGlzLmNvbnRleHQ/LnRva2VuKSB7XG4gICAgICAgIHRoaXMucmVhZEdlbmVyYXRpb24rK1xuICAgICAgICB0aGlzLmxvYWRpbmcgPSBudWxsXG4gICAgICB9XG4gICAgICB0aGlzLmNvbnRleHQgPSB7IC4uLmNvbnRleHQgfVxuICAgIH1cbiAgICByZXR1cm4gdGhpcy5yZWZyZXNoKClcbiAgfVxuXG4gIHJlZnJlc2ggKCk6IFByb21pc2U8dm9pZD4ge1xuICAgIGlmICh0aGlzLmxvYWRpbmcpIHJldHVybiB0aGlzLmxvYWRpbmdcbiAgICBjb25zdCBjb250ZXh0ID0gdGhpcy5jb250ZXh0XG4gICAgY29uc3QgZ2VuZXJhdGlvbiA9IHRoaXMuZ2VuZXJhdGlvblxuICAgIGNvbnN0IHJlYWRHZW5lcmF0aW9uID0gdGhpcy5yZWFkR2VuZXJhdGlvblxuICAgIGNvbnN0IHJldmlzaW9uID0gdGhpcy5yZXZpc2lvblxuICAgIGlmICghY29udGV4dD8ucHJpbnRlcklkIHx8ICF2YWxpZEtleShjb250ZXh0LnByaW50ZXJJZCwgMTI4KSkgcmV0dXJuIFByb21pc2UucmVzb2x2ZSgpXG4gICAgY29uc3QgcGVuZGluZyA9IChhc3luYyAoKSA9PiB7XG4gICAgICB0cnkge1xuICAgICAgICBsZXQgYW5zd2VyOiBDb250cm9sUHJlZmVyZW5jZXMgPSB7IHZlcnNpb246IDEsIGZvbGRzOiB7fSB9XG4gICAgICAgIGlmIChSRU1FTUJFUl9DT05UUk9MX0ZPTERTKSB7XG4gICAgICAgICAgaWYgKGNvbnRleHQuYWNjb3VudElkKSB7XG4gICAgICAgICAgICBpZiAoIWNvbnRleHQudG9rZW4pIHRocm93IG5ldyBFcnJvcignU2lnbiBpbiBhZ2FpbiB0byBzeW5jIHlvdXIgY2hvaWNlcy4nKVxuICAgICAgICAgICAgYW5zd2VyID0gYXdhaXQgdGhpcy5yZW1vdGUucmVhZChjb250ZXh0KVxuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBjb25zdCBzYXZlZCA9IHRoaXMuc3RvcmFnZS5nZXRJdGVtKHRoaXMuYnJvd3NlcktleShjb250ZXh0KSlcbiAgICAgICAgICAgIGlmIChzYXZlZCkgYW5zd2VyID0gSlNPTi5wYXJzZShzYXZlZClcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgdmFsaWRhdGVQcmVmZXJlbmNlcyhhbnN3ZXIpXG4gICAgICAgIGlmIChnZW5lcmF0aW9uICE9PSB0aGlzLmdlbmVyYXRpb24gfHwgcmVhZEdlbmVyYXRpb24gIT09IHRoaXMucmVhZEdlbmVyYXRpb24gfHwgcmV2aXNpb24gIT09IHRoaXMucmV2aXNpb24pIHJldHVyblxuICAgICAgICB0aGlzLnN0YXRlLmZvbGRzID0geyAuLi5hbnN3ZXIuZm9sZHMsIC4uLnRoaXMuZWRpdGVkIH1cbiAgICAgICAgaWYgKE9iamVjdC5rZXlzKHRoaXMuZWRpdGVkKS5sZW5ndGggPT09IDApIHRoaXMuc3RhdGUuZXJyb3IgPSAnJ1xuICAgICAgICB0aGlzLnN0YXRlLnJlYWR5ID0gdHJ1ZVxuICAgICAgfSBjYXRjaCB7XG4gICAgICAgIGlmIChnZW5lcmF0aW9uID09PSB0aGlzLmdlbmVyYXRpb24gJiYgcmVhZEdlbmVyYXRpb24gPT09IHRoaXMucmVhZEdlbmVyYXRpb24gJiYgcmV2aXNpb24gPT09IHRoaXMucmV2aXNpb24pIHRoaXMuc3RhdGUuZXJyb3IgPSAnWW91ciBjaG9pY2VzIGFyZSBub3Qgc2F2ZWQuIFRyeSBhZ2FpbiB3aGVuIHRoZSBzZXJ2aWNlIG9yIGJyb3dzZXIgc3RvcmFnZSBpcyBhdmFpbGFibGUuJ1xuICAgICAgfVxuICAgIH0pKClcbiAgICB0aGlzLmxvYWRpbmcgPSBwZW5kaW5nXG4gICAgcGVuZGluZy5maW5hbGx5KCgpID0+IHsgaWYgKHRoaXMubG9hZGluZyA9PT0gcGVuZGluZykgdGhpcy5sb2FkaW5nID0gbnVsbCB9KVxuICAgIHJldHVybiBwZW5kaW5nXG4gIH1cblxuICBzZXRGb2xkIChrZXk6IHN0cmluZywgb3BlbjogYm9vbGVhbik6IFByb21pc2U8dm9pZD4ge1xuICAgIGlmICghdmFsaWRLZXkoa2V5LCA2NCkpIHJldHVybiBQcm9taXNlLnJlc29sdmUoKVxuICAgIGNvbnN0IGNvbnRleHQgPSB0aGlzLmNvbnRleHRcbiAgICBjb25zdCBnZW5lcmF0aW9uID0gdGhpcy5nZW5lcmF0aW9uXG4gICAgaWYgKCFjb250ZXh0Py5wcmludGVySWQgfHwgIXZhbGlkS2V5KGNvbnRleHQucHJpbnRlcklkLCAxMjgpKSB7XG4gICAgICBWdWUuc2V0KHRoaXMuc3RhdGUuZm9sZHMsIGtleSwgb3BlbilcbiAgICAgIHRoaXMuc3RhdGUuZXJyb3IgPSAnWW91ciBjaG9pY2VzIGFyZSBub3Qgc2F2ZWQgdW50aWwgdGhpcyBwcmludGVyIGlzIGlkZW50aWZpZWQuJ1xuICAgICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZSgpXG4gICAgfVxuICAgIHRoaXMuZWRpdGVkW2tleV0gPSBvcGVuXG4gICAgY29uc3QgcmV2aXNpb24gPSArK3RoaXMucmV2aXNpb25cbiAgICB0aGlzLnJldmlzaW9uc1trZXldID0gcmV2aXNpb25cbiAgICBWdWUuc2V0KHRoaXMuc3RhdGUuZm9sZHMsIGtleSwgb3BlbilcbiAgICBjb25zdCBzYXZlID0gYXN5bmMgKCkgPT4ge1xuICAgICAgaWYgKGdlbmVyYXRpb24gIT09IHRoaXMuZ2VuZXJhdGlvbiB8fCAhUkVNRU1CRVJfQ09OVFJPTF9GT0xEUykgcmV0dXJuXG4gICAgICB0cnkge1xuICAgICAgICBpZiAoY29udGV4dC5hY2NvdW50SWQpIHtcbiAgICAgICAgICBpZiAoIWNvbnRleHQudG9rZW4pIHRocm93IG5ldyBFcnJvcignU2lnbiBpbiBhZ2FpbiB0byBzeW5jIHlvdXIgY2hvaWNlcy4nKVxuICAgICAgICAgIGNvbnN0IGFuc3dlciA9IGF3YWl0IHRoaXMucmVtb3RlLnBhdGNoKGNvbnRleHQsIHsgW2tleV06IG9wZW4gfSlcbiAgICAgICAgICB2YWxpZGF0ZVByZWZlcmVuY2VzKGFuc3dlcilcbiAgICAgICAgICBpZiAoZ2VuZXJhdGlvbiAhPT0gdGhpcy5nZW5lcmF0aW9uKSByZXR1cm5cbiAgICAgICAgICBpZiAodGhpcy5yZXZpc2lvbnNba2V5XSA9PT0gcmV2aXNpb24pIGRlbGV0ZSB0aGlzLmVkaXRlZFtrZXldXG4gICAgICAgICAgdGhpcy5zdGF0ZS5mb2xkcyA9IHsgLi4uYW5zd2VyLmZvbGRzLCAuLi50aGlzLmVkaXRlZCB9XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgY29uc3Qgc2F2ZWQgPSB0aGlzLnN0b3JhZ2UuZ2V0SXRlbSh0aGlzLmJyb3dzZXJLZXkoY29udGV4dCkpXG4gICAgICAgICAgY29uc3QgY3VycmVudDogdW5rbm93biA9IHNhdmVkID8gSlNPTi5wYXJzZShzYXZlZCkgOiB7IHZlcnNpb246IDEsIGZvbGRzOiB7fSB9XG4gICAgICAgICAgdmFsaWRhdGVQcmVmZXJlbmNlcyhjdXJyZW50KVxuICAgICAgICAgIGNvbnN0IG5leHQgPSB7IHZlcnNpb246IDEgYXMgY29uc3QsIGZvbGRzOiB7IC4uLmN1cnJlbnQuZm9sZHMsIFtrZXldOiBvcGVuIH0gfVxuICAgICAgICAgIHZhbGlkYXRlUHJlZmVyZW5jZXMobmV4dClcbiAgICAgICAgICB0aGlzLnN0b3JhZ2Uuc2V0SXRlbSh0aGlzLmJyb3dzZXJLZXkoY29udGV4dCksIEpTT04uc3RyaW5naWZ5KG5leHQpKVxuICAgICAgICAgIGlmICh0aGlzLnJldmlzaW9uc1trZXldID09PSByZXZpc2lvbikgZGVsZXRlIHRoaXMuZWRpdGVkW2tleV1cbiAgICAgICAgICB0aGlzLnN0YXRlLmZvbGRzID0geyAuLi5uZXh0LmZvbGRzLCAuLi50aGlzLmVkaXRlZCB9XG4gICAgICAgIH1cbiAgICAgICAgaWYgKGdlbmVyYXRpb24gPT09IHRoaXMuZ2VuZXJhdGlvbikge1xuICAgICAgICAgIGlmIChPYmplY3Qua2V5cyh0aGlzLmVkaXRlZCkubGVuZ3RoID09PSAwKSB0aGlzLnN0YXRlLmVycm9yID0gJydcbiAgICAgICAgICB0aGlzLnN0YXRlLnJlYWR5ID0gdHJ1ZVxuICAgICAgICB9XG4gICAgICB9IGNhdGNoIHtcbiAgICAgICAgaWYgKGdlbmVyYXRpb24gPT09IHRoaXMuZ2VuZXJhdGlvbikgdGhpcy5zdGF0ZS5lcnJvciA9ICdZb3VyIGNob2ljZXMgYXJlIG5vdCBzYXZlZC4gVHJ5IGFnYWluIHdoZW4gdGhlIHNlcnZpY2Ugb3IgYnJvd3NlciBzdG9yYWdlIGlzIGF2YWlsYWJsZS4nXG4gICAgICB9XG4gICAgfVxuICAgIHRoaXMucXVldWUgPSB0aGlzLnF1ZXVlLnRoZW4oc2F2ZSlcbiAgICByZXR1cm4gdGhpcy5xdWV1ZVxuICB9XG5cbiAgcHJpdmF0ZSBicm93c2VyS2V5IChjb250ZXh0OiBQcmVmZXJlbmNlQ29udGV4dCk6IHN0cmluZyB7XG4gICAgcmV0dXJuIGBtdW9uLmNvbnRyb2wudjEuYW5vbnltb3VzLiR7Y29udGV4dC5wcmludGVySWR9YFxuICB9XG5cbiAgYXN5bmMgcmV0cnkgKCk6IFByb21pc2U8dm9pZD4ge1xuICAgIGNvbnN0IGdlbmVyYXRpb24gPSB0aGlzLmdlbmVyYXRpb25cbiAgICBhd2FpdCB0aGlzLnJlZnJlc2goKVxuICAgIGlmIChnZW5lcmF0aW9uICE9PSB0aGlzLmdlbmVyYXRpb24pIHJldHVyblxuICAgIGF3YWl0IFByb21pc2UuYWxsKE9iamVjdC5lbnRyaWVzKHRoaXMuZWRpdGVkKS5tYXAoKFtrZXksIG9wZW5dKSA9PiB0aGlzLnNldEZvbGQoa2V5LCBvcGVuKSkpXG4gIH1cbn1cblxuZnVuY3Rpb24gdmFsaWRLZXkgKGtleTogc3RyaW5nLCBsaW1pdDogbnVtYmVyKTogYm9vbGVhbiB7XG4gIHJldHVybiBrZXkubGVuZ3RoID4gMCAmJiBrZXkubGVuZ3RoIDw9IGxpbWl0ICYmIC9eW2EtejAtOV8uOi1dKyQvaS50ZXN0KGtleSlcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIHZhbGlkYXRlUHJlZmVyZW5jZXMgKHZhbHVlOiB1bmtub3duKTogYXNzZXJ0cyB2YWx1ZSBpcyBDb250cm9sUHJlZmVyZW5jZXMge1xuICBjb25zdCBwID0gdmFsdWUgYXMgQ29udHJvbFByZWZlcmVuY2VzIHwgbnVsbFxuICBpZiAoIXAgfHwgIVsxLCAyXS5pbmNsdWRlcyhwLnZlcnNpb24pIHx8ICFwLmZvbGRzIHx8IHR5cGVvZiBwLmZvbGRzICE9PSAnb2JqZWN0JyB8fCBBcnJheS5pc0FycmF5KHAuZm9sZHMpIHx8XG4gICAgT2JqZWN0LmtleXMocC5mb2xkcykubGVuZ3RoID4gNjQgfHwgT2JqZWN0LmVudHJpZXMocC5mb2xkcykuc29tZSgoW2ssIHZdKSA9PiAhdmFsaWRLZXkoaywgNjQpIHx8IHR5cGVvZiB2ICE9PSAnYm9vbGVhbicpKSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKCdVbnN1cHBvcnRlZCBDb250cm9sIHByZWZlcmVuY2VzLicpXG4gIH1cbn1cbiJdLCJtYXBwaW5ncyI6IkFBQUEsT0FBTyxTQUFTO0FBRVQsYUFBTSx5QkFBeUI7QUFTL0IsYUFBTSx1QkFBdUI7QUFBQSxFQUNsQyxRQUFRLElBQUksV0FBVyxFQUFFLE9BQU8sQ0FBQyxHQUE4QixPQUFPLElBQUksT0FBTyxNQUFNLENBQUM7QUFBQSxF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