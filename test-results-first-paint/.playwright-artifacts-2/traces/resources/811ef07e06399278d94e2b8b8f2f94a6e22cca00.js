export function refreshServiceWorker(container = typeof navigator !== "undefined" && "serviceWorker" in navigator ? navigator.serviceWorker : null, timeoutMs = 5e3) {
  if (!container) return Promise.resolve();
  return new Promise((resolve) => {
    let finished = false;
    let unlisten = () => {
    };
    const finish = () => {
      if (finished) return;
      finished = true;
      clearTimeout(timer);
      unlisten();
      resolve();
    };
    const timer = setTimeout(finish, timeoutMs);
    (async () => {
      const registration = await container.getRegistration();
      if (finished) return;
      if (!registration) return finish();
      await registration.update();
      if (finished) return;
      const worker = registration.waiting ?? registration.installing;
      if (!worker) return finish();
      let requested = false;
      const changed = () => {
        if (worker.state === "activated" || worker.state === "redundant") return finish();
        if (worker.state === "installed" && !requested) {
          requested = true;
          worker.postMessage({ type: "SKIP_WAITING" });
        }
      };
      worker.addEventListener("statechange", changed);
      unlisten = () => worker.removeEventListener("statechange", changed);
      changed();
    })().catch(finish);
  });
}
export function applyUpdateWhenIdle(busy, apply, pollMs = 500) {
  if (!busy()) {
    apply();
    return { immediate: true, cancel: () => {
    } };
  }
  const timer = setInterval(() => {
    if (busy()) return;
    clearInterval(timer);
    apply();
  }, pollMs);
  return { immediate: false, cancel: () => clearInterval(timer) };
}

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbInNlcnZpY2Utd29ya2VyLXVwZGF0ZS50cyJdLCJzb3VyY2VzQ29udGVudCI6WyIvKiogUmVmcmVzaCB0aGUgd29ya2VyIGJlZm9yZSByZWNvdmVyaW5nIGEgc3RhbGUgY2h1bms7IG5ldmVyIGhvbGQgbmF2aWdhdGlvbiBmb3JldmVyLiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHJlZnJlc2hTZXJ2aWNlV29ya2VyIChcbiAgY29udGFpbmVyOiBQaWNrPFNlcnZpY2VXb3JrZXJDb250YWluZXIsICdnZXRSZWdpc3RyYXRpb24nPiB8IG51bGwgPSB0eXBlb2YgbmF2aWdhdG9yICE9PSAndW5kZWZpbmVkJyAmJiAnc2VydmljZVdvcmtlcicgaW4gbmF2aWdhdG9yID8gbmF2aWdhdG9yLnNlcnZpY2VXb3JrZXIgOiBudWxsLFxuICB0aW1lb3V0TXMgPSA1MDAwXG4pOiBQcm9taXNlPHZvaWQ+IHtcbiAgaWYgKCFjb250YWluZXIpIHJldHVybiBQcm9taXNlLnJlc29sdmUoKVxuICByZXR1cm4gbmV3IFByb21pc2UocmVzb2x2ZSA9PiB7XG4gICAgbGV0IGZpbmlzaGVkID0gZmFsc2VcbiAgICBsZXQgdW5saXN0ZW4gPSAoKSA9PiB7fVxuICAgIGNvbnN0IGZpbmlzaCA9ICgpID0+IHtcbiAgICAgIGlmIChmaW5pc2hlZCkgcmV0dXJuXG4gICAgICBmaW5pc2hlZCA9IHRydWVcbiAgICAgIGNsZWFyVGltZW91dCh0aW1lcilcbiAgICAgIHVubGlzdGVuKClcbiAgICAgIHJlc29sdmUoKVxuICAgIH1cbiAgICBjb25zdCB0aW1lciA9IHNldFRpbWVvdXQoZmluaXNoLCB0aW1lb3V0TXMpXG4gICAgOyhhc3luYyAoKSA9PiB7XG4gICAgICBjb25zdCByZWdpc3RyYXRpb24gPSBhd2FpdCBjb250YWluZXIuZ2V0UmVnaXN0cmF0aW9uKClcbiAgICAgIGlmIChmaW5pc2hlZCkgcmV0dXJuXG4gICAgICBpZiAoIXJlZ2lzdHJhdGlvbikgcmV0dXJuIGZpbmlzaCgpXG4gICAgICBhd2FpdCByZWdpc3RyYXRpb24udXBkYXRlKClcbiAgICAgIGlmIChmaW5pc2hlZCkgcmV0dXJuXG4gICAgICBjb25zdCB3b3JrZXIgPSByZWdpc3RyYXRpb24ud2FpdGluZyA/PyByZWdpc3RyYXRpb24uaW5zdGFsbGluZ1xuICAgICAgaWYgKCF3b3JrZXIpIHJldHVybiBmaW5pc2goKVxuICAgICAgbGV0IHJlcXVlc3RlZCA9IGZhbHNlXG4gICAgICBjb25zdCBjaGFuZ2VkID0gKCkgPT4ge1xuICAgICAgICBpZiAod29ya2VyLnN0YXRlID09PSAnYWN0aXZhdGVkJyB8fCB3b3JrZXIuc3RhdGUgPT09ICdyZWR1bmRhbnQnKSByZXR1cm4gZmluaXNoKClcbiAgICAgICAgaWYgKHdvcmtlci5zdGF0ZSA9PT0gJ2luc3RhbGxlZCcgJiYgIXJlcXVlc3RlZCkge1xuICAgICAgICAgIHJlcXVlc3RlZCA9IHRydWVcbiAgICAgICAgICB3b3JrZXIucG9zdE1lc3NhZ2UoeyB0eXBlOiAnU0tJUF9XQUlUSU5HJyB9KVxuICAgICAgICB9XG4gICAgICB9XG4gICAgICB3b3JrZXIuYWRkRXZlbnRMaXN0ZW5lcignc3RhdGVjaGFuZ2UnLCBjaGFuZ2VkKVxuICAgICAgdW5saXN0ZW4gPSAoKSA9PiB3b3JrZXIucmVtb3ZlRXZlbnRMaXN0ZW5lcignc3RhdGVjaGFuZ2UnLCBjaGFuZ2VkKVxuICAgICAgY2hhbmdlZCgpXG4gICAgfSkoKS5jYXRjaChmaW5pc2gpXG4gIH0pXG59XG5cbi8qKlxuICogQXBwbGllcyBhIHdhaXRpbmcgc2VydmljZSB3b3JrZXIgd2l0aG91dCB3YWl0aW5nIGZvciBhIGNsaWNrIG9uIHRoZSB0b2FzdFxuICogKEtBTi0xMjc5OiBhIHRhYiBrZXB0IHRoZSBvbGQgYnVuZGxlIGZvciBhIHdlZWsgYmVjYXVzZSBub2JvZHkgcHJlc3NlZFxuICogUmVsb2FkKS4gSXQgcnVucyBgYXBwbHlgIG5vdyB3aGVuIG5vdGhpbmcgaXMgaW4gZmxpZ2h0LCBlbHNlIGFzIHNvb24gYXNcbiAqIGBidXN5YCB0dXJucyBmYWxzZS4gUmV0dXJucyB3aGV0aGVyIGl0IHJhbiBhdCBvbmNlOyBgY2FuY2VsYCBzdG9wcyBhIHdhaXQuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBhcHBseVVwZGF0ZVdoZW5JZGxlIChcbiAgYnVzeTogKCkgPT4gYm9vbGVhbixcbiAgYXBwbHk6ICgpID0+IHZvaWQsXG4gIHBvbGxNcyA9IDUwMFxuKTogeyBpbW1lZGlhdGU6IGJvb2xlYW4sIGNhbmNlbDogKCkgPT4gdm9pZCB9IHtcbiAgaWYgKCFidXN5KCkpIHtcbiAgICBhcHBseSgpXG4gICAgcmV0dXJuIHsgaW1tZWRpYXRlOiB0cnVlLCBjYW5jZWw6ICgpID0+IHt9IH1cbiAgfVxuICBjb25zdCB0aW1lciA9IHNldEludGVydmFsKCgpID0+IHtcbiAgICBpZiAoYnVzeSgpKSByZXR1cm5cbiAgICBjbGVhckludGVydmFsKHRpbWVyKVxuICAgIGFwcGx5KClcbiAgfSwgcG9sbE1zKVxuICByZXR1cm4geyBpbW1lZGlhdGU6IGZhbHNlLCBjYW5jZWw6ICgpID0+IGNsZWFySW50ZXJ2YWwodGltZXIpIH1cbn1cbiJdLCJtYXBwaW5ncyI6IkFBQ08sZ0JBQVMscUJBQ2QsWUFBb0UsT0FBTyxjQUFjLGVBQWUsbUJBQW1CLFlBQVksVUFBVSxnQkFBZ0IsTUFDakssWUFBWSxLQUNHO0FBQ2YsTUFBSSxDQUFDLFVBQVcsUUFBTyxRQUFRLFFBQVE7QUFDdkMsU0FBTyxJQUFJLFFBQVEsYUFBVztBQUM1QixRQUFJLFdBQVc7QUFDZixRQUFJLFdBQVcsTUFBTTtBQUFBLElBQUM7QUFDdEIsVUFBTSxTQUFTLE1BQU07QUFDbkIsVUFBSSxTQUFVO0FBQ2QsaUJBQVc7QUFDWCxtQkFBYSxLQUFLO0FBQ2xCLGVBQVM7QUFDVCxjQUFRO0FBQUEsSUFDVjtBQUNBLFVBQU0sUUFBUSxXQUFXLFFBQVEsU0FBUztBQUN6QyxLQUFDLFlBQVk7QUFDWixZQUFNLGVBQWUsTUFBTSxVQUFVLGdCQUFnQjtBQUNyRCxVQUFJLFNBQVU7QUFDZCxVQUFJLENBQUMsYUFBYyxRQUFPLE9BQU87QUFDakMsWUFBTSxhQUFhLE9BQU87QUFDMUIsVUFBSSxTQUFVO0FBQ2QsWUFBTSxTQUFTLGFBQWEsV0FBVyxhQUFhO0FBQ3BELFVBQUksQ0FBQyxPQUFRLFFBQU8sT0FBTztBQUMzQixVQUFJLFlBQVk7QUFDaEIsWUFBTSxVQUFVLE1BQU07QUFDcEIsWUFBSSxPQUFPLFVBQVUsZUFBZSxPQUFPLFVBQVUsWUFBYSxRQUFPLE9BQU87QUFDaEYsWUFBSSxPQUFPLFVBQVUsZUFBZSxDQUFDLFdBQVc7QUFDOUMsc0JBQVk7QUFDWixpQkFBTyxZQUFZLEVBQUUsTUFBTSxlQUFlLENBQUM7QUFBQSxRQUM3QztBQUFBLE1BQ0Y7QUFDQSxhQUFPLGlCQUFpQixlQUFlLE9BQU87QUFDOUMsaUJBQVcsTUFBTSxPQUFPLG9CQUFvQixlQUFlLE9BQU87QUFDbEUsY0FBUTtBQUFBLElBQ1YsR0FBRyxFQUFFLE1BQU0sTUFBTTtBQUFBLEVBQ25CLENBQUM7QUFDSDtBQVFPLGdCQUFTLG9CQUNkLE1BQ0EsT0FDQSxTQUFTLEtBQ21DO0FBQzVDLE1BQUksQ0FBQyxLQUFLLEdBQUc7QUFDWCxVQUFNO0FBQ04sV0FBTyxFQUFFLFdBQVcsTUFBTSxRQUFRLE1BQU07QUFBQSxJQUFDLEVBQUU7QUFBQSxFQUM3QztBQUNBLFFBQU0sUUFBUSxZQUFZLE1BQU07QUFDOUIsUUFBSSxLQUFLLEVBQUc7QUFDWixrQkFBYyxLQUFLO0FBQ25CLFVBQU07QUFBQSxFQUNSLEdBQUcsTUFBTTtBQUNULFNBQU8sRUFBRSxXQUFXLE9BQU8sUUFBUSxNQUFNLGNBQWMsS0FBSyxFQUFFO0FBQ2hFOyIsIm5hbWVzIjpbXX0=