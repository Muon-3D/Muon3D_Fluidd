const REASONS = {
  stick_removed: "The USB stick was taken out.",
  no_space: "There is not enough space.",
  exists: "A file with that name is already there, so it was skipped.",
  read_error: "The file could not be read.",
  write_error: "The file could not be written. The stick may be write-protected.",
  cancelled: "Cancelled.",
  name_invalid: "The name can't be used on a USB stick.",
  folder_full: "That folder is full.",
  too_large: "The file is too big for this stick (4 GB limit).",
  source_changed: "The file changed while it was being copied.",
  job_running: "A copy is still running."
};
export function reasonWords(code) {
  if (!code) return "";
  return REASONS[code] ?? code;
}
export function itemStateWords(state) {
  switch (state) {
    case "pending":
      return "Waiting";
    case "copying":
      return "Copying";
    case "done":
      return "Copied";
    case "skipped":
      return "Skipped";
    case "failed":
      return "Failed";
    case "cancelled":
      return "Cancelled";
  }
}
export function isRunning(job) {
  return !!job && (job.state === "queued" || job.state === "running");
}
export function jobHeadline(job) {
  const where = job.direction === "to_printer" ? "to the printer" : "to the USB stick";
  const count = `${job.filesTotal} ${job.filesTotal === 1 ? "file" : "files"}`;
  switch (job.state) {
    case "queued":
      return `Getting ready to copy ${count} ${where}`;
    case "running":
      return `Copying ${job.filesDone} of ${count} ${where}`;
    case "done":
      return job.errors.length || job.skipped.length ? `Finished copying ${where}, with some left out` : `Copied ${count} ${where}`;
    case "cancelled":
      return `Cancelled. ${job.filesDone} of ${count} had been copied ${where}`;
    case "failed":
      return `Stopped. ${reasonWords(job.reason) || "The copy failed."}`;
  }
}
export function bytesWords(bytes) {
  if (bytes === null || bytes === void 0 || !Number.isFinite(bytes)) return "";
  if (bytes < 1e3) return `${bytes} B`;
  const units = ["KB", "MB", "GB", "TB"];
  let value = bytes;
  let i = -1;
  while (value >= 1e3 && i < units.length - 1) {
    value /= 1e3;
    i++;
  }
  return `${value >= 100 ? Math.round(value) : Math.round(value * 10) / 10} ${units[i]}`;
}
export function percentOf(done, total) {
  if (!total || total <= 0) return 0;
  return Math.max(0, Math.min(100, Math.round(done / total * 100)));
}

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIndvcmRzLnRzIl0sInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB0eXBlIHsgVXNiSXRlbVN0YXRlLCBVc2JKb2IgfSBmcm9tICcuL3R5cGVzJ1xuXG4vKiogVGhlIHByaW50ZXIncyBlcnJvciBjb2RlcyAoS0FOLTQ4MTQsIEFQSSB2MS4xKSBpbiBwbGFpbiB3b3Jkcy4gKi9cbmNvbnN0IFJFQVNPTlM6IFJlY29yZDxzdHJpbmcsIHN0cmluZz4gPSB7XG4gIHN0aWNrX3JlbW92ZWQ6ICdUaGUgVVNCIHN0aWNrIHdhcyB0YWtlbiBvdXQuJyxcbiAgbm9fc3BhY2U6ICdUaGVyZSBpcyBub3QgZW5vdWdoIHNwYWNlLicsXG4gIGV4aXN0czogJ0EgZmlsZSB3aXRoIHRoYXQgbmFtZSBpcyBhbHJlYWR5IHRoZXJlLCBzbyBpdCB3YXMgc2tpcHBlZC4nLFxuICByZWFkX2Vycm9yOiAnVGhlIGZpbGUgY291bGQgbm90IGJlIHJlYWQuJyxcbiAgd3JpdGVfZXJyb3I6ICdUaGUgZmlsZSBjb3VsZCBub3QgYmUgd3JpdHRlbi4gVGhlIHN0aWNrIG1heSBiZSB3cml0ZS1wcm90ZWN0ZWQuJyxcbiAgY2FuY2VsbGVkOiAnQ2FuY2VsbGVkLicsXG4gIG5hbWVfaW52YWxpZDogJ1RoZSBuYW1lIGNhblxcJ3QgYmUgdXNlZCBvbiBhIFVTQiBzdGljay4nLFxuICBmb2xkZXJfZnVsbDogJ1RoYXQgZm9sZGVyIGlzIGZ1bGwuJyxcbiAgdG9vX2xhcmdlOiAnVGhlIGZpbGUgaXMgdG9vIGJpZyBmb3IgdGhpcyBzdGljayAoNCBHQiBsaW1pdCkuJyxcbiAgc291cmNlX2NoYW5nZWQ6ICdUaGUgZmlsZSBjaGFuZ2VkIHdoaWxlIGl0IHdhcyBiZWluZyBjb3BpZWQuJyxcbiAgam9iX3J1bm5pbmc6ICdBIGNvcHkgaXMgc3RpbGwgcnVubmluZy4nXG59XG5cbi8qKiBBbiBlcnJvciBjb2RlIGFzIGEgc2VudGVuY2U7IGEgY29kZSBDb250cm9sIGRvZXNuJ3Qga25vdyBpcyBzaG93biBhcyB0aGUgcHJpbnRlciB3cm90ZSBpdC4gKi9cbmV4cG9ydCBmdW5jdGlvbiByZWFzb25Xb3JkcyAoY29kZTogc3RyaW5nIHwgdW5kZWZpbmVkIHwgbnVsbCk6IHN0cmluZyB7XG4gIGlmICghY29kZSkgcmV0dXJuICcnXG4gIHJldHVybiBSRUFTT05TW2NvZGVdID8/IGNvZGVcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGl0ZW1TdGF0ZVdvcmRzIChzdGF0ZTogVXNiSXRlbVN0YXRlKTogc3RyaW5nIHtcbiAgc3dpdGNoIChzdGF0ZSkge1xuICAgIGNhc2UgJ3BlbmRpbmcnOiByZXR1cm4gJ1dhaXRpbmcnXG4gICAgY2FzZSAnY29weWluZyc6IHJldHVybiAnQ29weWluZydcbiAgICBjYXNlICdkb25lJzogcmV0dXJuICdDb3BpZWQnXG4gICAgY2FzZSAnc2tpcHBlZCc6IHJldHVybiAnU2tpcHBlZCdcbiAgICBjYXNlICdmYWlsZWQnOiByZXR1cm4gJ0ZhaWxlZCdcbiAgICBjYXNlICdjYW5jZWxsZWQnOiByZXR1cm4gJ0NhbmNlbGxlZCdcbiAgfVxufVxuXG5leHBvcnQgZnVuY3Rpb24gaXNSdW5uaW5nIChqb2I6IFVzYkpvYiB8IG51bGwgfCB1bmRlZmluZWQpOiBib29sZWFuIHtcbiAgcmV0dXJuICEham9iICYmIChqb2Iuc3RhdGUgPT09ICdxdWV1ZWQnIHx8IGpvYi5zdGF0ZSA9PT0gJ3J1bm5pbmcnKVxufVxuXG4vKiogVGhlIHNlbnRlbmNlIG92ZXIgdGhlIHByb2dyZXNzIGJhci4gKi9cbmV4cG9ydCBmdW5jdGlvbiBqb2JIZWFkbGluZSAoam9iOiBVc2JKb2IpOiBzdHJpbmcge1xuICBjb25zdCB3aGVyZSA9IGpvYi5kaXJlY3Rpb24gPT09ICd0b19wcmludGVyJyA/ICd0byB0aGUgcHJpbnRlcicgOiAndG8gdGhlIFVTQiBzdGljaydcbiAgY29uc3QgY291bnQgPSBgJHtqb2IuZmlsZXNUb3RhbH0gJHtqb2IuZmlsZXNUb3RhbCA9PT0gMSA/ICdmaWxlJyA6ICdmaWxlcyd9YFxuICBzd2l0Y2ggKGpvYi5zdGF0ZSkge1xuICAgIGNhc2UgJ3F1ZXVlZCc6IHJldHVybiBgR2V0dGluZyByZWFkeSB0byBjb3B5ICR7Y291bnR9ICR7d2hlcmV9YFxuICAgIGNhc2UgJ3J1bm5pbmcnOiByZXR1cm4gYENvcHlpbmcgJHtqb2IuZmlsZXNEb25lfSBvZiAke2NvdW50fSAke3doZXJlfWBcbiAgICBjYXNlICdkb25lJzogcmV0dXJuIGpvYi5lcnJvcnMubGVuZ3RoIHx8IGpvYi5za2lwcGVkLmxlbmd0aFxuICAgICAgPyBgRmluaXNoZWQgY29weWluZyAke3doZXJlfSwgd2l0aCBzb21lIGxlZnQgb3V0YFxuICAgICAgOiBgQ29waWVkICR7Y291bnR9ICR7d2hlcmV9YFxuICAgIGNhc2UgJ2NhbmNlbGxlZCc6IHJldHVybiBgQ2FuY2VsbGVkLiAke2pvYi5maWxlc0RvbmV9IG9mICR7Y291bnR9IGhhZCBiZWVuIGNvcGllZCAke3doZXJlfWBcbiAgICBjYXNlICdmYWlsZWQnOiByZXR1cm4gYFN0b3BwZWQuICR7cmVhc29uV29yZHMoam9iLnJlYXNvbikgfHwgJ1RoZSBjb3B5IGZhaWxlZC4nfWBcbiAgfVxufVxuXG4vKiogQnl0ZXMgYXMgdGhlIGZpbGVzIGxpc3Qgc2hvd3MgdGhlbS4gKi9cbmV4cG9ydCBmdW5jdGlvbiBieXRlc1dvcmRzIChieXRlczogbnVtYmVyIHwgbnVsbCB8IHVuZGVmaW5lZCk6IHN0cmluZyB7XG4gIGlmIChieXRlcyA9PT0gbnVsbCB8fCBieXRlcyA9PT0gdW5kZWZpbmVkIHx8ICFOdW1iZXIuaXNGaW5pdGUoYnl0ZXMpKSByZXR1cm4gJydcbiAgaWYgKGJ5dGVzIDwgMTAwMCkgcmV0dXJuIGAke2J5dGVzfSBCYFxuICBjb25zdCB1bml0cyA9IFsnS0InLCAnTUInLCAnR0InLCAnVEInXVxuICBsZXQgdmFsdWUgPSBieXRlc1xuICBsZXQgaSA9IC0xXG4gIHdoaWxlICh2YWx1ZSA+PSAxMDAwICYmIGkgPCB1bml0cy5sZW5ndGggLSAxKSB7IHZhbHVlIC89IDEwMDA7IGkrKyB9XG4gIHJldHVybiBgJHt2YWx1ZSA+PSAxMDAgPyBNYXRoLnJvdW5kKHZhbHVlKSA6IE1hdGgucm91bmQodmFsdWUgKiAxMCkgLyAxMH0gJHt1bml0c1tpXX1gXG59XG5cbmV4cG9ydCBmdW5jdGlvbiBwZXJjZW50T2YgKGRvbmU6IG51bWJlciwgdG90YWw6IG51bWJlcik6IG51bWJlciB7XG4gIGlmICghdG90YWwgfHwgdG90YWwgPD0gMCkgcmV0dXJuIDBcbiAgcmV0dXJuIE1hdGgubWF4KDAsIE1hdGgubWluKDEwMCwgTWF0aC5yb3VuZCgoZG9uZSAvIHRvdGFsKSAqIDEwMCkpKVxufVxuIl0sIm1hcHBpbmdzIjoiQUFHQSxNQUFNLFVBQWtDO0FBQUEsRUFDdEMsZUFBZTtBQUFBLEVBQ2YsVUFBVTtBQUFBLEVBQ1YsUUFBUTtBQUFBLEVBQ1IsWUFBWTtBQUFBLEVBQ1osYUFBYTtBQUFBLEVBQ2IsV0FBVztBQUFBLEVBQ1gsY0FBYztBQUFBLEVBQ2QsYUFBYTtBQUFBLEVBQ2IsV0FBVztBQUFBLEVBQ1gsZ0JBQWdCO0FBQUEsRUFDaEIsYUFBYTtBQUNmO0FBR08sZ0JBQVMsWUFBYSxNQUF5QztBQUNwRSxNQUFJLENBQUMsS0FBTSxRQUFPO0FBQ2xCLFNBQU8sUUFBUSxJQUFJLEtBQUs7QUFDMUI7QUFFTyxnQkFBUyxlQUFnQixPQUE2QjtBQUMzRCxVQUFRLE9BQU87QUFBQSxJQUNiLEtBQUs7QUFBVyxhQUFPO0FBQUEsSUFDdkIsS0FBSztBQUFXLGFBQU87QUFBQSxJQUN2QixLQUFLO0FBQVEsYUFBTztBQUFBLElBQ3BCLEtBQUs7QUFBVyxhQUFPO0FBQUEsSUFDdkIsS0FBSztBQUFVLGFBQU87QUFBQSxJQUN0QixLQUFLO0FBQWEsYUFBTztBQUFBLEVBQzNCO0FBQ0Y7QUFFTyxnQkFBUyxVQUFXLEtBQXlDO0FBQ2xFLFNBQU8sQ0FBQyxDQUFDLFFBQVEsSUFBSSxVQUFVLFlBQVksSUFBSSxVQUFVO0FBQzNEO0FBR08sZ0JBQVMsWUFBYSxLQUFxQjtBQUNoRCxRQUFNLFFBQVEsSUFBSSxjQUFjLGVBQWUsbUJBQW1CO0FBQ2xFLFFBQU0sUUFBUSxHQUFHLElBQUksVUFBVSxJQUFJLElBQUksZUFBZSxJQUFJLFNBQVMsT0FBTztBQUMxRSxVQUFRLElBQUksT0FBTztBQUFBLElBQ2pCLEtBQUs7QUFBVSxhQUFPLHlCQUF5QixLQUFLLElBQUksS0FBSztBQUFBLElBQzdELEtBQUs7QUFBVyxhQUFPLFdBQVcsSUFBSSxTQUFTLE9BQU8sS0FBSyxJQUFJLEtBQUs7QUFBQSxJQUNwRSxLQUFLO0FBQVEsYUFBTyxJQUFJLE9BQU8sVUFBVSxJQUFJLFFBQVEsU0FDakQsb0JBQW9CLEtBQUsseUJBQ3pCLFVBQVUsS0FBSyxJQUFJLEtBQUs7QUFBQSxJQUM1QixLQUFLO0FBQWEsYUFBTyxjQUFjLElBQUksU0FBUyxPQUFPLEtBQUssb0JBQW9CLEtBQUs7QUFBQSxJQUN6RixLQUFLO0FBQVUsYUFBTyxZQUFZLFlBQVksSUFBSSxNQUFNLEtBQUssa0JBQWtCO0FBQUEsRUFDakY7QUFDRjtBQUdPLGdCQUFTLFdBQVksT0FBMEM7QUFDcEUsTUFBSSxVQUFVLFFBQVEsVUFBVSxVQUFhLENBQUMsT0FBTyxTQUFTLEtBQUssRUFBRyxRQUFPO0FBQzdFLE1BQUksUUFBUSxJQUFNLFFBQU8sR0FBRyxLQUFLO0FBQ2pDLFFBQU0sUUFBUSxDQUFDLE1BQU0sTUFBTSxNQUFNLElBQUk7QUFDckMsTUFBSSxRQUFRO0FBQ1osTUFBSSxJQUFJO0FBQ1IsU0FBTyxTQUFTLE9BQVEsSUFBSSxNQUFNLFNBQVMsR0FBRztBQUFFLGFBQVM7QUFBTTtBQUFBLEVBQUk7QUFDbkUsU0FBTyxHQUFHLFNBQVMsTUFBTSxLQUFLLE1BQU0sS0FBSyxJQUFJLEtBQUssTUFBTSxRQUFRLEVBQUUsSUFBSSxFQUFFLElBQUksTUFBTSxDQUFDLENBQUM7QUFDdEY7QUFFTyxnQkFBUyxVQUFXLE1BQWMsT0FBdUI7QUFDOUQsTUFBSSxDQUFDLFNBQVMsU0FBUyxFQUFHLFFBQU87QUFDakMsU0FBTyxLQUFLLElBQUksR0FBRyxLQUFLLElBQUksS0FBSyxLQUFLLE1BQU8sT0FBTyxRQUFTLEdBQUcsQ0FBQyxDQUFDO0FBQ3BFOyIsIm5hbWVzIjpbXX0=