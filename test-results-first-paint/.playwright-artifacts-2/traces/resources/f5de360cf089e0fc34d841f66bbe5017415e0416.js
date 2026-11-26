import Vue from "/.vite-e2e/4291/deps/vue.js?v=9b9fafc7";
import { defaultState } from "/src/store/history/state.ts";
import { dayKey } from "/src/services/history/year.ts";
export const mutations = {
  /**
   * Reset state
   */
  setReset(state) {
    Object.assign(state, defaultState());
  },
  /**
   * Applies currently known history totals
   */
  setHistoryTotals(state, payload) {
    if (payload) Vue.set(state, "job_totals", payload.job_totals);
  },
  /**
   * Applies history list
   */
  setHistoryList(state, payload) {
    if (payload.jobs !== void 0) Vue.set(state, "jobs", payload.jobs);
    if (payload.count !== void 0) Vue.set(state, "count", payload.count);
  },
  /**
   * Applies the last year of jobs (the year grid), apart from the list.
   */
  setYearJobs(state, payload) {
    if (!payload || !Array.isArray(payload.jobs)) {
      Vue.set(state, "yearStatus", "error");
      return;
    }
    Vue.set(state, "yearJobs", payload.jobs);
    Vue.set(state, "yearCount", Number(payload.count) || payload.jobs.length);
    Vue.set(state, "yearDay", dayKey(/* @__PURE__ */ new Date()));
    Vue.set(state, "yearStatus", "ready");
  },
  /**
   * Where the year's request is.
   */
  setYearStatus(state, status) {
    Vue.set(state, "yearStatus", status);
  },
  /**
   * Adds a history item.
   */
  setAddHistory(state, payload) {
    if (payload) {
      state.jobs.push(payload);
      state.count++;
    }
  },
  /**
   * Updates a history item.
   */
  setUpdateHistory(state, payload) {
    if (payload) {
      const i = state.jobs.findIndex((job) => job.job_id === payload.job_id);
      if (i >= 0) {
        Vue.set(state.jobs, i, payload);
      }
    }
  },
  setClearHistoryThumbnails(state, payload) {
    if (payload) {
      const i = state.jobs.findIndex((job) => job.job_id === payload);
      if (i >= 0) {
        const job = state.jobs[i];
        Vue.set(state.jobs, i, {
          ...job,
          metadata: {
            ...job.metadata,
            thumbnails: []
          }
        });
      }
    }
  },
  setDeleteJob(state, payload) {
    if (payload) {
      payload.forEach((job_id) => {
        const i = state.jobs.findIndex((job) => job.job_id === job_id);
        if (i >= 0) state.jobs.splice(i, 1);
      });
    }
  }
};

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm11dGF0aW9ucy50cyJdLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgVnVlIGZyb20gJ3Z1ZSdcbmltcG9ydCB0eXBlIHsgTXV0YXRpb25UcmVlIH0gZnJvbSAndnVleCdcbmltcG9ydCB7IGRlZmF1bHRTdGF0ZSB9IGZyb20gJy4vc3RhdGUnXG5pbXBvcnQgeyBkYXlLZXkgfSBmcm9tICdAL3NlcnZpY2VzL2hpc3RvcnkveWVhcidcbmltcG9ydCB0eXBlIHsgSGlzdG9yeUl0ZW0sIEhpc3RvcnlTdGF0ZSB9IGZyb20gJy4vdHlwZXMnXG5cbmV4cG9ydCBjb25zdCBtdXRhdGlvbnM6IE11dGF0aW9uVHJlZTxIaXN0b3J5U3RhdGU+ID0ge1xuICAvKipcbiAgICogUmVzZXQgc3RhdGVcbiAgICovXG4gIHNldFJlc2V0IChzdGF0ZSkge1xuICAgIE9iamVjdC5hc3NpZ24oc3RhdGUsIGRlZmF1bHRTdGF0ZSgpKVxuICB9LFxuXG4gIC8qKlxuICAgKiBBcHBsaWVzIGN1cnJlbnRseSBrbm93biBoaXN0b3J5IHRvdGFsc1xuICAgKi9cbiAgc2V0SGlzdG9yeVRvdGFscyAoc3RhdGUsIHBheWxvYWQ6IEhpc3RvcnlTdGF0ZSkge1xuICAgIGlmIChwYXlsb2FkKSBWdWUuc2V0KHN0YXRlLCAnam9iX3RvdGFscycsIHBheWxvYWQuam9iX3RvdGFscylcbiAgfSxcblxuICAvKipcbiAgICogQXBwbGllcyBoaXN0b3J5IGxpc3RcbiAgICovXG4gIHNldEhpc3RvcnlMaXN0IChzdGF0ZSwgcGF5bG9hZDogSGlzdG9yeVN0YXRlKSB7XG4gICAgaWYgKHBheWxvYWQuam9icyAhPT0gdW5kZWZpbmVkKSBWdWUuc2V0KHN0YXRlLCAnam9icycsIHBheWxvYWQuam9icylcbiAgICBpZiAocGF5bG9hZC5jb3VudCAhPT0gdW5kZWZpbmVkKSBWdWUuc2V0KHN0YXRlLCAnY291bnQnLCBwYXlsb2FkLmNvdW50KVxuICB9LFxuXG4gIC8qKlxuICAgKiBBcHBsaWVzIHRoZSBsYXN0IHllYXIgb2Ygam9icyAodGhlIHllYXIgZ3JpZCksIGFwYXJ0IGZyb20gdGhlIGxpc3QuXG4gICAqL1xuICBzZXRZZWFySm9icyAoc3RhdGUsIHBheWxvYWQ6IHsgam9icz86IEhpc3RvcnlJdGVtW10sIGNvdW50PzogbnVtYmVyIH0pIHtcbiAgICBpZiAoIXBheWxvYWQgfHwgIUFycmF5LmlzQXJyYXkocGF5bG9hZC5qb2JzKSkge1xuICAgICAgLy8gQSByZXBseSB3aXRoIG5vIGxpc3QgaXMgYSBmYWlsZWQgb25lLlxuICAgICAgVnVlLnNldChzdGF0ZSwgJ3llYXJTdGF0dXMnLCAnZXJyb3InKVxuICAgICAgcmV0dXJuXG4gICAgfVxuICAgIFZ1ZS5zZXQoc3RhdGUsICd5ZWFySm9icycsIHBheWxvYWQuam9icylcbiAgICBWdWUuc2V0KHN0YXRlLCAneWVhckNvdW50JywgTnVtYmVyKHBheWxvYWQuY291bnQpIHx8IHBheWxvYWQuam9icy5sZW5ndGgpXG4gICAgVnVlLnNldChzdGF0ZSwgJ3llYXJEYXknLCBkYXlLZXkobmV3IERhdGUoKSkpXG4gICAgVnVlLnNldChzdGF0ZSwgJ3llYXJTdGF0dXMnLCAncmVhZHknKVxuICB9LFxuXG4gIC8qKlxuICAgKiBXaGVyZSB0aGUgeWVhcidzIHJlcXVlc3QgaXMuXG4gICAqL1xuICBzZXRZZWFyU3RhdHVzIChzdGF0ZSwgc3RhdHVzOiAnaWRsZScgfCAnbG9hZGluZycgfCAncmVhZHknIHwgJ2Vycm9yJykge1xuICAgIFZ1ZS5zZXQoc3RhdGUsICd5ZWFyU3RhdHVzJywgc3RhdHVzKVxuICB9LFxuXG4gIC8qKlxuICAgKiBBZGRzIGEgaGlzdG9yeSBpdGVtLlxuICAgKi9cbiAgc2V0QWRkSGlzdG9yeSAoc3RhdGUsIHBheWxvYWQ6IEhpc3RvcnlJdGVtKSB7XG4gICAgaWYgKHBheWxvYWQpIHtcbiAgICAgIHN0YXRlLmpvYnMucHVzaChwYXlsb2FkKVxuICAgICAgc3RhdGUuY291bnQrK1xuICAgIH1cbiAgfSxcblxuICAvKipcbiAgICogVXBkYXRlcyBhIGhpc3RvcnkgaXRlbS5cbiAgICovXG4gIHNldFVwZGF0ZUhpc3RvcnkgKHN0YXRlLCBwYXlsb2FkOiBIaXN0b3J5SXRlbSkge1xuICAgIGlmIChwYXlsb2FkKSB7XG4gICAgICBjb25zdCBpID0gc3RhdGUuam9icy5maW5kSW5kZXgoam9iID0+IGpvYi5qb2JfaWQgPT09IHBheWxvYWQuam9iX2lkKVxuICAgICAgaWYgKGkgPj0gMCkge1xuICAgICAgICBWdWUuc2V0KHN0YXRlLmpvYnMsIGksIHBheWxvYWQpXG4gICAgICB9XG4gICAgfVxuICB9LFxuXG4gIHNldENsZWFySGlzdG9yeVRodW1ibmFpbHMgKHN0YXRlLCBwYXlsb2FkOiBzdHJpbmcpIHtcbiAgICBpZiAocGF5bG9hZCkge1xuICAgICAgY29uc3QgaSA9IHN0YXRlLmpvYnMuZmluZEluZGV4KGpvYiA9PiBqb2Iuam9iX2lkID09PSBwYXlsb2FkKVxuICAgICAgaWYgKGkgPj0gMCkge1xuICAgICAgICBjb25zdCBqb2IgPSBzdGF0ZS5qb2JzW2ldXG4gICAgICAgIFZ1ZS5zZXQoc3RhdGUuam9icywgaSwge1xuICAgICAgICAgIC4uLmpvYixcbiAgICAgICAgICBtZXRhZGF0YToge1xuICAgICAgICAgICAgLi4uam9iLm1ldGFkYXRhLFxuICAgICAgICAgICAgdGh1bWJuYWlsczogW11cbiAgICAgICAgICB9XG4gICAgICAgIH0pXG4gICAgICB9XG4gICAgfVxuICB9LFxuXG4gIHNldERlbGV0ZUpvYiAoc3RhdGUsIHBheWxvYWQ6IHN0cmluZ1tdKSB7XG4gICAgaWYgKHBheWxvYWQpIHtcbiAgICAgIHBheWxvYWQuZm9yRWFjaCgoam9iX2lkKSA9PiB7XG4gICAgICAgIGNvbnN0IGkgPSBzdGF0ZS5qb2JzLmZpbmRJbmRleChqb2IgPT4gam9iLmpvYl9pZCA9PT0gam9iX2lkKVxuICAgICAgICBpZiAoaSA+PSAwKSBzdGF0ZS5qb2JzLnNwbGljZShpLCAxKVxuICAgICAgfSlcbiAgICB9XG4gIH1cbn1cbiJdLCJtYXBwaW5ncyI6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