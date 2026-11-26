import Vue from "/.vite-e2e/4291/deps/vue.js?v=9b9fafc7";
import { SORT_KEYS } from "/src/services/jobs/list.ts";
const SORT_KEY = "muon3d.jobs.sort.v3";
const REVERSE_KEY = "muon3d.jobs.reverse.v3";
function readSort() {
  try {
    const saved = localStorage.getItem(SORT_KEY);
    if (SORT_KEYS.includes(saved)) return saved;
  } catch {
  }
  return "newest";
}
function readReverse() {
  try {
    return localStorage.getItem(REVERSE_KEY) === "1";
  } catch {
    return false;
  }
}
export const jobsPage = Vue.observable({
  query: "",
  sort: readSort(),
  /** Turned round: the other way from the order's usual one. */
  reverse: readReverse(),
  /** The phone's search field, which the header's search button opens. */
  searchOpen: false,
  /** Bumped by the header's Upload; the page opens its file picker. */
  uploadTick: 0,
  /** Bumped by the header's menu; the page opens its New folder dialog. */
  folderTick: 0,
  /** What the page has selected, for the header's toolbar: the toolbar's selection actions show only while it's not 0. */
  selected: 0,
  /** Of those, what can be moved or deleted (not the file printing, nor a folder holding it). */
  changeable: 0,
  /** Of those, the files (what Download takes). */
  downloadable: 0,
  /** Of those, the files that can go in the queue (0 when the printer has no queue or isn't busy). */
  queueable: 0,
  /** Set when the selection holds the file printing: the toolbar says why it stays. */
  heldNote: "",
  /** Bumped by the toolbar's selection actions; the page does them. */
  moveTick: 0,
  downloadTick: 0,
  deleteTick: 0,
  queueTick: 0,
  clearTick: 0,
  /** For the header's second line. */
  files: 0,
  free: "",
  printerName: ""
});
export function setJobsSort(sort, reverse = false) {
  jobsPage.sort = sort;
  jobsPage.reverse = reverse;
  try {
    localStorage.setItem(SORT_KEY, sort);
    localStorage.setItem(REVERSE_KEY, reverse ? "1" : "0");
  } catch {
  }
}
export function resetJobsPage() {
  jobsPage.query = "";
  jobsPage.searchOpen = false;
  jobsPage.selected = 0;
  jobsPage.changeable = 0;
  jobsPage.downloadable = 0;
  jobsPage.queueable = 0;
  jobsPage.heldNote = "";
}

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbInBhZ2Utc3RhdGUudHMiXSwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IFZ1ZSBmcm9tICd2dWUnXG5pbXBvcnQgeyBTT1JUX0tFWVMsIHR5cGUgSm9ic1NvcnQgfSBmcm9tICcuL2xpc3QnXG5cbmNvbnN0IFNPUlRfS0VZID0gJ211b24zZC5qb2JzLnNvcnQudjMnXG5cbmNvbnN0IFJFVkVSU0VfS0VZID0gJ211b24zZC5qb2JzLnJldmVyc2UudjMnXG5cbmZ1bmN0aW9uIHJlYWRTb3J0ICgpOiBKb2JzU29ydCB7XG4gIHRyeSB7XG4gICAgY29uc3Qgc2F2ZWQgPSBsb2NhbFN0b3JhZ2UuZ2V0SXRlbShTT1JUX0tFWSlcbiAgICBpZiAoU09SVF9LRVlTLmluY2x1ZGVzKHNhdmVkIGFzIEpvYnNTb3J0KSkgcmV0dXJuIHNhdmVkIGFzIEpvYnNTb3J0XG4gIH0gY2F0Y2gge1xuICAgIC8vIFRoZSBkZWZhdWx0IGJlbG93LlxuICB9XG4gIHJldHVybiAnbmV3ZXN0J1xufVxuXG5mdW5jdGlvbiByZWFkUmV2ZXJzZSAoKTogYm9vbGVhbiB7XG4gIHRyeSB7XG4gICAgcmV0dXJuIGxvY2FsU3RvcmFnZS5nZXRJdGVtKFJFVkVSU0VfS0VZKSA9PT0gJzEnXG4gIH0gY2F0Y2gge1xuICAgIHJldHVybiBmYWxzZVxuICB9XG59XG5cbi8qKlxuICogV2hhdCB0aGUgSm9icyBoZWFkZXIgYW5kIHRoZSBKb2JzIHBhZ2Ugc2hhcmU6IHRoZSBoZWFkZXIgaG9sZHMgdGhlIHNlYXJjaCxcbiAqIHRoZSBvcmRlciBhbmQgVXBsb2FkLCBhbmQgdGhlIHBhZ2UgaG9sZHMgdGhlIGxpc3QgdGhleSBhY3Qgb24uXG4gKi9cbmV4cG9ydCBjb25zdCBqb2JzUGFnZSA9IFZ1ZS5vYnNlcnZhYmxlKHtcbiAgcXVlcnk6ICcnLFxuICBzb3J0OiByZWFkU29ydCgpIGFzIEpvYnNTb3J0LFxuICAvKiogVHVybmVkIHJvdW5kOiB0aGUgb3RoZXIgd2F5IGZyb20gdGhlIG9yZGVyJ3MgdXN1YWwgb25lLiAqL1xuICByZXZlcnNlOiByZWFkUmV2ZXJzZSgpLFxuICAvKiogVGhlIHBob25lJ3Mgc2VhcmNoIGZpZWxkLCB3aGljaCB0aGUgaGVhZGVyJ3Mgc2VhcmNoIGJ1dHRvbiBvcGVucy4gKi9cbiAgc2VhcmNoT3BlbjogZmFsc2UsXG4gIC8qKiBCdW1wZWQgYnkgdGhlIGhlYWRlcidzIFVwbG9hZDsgdGhlIHBhZ2Ugb3BlbnMgaXRzIGZpbGUgcGlja2VyLiAqL1xuICB1cGxvYWRUaWNrOiAwLFxuICAvKiogQnVtcGVkIGJ5IHRoZSBoZWFkZXIncyBtZW51OyB0aGUgcGFnZSBvcGVucyBpdHMgTmV3IGZvbGRlciBkaWFsb2cuICovXG4gIGZvbGRlclRpY2s6IDAsXG4gIC8qKiBXaGF0IHRoZSBwYWdlIGhhcyBzZWxlY3RlZCwgZm9yIHRoZSBoZWFkZXIncyB0b29sYmFyOiB0aGUgdG9vbGJhcidzIHNlbGVjdGlvbiBhY3Rpb25zIHNob3cgb25seSB3aGlsZSBpdCdzIG5vdCAwLiAqL1xuICBzZWxlY3RlZDogMCxcbiAgLyoqIE9mIHRob3NlLCB3aGF0IGNhbiBiZSBtb3ZlZCBvciBkZWxldGVkIChub3QgdGhlIGZpbGUgcHJpbnRpbmcsIG5vciBhIGZvbGRlciBob2xkaW5nIGl0KS4gKi9cbiAgY2hhbmdlYWJsZTogMCxcbiAgLyoqIE9mIHRob3NlLCB0aGUgZmlsZXMgKHdoYXQgRG93bmxvYWQgdGFrZXMpLiAqL1xuICBkb3dubG9hZGFibGU6IDAsXG4gIC8qKiBPZiB0aG9zZSwgdGhlIGZpbGVzIHRoYXQgY2FuIGdvIGluIHRoZSBxdWV1ZSAoMCB3aGVuIHRoZSBwcmludGVyIGhhcyBubyBxdWV1ZSBvciBpc24ndCBidXN5KS4gKi9cbiAgcXVldWVhYmxlOiAwLFxuICAvKiogU2V0IHdoZW4gdGhlIHNlbGVjdGlvbiBob2xkcyB0aGUgZmlsZSBwcmludGluZzogdGhlIHRvb2xiYXIgc2F5cyB3aHkgaXQgc3RheXMuICovXG4gIGhlbGROb3RlOiAnJyxcbiAgLyoqIEJ1bXBlZCBieSB0aGUgdG9vbGJhcidzIHNlbGVjdGlvbiBhY3Rpb25zOyB0aGUgcGFnZSBkb2VzIHRoZW0uICovXG4gIG1vdmVUaWNrOiAwLFxuICBkb3dubG9hZFRpY2s6IDAsXG4gIGRlbGV0ZVRpY2s6IDAsXG4gIHF1ZXVlVGljazogMCxcbiAgY2xlYXJUaWNrOiAwLFxuICAvKiogRm9yIHRoZSBoZWFkZXIncyBzZWNvbmQgbGluZS4gKi9cbiAgZmlsZXM6IDAsXG4gIGZyZWU6ICcnLFxuICBwcmludGVyTmFtZTogJydcbn0pXG5cbmV4cG9ydCBmdW5jdGlvbiBzZXRKb2JzU29ydCAoc29ydDogSm9ic1NvcnQsIHJldmVyc2UgPSBmYWxzZSkge1xuICBqb2JzUGFnZS5zb3J0ID0gc29ydFxuICBqb2JzUGFnZS5yZXZlcnNlID0gcmV2ZXJzZVxuICB0cnkge1xuICAgIGxvY2FsU3RvcmFnZS5zZXRJdGVtKFNPUlRfS0VZLCBzb3J0KVxuICAgIGxvY2FsU3RvcmFnZS5zZXRJdGVtKFJFVkVSU0VfS0VZLCByZXZlcnNlID8gJzEnIDogJzAnKVxuICB9IGNhdGNoIHtcbiAgICAvLyBUaGUgb3JkZXIgaG9sZHMgZm9yIHRoaXMgdmlzaXQuXG4gIH1cbn1cblxuZXhwb3J0IGZ1bmN0aW9uIHJlc2V0Sm9ic1BhZ2UgKCkge1xuICBqb2JzUGFnZS5xdWVyeSA9ICcnXG4gIGpvYnNQYWdlLnNlYXJjaE9wZW4gPSBmYWxzZVxuICBqb2JzUGFnZS5zZWxlY3RlZCA9IDBcbiAgam9ic1BhZ2UuY2hhbmdlYWJsZSA9IDBcbiAgam9ic1BhZ2UuZG93bmxvYWRhYmxlID0gMFxuICBqb2JzUGFnZS5xdWV1ZWFibGUgPSAwXG4gIGpvYnNQYWdlLmhlbGROb3RlID0gJydcbn1cbiJdLCJtYXBwaW5ncyI6IkFBQUEsT0FBTyxTQUFTO0FBQ2hCLFNBQVMsaUJBQWdDO0FBRXpDLE1BQU0sV0FBVztBQUVqQixNQUFNLGNBQWM7QUFFcEIsU0FBUyxXQUFzQjtBQUM3QixNQUFJO0FBQ0YsVUFBTSxRQUFRLGFBQWEsUUFBUSxRQUFRO0FBQzNDLFFBQUksVUFBVSxTQUFTLEtBQWlCLEVBQUcsUUFBTztBQUFBLEVBQ3BELFFBQVE7QUFBQSxFQUVSO0FBQ0EsU0FBTztBQUNUO0FBRUEsU0FBUyxjQUF3QjtBQUMvQixNQUFJO0FBQ0YsV0FBTyxhQUFhLFFBQVEsV0FBVyxNQUFNO0FBQUEsRUFDL0MsUUFBUTtBQUNOLFdBQU87QUFBQSxFQUNUO0FBQ0Y7QUFNTyxhQUFNLFdBQVcsSUFBSSxXQUFXO0FBQUEsRUFDckMsT0FBTztBQUFBLEVBQ1AsTUFBTSxTQUFTO0FBQUE7QUFBQSxFQUVmLFNBQVMsWUFBWTtBQUFBO0FBQUEsRUFFckIsWUFBWTtBQUFBO0FBQUEsRUFFWixZQUFZO0FBQUE7QUFBQSxFQUVaLFlBQVk7QUFBQTtBQUFBLEVBRVosVUFBVTtBQUFBO0FBQUEsRUFFVixZQUFZO0FBQUE7QUFBQSxFQUVaLGNBQWM7QUFBQTtBQUFBLEVBRWQsV0FBVztBQUFBO0FBQUEsRUFFWCxVQUFVO0FBQUE7QUFBQSxFQUVWLFVBQVU7QUFBQSxFQUNWLGNBQWM7QUFBQSxFQUNkLFlBQVk7QUFBQSxFQUNaLFdBQVc7QUFBQSxFQUNYLFdBQVc7QUFBQTtBQUFBLEVBRVgsT0FBTztBQUFBLEVBQ1AsTUFBTTtBQUFBLEVBQ04sYUFBYTtBQUNmLENBQUM7QUFFTSxnQkFBUyxZQUFhLE1BQWdCLFVBQVUsT0FBTztBQUM1RCxXQUFTLE9BQU87QUFDaEIsV0FBUyxVQUFVO0FBQ25CLE1BQUk7QUFDRixpQkFBYSxRQUFRLFVBQVUsSUFBSTtBQUNuQyxpQkFBYSxRQUFRLGFBQWEsVUFBVSxNQUFNLEdBQUc7QUFBQSxFQUN2RCxRQUFRO0FBQUEsRUFFUjtBQUNGO0FBRU8sZ0JBQVMsZ0JBQWlCO0FBQy9CLFdBQVMsUUFBUTtBQUNqQixXQUFTLGFBQWE7QUFDdEIsV0FBUyxXQUFXO0FBQ3BCLFdBQVMsYUFBYTtBQUN0QixXQUFTLGVBQWU7QUFDeEIsV0FBUyxZQUFZO0FBQ3JCLFdBQVMsV0FBVztBQUN0QjsiLCJuYW1lcyI6W119