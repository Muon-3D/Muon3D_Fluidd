import { SocketActions } from "/src/api/socketActions.ts";
import { Globals } from "/src/globals.ts";
import { YEAR_LIMIT, dayKey, yearSince } from "/src/services/history/year.ts";
const YEAR_TIMEOUT_MS = 15e3;
export const actions = {
  /**
   * Reset our store
   */
  async reset({ commit }) {
    commit("setReset");
  },
  /**
   * Inits moonraker component
   */
  async init() {
    SocketActions.serverHistoryList({ limit: Globals.JOB_HISTORY_LOAD });
    SocketActions.serverHistoryTotals();
  },
  async updateHistory({ commit }, payload) {
    if (payload) {
      commit("setUpdateHistory", payload);
    }
  },
  async clearHistoryThumbnails({ commit }, payload) {
    if (payload) {
      commit("setClearHistoryThumbnails", payload);
    }
  },
  /**
   * Update the store with history totals data
   */
  async onHistoryTotals({ commit }, payload) {
    if (payload) {
      commit("setHistoryTotals", payload);
    }
  },
  /**
   * Update the store with history
   */
  async onHistoryList({ commit }, payload) {
    if (payload) {
      commit("setHistoryList", payload);
    }
  },
  /**
   * Ask for the last year of jobs (the year grid), once per day per store
   * lifetime: not again on every visit or reconnect. `force` asks again (Retry,
   * or a print finished) and keeps showing what is there meanwhile. A request
   * with no answer in 15 seconds is a failed one.
   */
  async loadYear({ commit, state }, options) {
    const today = dayKey(/* @__PURE__ */ new Date());
    if (state.yearStatus === "loading") return;
    if (!options?.force && state.yearStatus === "ready" && state.yearDay === today) return;
    if (state.yearStatus !== "ready") commit("setYearStatus", "loading");
    SocketActions.serverHistoryYear(yearSince(/* @__PURE__ */ new Date()), YEAR_LIMIT);
    setTimeout(() => {
      if (state.yearStatus === "loading") commit("setYearStatus", "error");
    }, YEAR_TIMEOUT_MS);
  },
  /**
   * Update the store with the last year of history (the year grid).
   */
  async onYearList({ commit }, payload) {
    if (payload) {
      commit("setYearJobs", payload);
    }
  },
  /**
   * History has changed, update the data.
   */
  async onHistoryChange({ commit, dispatch, state }, payload) {
    SocketActions.serverHistoryTotals();
    if (payload) {
      if (payload.action === "added") commit("setAddHistory", payload.job);
      if (payload.action === "finished") {
        commit("setUpdateHistory", payload.job);
        if (state.yearStatus === "ready") dispatch("loadYear", { force: true });
      }
    }
  },
  async onDelete({ commit }, payload) {
    commit("setDeleteJob", payload.deleted_jobs);
  }
};

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImFjdGlvbnMudHMiXSwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHR5cGUgeyBBY3Rpb25UcmVlIH0gZnJvbSAndnVleCdcbmltcG9ydCB0eXBlIHsgSGlzdG9yeUl0ZW0sIEhpc3RvcnlTdGF0ZSB9IGZyb20gJy4vdHlwZXMnXG5pbXBvcnQgdHlwZSB7IFJvb3RTdGF0ZSB9IGZyb20gJy4uL3R5cGVzJ1xuaW1wb3J0IHsgU29ja2V0QWN0aW9ucyB9IGZyb20gJ0AvYXBpL3NvY2tldEFjdGlvbnMnXG5pbXBvcnQgeyBHbG9iYWxzIH0gZnJvbSAnQC9nbG9iYWxzJ1xuaW1wb3J0IHsgWUVBUl9MSU1JVCwgZGF5S2V5LCB5ZWFyU2luY2UgfSBmcm9tICdAL3NlcnZpY2VzL2hpc3RvcnkveWVhcidcblxuY29uc3QgWUVBUl9USU1FT1VUX01TID0gMTVfMDAwXG5cbmV4cG9ydCBjb25zdCBhY3Rpb25zOiBBY3Rpb25UcmVlPEhpc3RvcnlTdGF0ZSwgUm9vdFN0YXRlPiA9IHtcbiAgLyoqXG4gICAqIFJlc2V0IG91ciBzdG9yZVxuICAgKi9cbiAgYXN5bmMgcmVzZXQgKHsgY29tbWl0IH0pIHtcbiAgICBjb21taXQoJ3NldFJlc2V0JylcbiAgfSxcblxuICAvKipcbiAgICogSW5pdHMgbW9vbnJha2VyIGNvbXBvbmVudFxuICAgKi9cbiAgYXN5bmMgaW5pdCAoKSB7XG4gICAgLy8gR2V0IHRoZSBsYXN0IDUwIGhpc3RvcnkgaXRlbXMuXG4gICAgU29ja2V0QWN0aW9ucy5zZXJ2ZXJIaXN0b3J5TGlzdCh7IGxpbWl0OiBHbG9iYWxzLkpPQl9ISVNUT1JZX0xPQUQgfSlcblxuICAgIC8vIExvYWQgdGhlIGtub3duIHRvdGFscy5cbiAgICBTb2NrZXRBY3Rpb25zLnNlcnZlckhpc3RvcnlUb3RhbHMoKVxuICB9LFxuXG4gIGFzeW5jIHVwZGF0ZUhpc3RvcnkgKHsgY29tbWl0IH0sIHBheWxvYWQpIHtcbiAgICBpZiAocGF5bG9hZCkge1xuICAgICAgY29tbWl0KCdzZXRVcGRhdGVIaXN0b3J5JywgcGF5bG9hZClcbiAgICB9XG4gIH0sXG5cbiAgYXN5bmMgY2xlYXJIaXN0b3J5VGh1bWJuYWlscyAoeyBjb21taXQgfSwgcGF5bG9hZCkge1xuICAgIGlmIChwYXlsb2FkKSB7XG4gICAgICBjb21taXQoJ3NldENsZWFySGlzdG9yeVRodW1ibmFpbHMnLCBwYXlsb2FkKVxuICAgIH1cbiAgfSxcblxuICAvKipcbiAgICogVXBkYXRlIHRoZSBzdG9yZSB3aXRoIGhpc3RvcnkgdG90YWxzIGRhdGFcbiAgICovXG4gIGFzeW5jIG9uSGlzdG9yeVRvdGFscyAoeyBjb21taXQgfSwgcGF5bG9hZCkge1xuICAgIGlmIChwYXlsb2FkKSB7XG4gICAgICBjb21taXQoJ3NldEhpc3RvcnlUb3RhbHMnLCBwYXlsb2FkKVxuICAgIH1cbiAgfSxcblxuICAvKipcbiAgICogVXBkYXRlIHRoZSBzdG9yZSB3aXRoIGhpc3RvcnlcbiAgICovXG4gIGFzeW5jIG9uSGlzdG9yeUxpc3QgKHsgY29tbWl0IH0sIHBheWxvYWQpIHtcbiAgICBpZiAocGF5bG9hZCkge1xuICAgICAgY29tbWl0KCdzZXRIaXN0b3J5TGlzdCcsIHBheWxvYWQpXG4gICAgfVxuICB9LFxuXG4gIC8qKlxuICAgKiBBc2sgZm9yIHRoZSBsYXN0IHllYXIgb2Ygam9icyAodGhlIHllYXIgZ3JpZCksIG9uY2UgcGVyIGRheSBwZXIgc3RvcmVcbiAgICogbGlmZXRpbWU6IG5vdCBhZ2FpbiBvbiBldmVyeSB2aXNpdCBvciByZWNvbm5lY3QuIGBmb3JjZWAgYXNrcyBhZ2FpbiAoUmV0cnksXG4gICAqIG9yIGEgcHJpbnQgZmluaXNoZWQpIGFuZCBrZWVwcyBzaG93aW5nIHdoYXQgaXMgdGhlcmUgbWVhbndoaWxlLiBBIHJlcXVlc3RcbiAgICogd2l0aCBubyBhbnN3ZXIgaW4gMTUgc2Vjb25kcyBpcyBhIGZhaWxlZCBvbmUuXG4gICAqL1xuICBhc3luYyBsb2FkWWVhciAoeyBjb21taXQsIHN0YXRlIH0sIG9wdGlvbnM/OiB7IGZvcmNlPzogYm9vbGVhbiB9KSB7XG4gICAgY29uc3QgdG9kYXkgPSBkYXlLZXkobmV3IERhdGUoKSlcbiAgICBpZiAoc3RhdGUueWVhclN0YXR1cyA9PT0gJ2xvYWRpbmcnKSByZXR1cm5cbiAgICBpZiAoIW9wdGlvbnM/LmZvcmNlICYmIHN0YXRlLnllYXJTdGF0dXMgPT09ICdyZWFkeScgJiYgc3RhdGUueWVhckRheSA9PT0gdG9kYXkpIHJldHVyblxuICAgIGlmIChzdGF0ZS55ZWFyU3RhdHVzICE9PSAncmVhZHknKSBjb21taXQoJ3NldFllYXJTdGF0dXMnLCAnbG9hZGluZycpXG4gICAgU29ja2V0QWN0aW9ucy5zZXJ2ZXJIaXN0b3J5WWVhcih5ZWFyU2luY2UobmV3IERhdGUoKSksIFlFQVJfTElNSVQpXG4gICAgc2V0VGltZW91dCgoKSA9PiB7XG4gICAgICBpZiAoc3RhdGUueWVhclN0YXR1cyA9PT0gJ2xvYWRpbmcnKSBjb21taXQoJ3NldFllYXJTdGF0dXMnLCAnZXJyb3InKVxuICAgIH0sIFlFQVJfVElNRU9VVF9NUylcbiAgfSxcblxuICAvKipcbiAgICogVXBkYXRlIHRoZSBzdG9yZSB3aXRoIHRoZSBsYXN0IHllYXIgb2YgaGlzdG9yeSAodGhlIHllYXIgZ3JpZCkuXG4gICAqL1xuICBhc3luYyBvblllYXJMaXN0ICh7IGNvbW1pdCB9LCBwYXlsb2FkKSB7XG4gICAgaWYgKHBheWxvYWQpIHtcbiAgICAgIGNvbW1pdCgnc2V0WWVhckpvYnMnLCBwYXlsb2FkKVxuICAgIH1cbiAgfSxcblxuICAvKipcbiAgICogSGlzdG9yeSBoYXMgY2hhbmdlZCwgdXBkYXRlIHRoZSBkYXRhLlxuICAgKi9cbiAgYXN5bmMgb25IaXN0b3J5Q2hhbmdlICh7IGNvbW1pdCwgZGlzcGF0Y2gsIHN0YXRlIH0sIHBheWxvYWQ6IHsgYWN0aW9uOiBzdHJpbmc7IGpvYjogSGlzdG9yeUl0ZW0gfSkge1xuICAgIFNvY2tldEFjdGlvbnMuc2VydmVySGlzdG9yeVRvdGFscygpXG4gICAgaWYgKFxuICAgICAgcGF5bG9hZFxuICAgICkge1xuICAgICAgaWYgKHBheWxvYWQuYWN0aW9uID09PSAnYWRkZWQnKSBjb21taXQoJ3NldEFkZEhpc3RvcnknLCBwYXlsb2FkLmpvYilcbiAgICAgIGlmIChwYXlsb2FkLmFjdGlvbiA9PT0gJ2ZpbmlzaGVkJykge1xuICAgICAgICBjb21taXQoJ3NldFVwZGF0ZUhpc3RvcnknLCBwYXlsb2FkLmpvYilcbiAgICAgICAgLy8gQSB5ZWFyIG9uIHNjcmVlbiBpcyBhIGRheSBtb3JlIHJpZ2h0IG5vdzogYXNrIGFnYWluLCBuZXZlciBwb2xsLlxuICAgICAgICBpZiAoc3RhdGUueWVhclN0YXR1cyA9PT0gJ3JlYWR5JykgZGlzcGF0Y2goJ2xvYWRZZWFyJywgeyBmb3JjZTogdHJ1ZSB9KVxuICAgICAgfVxuICAgIH1cbiAgfSxcblxuICBhc3luYyBvbkRlbGV0ZSAoeyBjb21taXQgfSwgcGF5bG9hZCkge1xuICAgIGNvbW1pdCgnc2V0RGVsZXRlSm9iJywgcGF5bG9hZC5kZWxldGVkX2pvYnMpXG4gIH1cbn1cbiJdLCJtYXBwaW5ncyI6IkFBR0EsU0FBUyxxQkFBcUI7QUFDOUIsU0FBUyxlQUFlO0FBQ3hCLFNBQVMsWUFBWSxRQUFRLGlCQUFpQjtBQUU5QyxNQUFNLGtCQUFrQjtBQUVqQixhQUFNLFVBQStDO0FBQUE7QUFBQTtBQUFBO0FBQUEsRUFJMUQsTUFBTSxNQUFPLEVBQUUsT0FBTyxHQUFHO0FBQ3ZCLFdBQU8sVUFBVTtBQUFBLEVBQ25CO0FBQUE7QUFBQTtBQUFBO0FBQUEsRUFLQSxNQUFNLE9BQVE7QUFFWixrQkFBYyxrQkFBa0IsRUFBRSxPQUFPLFFBQVEsaUJBQWlCLENBQUM7QUFHbkUsa0JBQWMsb0JBQW9CO0FBQUEsRUFDcEM7QUFBQSxFQUVBLE1BQU0sY0FBZSxFQUFFLE9BQU8sR0FBRyxTQUFTO0FBQ3hDLFFBQUksU0FBUztBQUNYLGFBQU8sb0JBQW9CLE9BQU87QUFBQSxJQUNwQztBQUFBLEVBQ0Y7QUFBQSxFQUVBLE1BQU0sdUJBQXdCLEVBQUUsT0FBTyxHQUFHLFNBQVM7QUFDakQsUUFBSSxTQUFTO0FBQ1gsYUFBTyw2QkFBNkIsT0FBTztBQUFBLElBQzdDO0FBQUEsRUFDRjtBQUFBO0FBQUE7QUFBQTtBQUFBLEVBS0EsTUFBTSxnQkFBaUIsRUFBRSxPQUFPLEdBQUcsU0FBUztBQUMxQyxRQUFJLFNBQVM7QUFDWCxhQUFPLG9CQUFvQixPQUFPO0FBQUEsSUFDcEM7QUFBQSxFQUNGO0FBQUE7QUFBQTtBQUFBO0FBQUEsRUFLQSxNQUFNLGNBQWUsRUFBRSxPQUFPLEdBQUcsU0FBUztBQUN4QyxRQUFJLFNBQVM7QUFDWCxhQUFPLGtCQUFrQixPQUFPO0FBQUEsSUFDbEM7QUFBQSxFQUNGO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUEsRUFRQSxNQUFNLFNBQVUsRUFBRSxRQUFRLE1BQU0sR0FBRyxTQUErQjtBQUNoRSxVQUFNLFFBQVEsT0FBTyxvQkFBSSxLQUFLLENBQUM7QUFDL0IsUUFBSSxNQUFNLGVBQWUsVUFBVztBQUNwQyxRQUFJLENBQUMsU0FBUyxTQUFTLE1BQU0sZUFBZSxXQUFXLE1BQU0sWUFBWSxNQUFPO0FBQ2hGLFFBQUksTUFBTSxlQUFlLFFBQVMsUUFBTyxpQkFBaUIsU0FBUztBQUNuRSxrQkFBYyxrQkFBa0IsVUFBVSxvQkFBSSxLQUFLLENBQUMsR0FBRyxVQUFVO0FBQ2pFLGVBQVcsTUFBTTtBQUNmLFVBQUksTUFBTSxlQUFlLFVBQVcsUUFBTyxpQkFBaUIsT0FBTztBQUFBLElBQ3JFLEdBQUcsZUFBZTtBQUFBLEVBQ3BCO0FBQUE7QUFBQTtBQUFBO0FBQUEsRUFLQSxNQUFNLFdBQVksRUFBRSxPQUFPLEdBQUcsU0FBUztBQUNyQyxRQUFJLFNBQVM7QUFDWCxhQUFPLGVBQWUsT0FBTztBQUFBLElBQy9CO0FBQUEsRUFDRjtBQUFBO0FBQUE7QUFBQTtBQUFBLEVBS0EsTUFBTSxnQkFBaUIsRUFBRSxRQUFRLFVBQVUsTUFBTSxHQUFHLFNBQStDO0FBQ2pHLGtCQUFjLG9CQUFvQjtBQUNsQyxRQUNFLFNBQ0E7QUFDQSxVQUFJLFFBQVEsV0FBVyxRQUFTLFFBQU8saUJBQWlCLFFBQVEsR0FBRztBQUNuRSxVQUFJLFFBQVEsV0FBVyxZQUFZO0FBQ2pDLGVBQU8sb0JBQW9CLFFBQVEsR0FBRztBQUV0QyxZQUFJLE1BQU0sZUFBZSxRQUFTLFVBQVMsWUFBWSxFQUFFLE9BQU8sS0FBSyxDQUFDO0FBQUEsTUFDeEU7QUFBQSxJQUNGO0FBQUEsRUFDRjtBQUFBLEVBRUEsTUFBTSxTQUFVLEVBQUUsT0FBTyxHQUFHLFNBQVM7QUFDbkMsV0FBTyxnQkFBZ0IsUUFBUSxZQUFZO0FBQUEsRUFDN0M7QUFDRjsiLCJuYW1lcyI6W119