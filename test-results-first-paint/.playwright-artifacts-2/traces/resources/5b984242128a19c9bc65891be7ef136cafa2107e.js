export const getters = {
  /**
   * Returns all history, sorted by start time.
   */
  getHistory: (state) => {
    return state.jobs && state.jobs.length ? [...state.jobs].sort((a, b) => b.start_time - a.start_time) : [];
  },
  /**
   * The last year of jobs for the year grid; empty until asked for.
   */
  getYearJobs: (state) => state.yearJobs ?? [],
  getYear: (state) => ({ status: state.yearStatus ?? "idle", count: state.yearCount ?? 0 }),
  /**
   * Return a history item given a job id.
   */
  getHistoryById: (state) => (jobId) => {
    return state.jobs.find((job) => job.job_id === jobId);
  },
  /**
   * Return a history item given a filename. Only return
   * items that have a status of completed, and that still
   * exist.
   */
  getHistoryByFilename: (state) => (filename) => {
    return state.jobs.find((job) => {
      return job.filename === filename && job.status === "completed" && job.exists === true;
    });
  },
  /**
   * Returns a list of history entries, sorted by their start dates and
   * optionally limited by a provided number.
   */
  getUniqueHistory: (state, getters2) => (limit = 3) => {
    const jobs = [];
    const history = getters2.getHistory;
    for (const job of history) {
      if (job.exists) {
        const dupe = jobs.some((j) => job.filename === j.filename);
        if (!dupe) {
          jobs.push(job);
        }
        if (jobs.length === limit) break;
      }
    }
    return jobs;
  },
  /**
   * Provide a rollup of data for stat purposes.
   */
  getRollUp: (state) => {
    const totals = state.job_totals;
    return {
      ...totals,
      filament_avg: totals.total_filament_used ? totals.total_filament_used / totals.total_jobs : 0,
      print_avg: totals.total_print_time ? totals.total_print_time / totals.total_jobs : 0,
      total_avg: totals.total_time ? totals.total_time / totals.total_jobs : 0
    };
  }
};

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImdldHRlcnMudHMiXSwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHR5cGUgeyBHZXR0ZXJUcmVlIH0gZnJvbSAndnVleCdcbmltcG9ydCB0eXBlIHsgSGlzdG9yeUl0ZW0sIEhpc3RvcnlTdGF0ZSB9IGZyb20gJy4vdHlwZXMnXG5pbXBvcnQgdHlwZSB7IFJvb3RTdGF0ZSB9IGZyb20gJy4uL3R5cGVzJ1xuXG5leHBvcnQgY29uc3QgZ2V0dGVyczogR2V0dGVyVHJlZTxIaXN0b3J5U3RhdGUsIFJvb3RTdGF0ZT4gPSB7XG4gIC8qKlxuICAgKiBSZXR1cm5zIGFsbCBoaXN0b3J5LCBzb3J0ZWQgYnkgc3RhcnQgdGltZS5cbiAgICovXG4gIGdldEhpc3Rvcnk6IChzdGF0ZSkgPT4ge1xuICAgIHJldHVybiAoc3RhdGUuam9icyAmJiBzdGF0ZS5qb2JzLmxlbmd0aClcbiAgICAgID8gWy4uLnN0YXRlLmpvYnNdLnNvcnQoKGEsIGIpID0+IGIuc3RhcnRfdGltZSAtIGEuc3RhcnRfdGltZSlcbiAgICAgIDogW11cbiAgfSxcblxuICAvKipcbiAgICogVGhlIGxhc3QgeWVhciBvZiBqb2JzIGZvciB0aGUgeWVhciBncmlkOyBlbXB0eSB1bnRpbCBhc2tlZCBmb3IuXG4gICAqL1xuICBnZXRZZWFySm9iczogKHN0YXRlKSA9PiBzdGF0ZS55ZWFySm9icyA/PyBbXSxcbiAgZ2V0WWVhcjogKHN0YXRlKSA9PiAoeyBzdGF0dXM6IHN0YXRlLnllYXJTdGF0dXMgPz8gJ2lkbGUnLCBjb3VudDogc3RhdGUueWVhckNvdW50ID8/IDAgfSksXG5cbiAgLyoqXG4gICAqIFJldHVybiBhIGhpc3RvcnkgaXRlbSBnaXZlbiBhIGpvYiBpZC5cbiAgICovXG4gIGdldEhpc3RvcnlCeUlkOiAoc3RhdGUpID0+IChqb2JJZDogc3RyaW5nKSA9PiB7XG4gICAgcmV0dXJuIHN0YXRlLmpvYnMuZmluZChqb2IgPT4gam9iLmpvYl9pZCA9PT0gam9iSWQpXG4gIH0sXG5cbiAgLyoqXG4gICAqIFJldHVybiBhIGhpc3RvcnkgaXRlbSBnaXZlbiBhIGZpbGVuYW1lLiBPbmx5IHJldHVyblxuICAgKiBpdGVtcyB0aGF0IGhhdmUgYSBzdGF0dXMgb2YgY29tcGxldGVkLCBhbmQgdGhhdCBzdGlsbFxuICAgKiBleGlzdC5cbiAgICovXG4gIGdldEhpc3RvcnlCeUZpbGVuYW1lOiAoc3RhdGUpID0+IChmaWxlbmFtZTogc3RyaW5nKSA9PiB7XG4gICAgcmV0dXJuIHN0YXRlLmpvYnMuZmluZChqb2IgPT4ge1xuICAgICAgcmV0dXJuIChcbiAgICAgICAgam9iLmZpbGVuYW1lID09PSBmaWxlbmFtZSAmJlxuICAgICAgICBqb2Iuc3RhdHVzID09PSAnY29tcGxldGVkJyAmJlxuICAgICAgICBqb2IuZXhpc3RzID09PSB0cnVlXG4gICAgICApXG4gICAgfSlcbiAgfSxcblxuICAvKipcbiAgICogUmV0dXJucyBhIGxpc3Qgb2YgaGlzdG9yeSBlbnRyaWVzLCBzb3J0ZWQgYnkgdGhlaXIgc3RhcnQgZGF0ZXMgYW5kXG4gICAqIG9wdGlvbmFsbHkgbGltaXRlZCBieSBhIHByb3ZpZGVkIG51bWJlci5cbiAgICovXG4gIGdldFVuaXF1ZUhpc3Rvcnk6IChzdGF0ZSwgZ2V0dGVycykgPT4gKGxpbWl0ID0gMykgPT4ge1xuICAgIGNvbnN0IGpvYnM6IEhpc3RvcnlJdGVtW10gPSBbXVxuICAgIGNvbnN0IGhpc3RvcnkgPSBnZXR0ZXJzLmdldEhpc3RvcnlcblxuICAgIC8vIEdvIHRocm91Z2ggZWFjaCBpdGVtIGFuZDtcbiAgICAvLyAtIE9ubHkgc2hvdyBpdGVtcyB0aGF0IHN0aWxsIGV4aXN0XG4gICAgLy8gLSBEb24ndCBhbGxvdyBkdXBlc1xuICAgIC8vIC0gUmVzcGVjdCB0aGUgbGltaXRcbiAgICBmb3IgKGNvbnN0IGpvYiBvZiBoaXN0b3J5KSB7XG4gICAgICBpZiAoXG4gICAgICAgIGpvYi5leGlzdHNcbiAgICAgICkge1xuICAgICAgICBjb25zdCBkdXBlID0gam9icy5zb21lKChqKSA9PiBqb2IuZmlsZW5hbWUgPT09IGouZmlsZW5hbWUpXG4gICAgICAgIGlmICghZHVwZSkge1xuICAgICAgICAgIGpvYnMucHVzaChqb2IpXG4gICAgICAgIH1cbiAgICAgICAgaWYgKGpvYnMubGVuZ3RoID09PSBsaW1pdCkgYnJlYWtcbiAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIGpvYnNcbiAgfSxcblxuICAvKipcbiAgICogUHJvdmlkZSBhIHJvbGx1cCBvZiBkYXRhIGZvciBzdGF0IHB1cnBvc2VzLlxuICAgKi9cbiAgZ2V0Um9sbFVwOiAoc3RhdGUpID0+IHtcbiAgICBjb25zdCB0b3RhbHMgPSBzdGF0ZS5qb2JfdG90YWxzXG4gICAgcmV0dXJuIHtcbiAgICAgIC4uLnRvdGFscyxcbiAgICAgIGZpbGFtZW50X2F2ZzogKHRvdGFscy50b3RhbF9maWxhbWVudF91c2VkKSA/IHRvdGFscy50b3RhbF9maWxhbWVudF91c2VkIC8gdG90YWxzLnRvdGFsX2pvYnMgOiAwLFxuICAgICAgcHJpbnRfYXZnOiAodG90YWxzLnRvdGFsX3ByaW50X3RpbWUpID8gdG90YWxzLnRvdGFsX3ByaW50X3RpbWUgLyB0b3RhbHMudG90YWxfam9icyA6IDAsXG4gICAgICB0b3RhbF9hdmc6ICh0b3RhbHMudG90YWxfdGltZSkgPyB0b3RhbHMudG90YWxfdGltZSAvIHRvdGFscy50b3RhbF9qb2JzIDogMFxuICAgIH1cbiAgfVxufVxuIl0sIm1hcHBpbmdzIjoiQUFJTyxhQUFNLFVBQStDO0FBQUE7QUFBQTtBQUFBO0FBQUEsRUFJMUQsWUFBWSxDQUFDLFVBQVU7QUFDckIsV0FBUSxNQUFNLFFBQVEsTUFBTSxLQUFLLFNBQzdCLENBQUMsR0FBRyxNQUFNLElBQUksRUFBRSxLQUFLLENBQUMsR0FBRyxNQUFNLEVBQUUsYUFBYSxFQUFFLFVBQVUsSUFDMUQsQ0FBQztBQUFBLEVBQ1A7QUFBQTtBQUFBO0FBQUE7QUFBQSxFQUtBLGFBQWEsQ0FBQyxVQUFVLE1BQU0sWUFBWSxDQUFDO0FBQUEsRUFDM0MsU0FBUyxDQUFDLFdBQVcsRUFBRSxRQUFRLE1BQU0sY0FBYyxRQUFRLE9BQU8sTUFBTSxhQUFhLEVBQUU7QUFBQTtBQUFBO0FBQUE7QUFBQSxFQUt2RixnQkFBZ0IsQ0FBQyxVQUFVLENBQUMsVUFBa0I7QUFDNUMsV0FBTyxNQUFNLEtBQUssS0FBSyxTQUFPLElBQUksV0FBVyxLQUFLO0FBQUEsRUFDcEQ7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUEsRUFPQSxzQkFBc0IsQ0FBQyxVQUFVLENBQUMsYUFBcUI7QUFDckQsV0FBTyxNQUFNLEtBQUssS0FBSyxTQUFPO0FBQzVCLGFBQ0UsSUFBSSxhQUFhLFlBQ2pCLElBQUksV0FBVyxlQUNmLElBQUksV0FBVztBQUFBLElBRW5CLENBQUM7QUFBQSxFQUNIO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQSxFQU1BLGtCQUFrQixDQUFDLE9BQU9BLGFBQVksQ0FBQyxRQUFRLE1BQU07QUFDbkQsVUFBTSxPQUFzQixDQUFDO0FBQzdCLFVBQU0sVUFBVUEsU0FBUTtBQU14QixlQUFXLE9BQU8sU0FBUztBQUN6QixVQUNFLElBQUksUUFDSjtBQUNBLGNBQU0sT0FBTyxLQUFLLEtBQUssQ0FBQyxNQUFNLElBQUksYUFBYSxFQUFFLFFBQVE7QUFDekQsWUFBSSxDQUFDLE1BQU07QUFDVCxlQUFLLEtBQUssR0FBRztBQUFBLFFBQ2Y7QUFDQSxZQUFJLEtBQUssV0FBVyxNQUFPO0FBQUEsTUFDN0I7QUFBQSxJQUNGO0FBQ0EsV0FBTztBQUFBLEVBQ1Q7QUFBQTtBQUFBO0FBQUE7QUFBQSxFQUtBLFdBQVcsQ0FBQyxVQUFVO0FBQ3BCLFVBQU0sU0FBUyxNQUFNO0FBQ3JCLFdBQU87QUFBQSxNQUNMLEdBQUc7QUFBQSxNQUNILGNBQWUsT0FBTyxzQkFBdUIsT0FBTyxzQkFBc0IsT0FBTyxhQUFhO0FBQUEsTUFDOUYsV0FBWSxPQUFPLG1CQUFvQixPQUFPLG1CQUFtQixPQUFPLGFBQWE7QUFBQSxNQUNyRixXQUFZLE9BQU8sYUFBYyxPQUFPLGFBQWEsT0FBTyxhQUFhO0FBQUEsSUFDM0U7QUFBQSxFQUNGO0FBQ0Y7IiwibmFtZXMiOlsiZ2V0dGVycyJdfQ==