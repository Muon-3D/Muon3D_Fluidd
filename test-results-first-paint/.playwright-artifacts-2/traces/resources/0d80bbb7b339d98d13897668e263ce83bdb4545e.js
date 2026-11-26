export async function fetchBuildCommit(fetcher = (input, init) => fetch(input, init)) {
  try {
    const response = await fetcher("/build-info.json", { cache: "no-store" });
    if (!response.ok) return null;
    const info = await response.json();
    return typeof info.commit === "string" && info.commit ? info.commit : null;
  } catch {
    return null;
  }
}
export function watchForNewBuild(options) {
  const {
    running,
    check = () => fetchBuildCommit(),
    onNewer,
    update,
    doc = document,
    win = window,
    intervalMs = 5 * 60 * 1e3
  } = options;
  if (!running) return () => {
  };
  let reported = false;
  let checking = false;
  const run = async () => {
    if (reported || checking) return;
    checking = true;
    try {
      if (update) await Promise.resolve(update()).catch(() => {
      });
      const served = await check();
      if (served && served !== running && !reported) {
        reported = true;
        onNewer(served);
      }
    } finally {
      checking = false;
    }
  };
  const onVisible = () => {
    if (doc.visibilityState === "visible") run().catch(() => {
    });
  };
  const onFocus = () => {
    run().catch(() => {
    });
  };
  win.addEventListener("focus", onFocus);
  doc.addEventListener("visibilitychange", onVisible);
  const timer = setInterval(() => {
    run().catch(() => {
    });
  }, intervalMs);
  return () => {
    win.removeEventListener("focus", onFocus);
    doc.removeEventListener("visibilitychange", onVisible);
    clearInterval(timer);
  };
}

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImJ1aWxkLXVwZGF0ZS50cyJdLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIE5vdGljZXMgdGhhdCB0aGUgc2VydmVyIGhhcyBhIG5ld2VyIGJ1aWxkIHRoYW4gdGhlIG9uZSBydW5uaW5nIChJLTE1OSkuXG4gKiBUaGUgc2VydmljZSB3b3JrZXIgYWxvbmUgY2Fubm90IGJlIHRydXN0ZWQgdG8gc2F5IHNvOiBhIHRhYiBjYW4gc2l0IG9uIGFuIG9sZFxuICogYnVuZGxlIGZvciBkYXlzLiBidWlsZC1pbmZvLmpzb24gKHdyaXR0ZW4gYnkgZXZlcnkgYnVpbGQpIG5hbWVzIHRoZSBjb21taXQuXG4gKi9cblxudHlwZSBGZXRjaGVyID0gKGlucHV0OiBzdHJpbmcsIGluaXQ/OiBSZXF1ZXN0SW5pdCkgPT4gUHJvbWlzZTxSZXNwb25zZT5cblxuLyoqIFRoZSBjb21taXQgdGhlIHNlcnZlciBpcyBzZXJ2aW5nIG5vdywgb3IgbnVsbCB3aGVuIGl0IGNhbm5vdCBiZSByZWFkLiAqL1xuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIGZldGNoQnVpbGRDb21taXQgKGZldGNoZXI6IEZldGNoZXIgPSAoaW5wdXQsIGluaXQpID0+IGZldGNoKGlucHV0LCBpbml0KSk6IFByb21pc2U8c3RyaW5nIHwgbnVsbD4ge1xuICB0cnkge1xuICAgIGNvbnN0IHJlc3BvbnNlID0gYXdhaXQgZmV0Y2hlcignL2J1aWxkLWluZm8uanNvbicsIHsgY2FjaGU6ICduby1zdG9yZScgfSlcbiAgICBpZiAoIXJlc3BvbnNlLm9rKSByZXR1cm4gbnVsbFxuICAgIGNvbnN0IGluZm8gPSBhd2FpdCByZXNwb25zZS5qc29uKCkgYXMgeyBjb21taXQ/OiB1bmtub3duIH1cbiAgICByZXR1cm4gdHlwZW9mIGluZm8uY29tbWl0ID09PSAnc3RyaW5nJyAmJiBpbmZvLmNvbW1pdCA/IGluZm8uY29tbWl0IDogbnVsbFxuICB9IGNhdGNoIHtcbiAgICByZXR1cm4gbnVsbFxuICB9XG59XG5cbmV4cG9ydCBpbnRlcmZhY2UgV2F0Y2hPcHRpb25zIHtcbiAgLyoqIFRoZSBjb21taXQgdGhpcyBwYWdlIHdhcyBidWlsdCBmcm9tOyAnJyAoYSBkZXYgYnVpbGQpIGRpc2FibGVzIHRoZSB3YXRjaC4gKi9cbiAgcnVubmluZzogc3RyaW5nXG4gIGNoZWNrPzogKCkgPT4gUHJvbWlzZTxzdHJpbmcgfCBudWxsPlxuICAvKiogQ2FsbGVkIG9uY2Ugd2hlbiB0aGUgc2VydmVyIHNlcnZlcyBhIGRpZmZlcmVudCBjb21taXQuICovXG4gIG9uTmV3ZXI6IChjb21taXQ6IHN0cmluZykgPT4gdm9pZFxuICAvKiogQXNrcyB0aGUgc2VydmljZSB3b3JrZXIgdG8gbG9vayBmb3IgaXRzIG93biB1cGRhdGUgKHJlZ2lzdHJhdGlvbi51cGRhdGUoKSkuICovXG4gIHVwZGF0ZT86ICgpID0+IFByb21pc2U8dW5rbm93bj5cbiAgZG9jPzogRG9jdW1lbnRcbiAgd2luPzogV2luZG93XG4gIGludGVydmFsTXM/OiBudW1iZXJcbn1cblxuLyoqIENoZWNrcyBvbiBmb2N1cywgd2hlbiB0aGUgdGFiIGlzIHNob3duLCBhbmQgZXZlcnkgZmV3IG1pbnV0ZXMuIFJldHVybnMgYSBzdG9wIGZ1bmN0aW9uLiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHdhdGNoRm9yTmV3QnVpbGQgKG9wdGlvbnM6IFdhdGNoT3B0aW9ucyk6ICgpID0+IHZvaWQge1xuICBjb25zdCB7XG4gICAgcnVubmluZyxcbiAgICBjaGVjayA9ICgpID0+IGZldGNoQnVpbGRDb21taXQoKSxcbiAgICBvbk5ld2VyLFxuICAgIHVwZGF0ZSxcbiAgICBkb2MgPSBkb2N1bWVudCxcbiAgICB3aW4gPSB3aW5kb3csXG4gICAgaW50ZXJ2YWxNcyA9IDUgKiA2MCAqIDEwMDBcbiAgfSA9IG9wdGlvbnNcbiAgaWYgKCFydW5uaW5nKSByZXR1cm4gKCkgPT4ge31cblxuICBsZXQgcmVwb3J0ZWQgPSBmYWxzZVxuICBsZXQgY2hlY2tpbmcgPSBmYWxzZVxuICBjb25zdCBydW4gPSBhc3luYyAoKSA9PiB7XG4gICAgaWYgKHJlcG9ydGVkIHx8IGNoZWNraW5nKSByZXR1cm5cbiAgICBjaGVja2luZyA9IHRydWVcbiAgICB0cnkge1xuICAgICAgaWYgKHVwZGF0ZSkgYXdhaXQgUHJvbWlzZS5yZXNvbHZlKHVwZGF0ZSgpKS5jYXRjaCgoKSA9PiB7fSlcbiAgICAgIGNvbnN0IHNlcnZlZCA9IGF3YWl0IGNoZWNrKClcbiAgICAgIGlmIChzZXJ2ZWQgJiYgc2VydmVkICE9PSBydW5uaW5nICYmICFyZXBvcnRlZCkge1xuICAgICAgICByZXBvcnRlZCA9IHRydWVcbiAgICAgICAgb25OZXdlcihzZXJ2ZWQpXG4gICAgICB9XG4gICAgfSBmaW5hbGx5IHtcbiAgICAgIGNoZWNraW5nID0gZmFsc2VcbiAgICB9XG4gIH1cbiAgY29uc3Qgb25WaXNpYmxlID0gKCkgPT4geyBpZiAoZG9jLnZpc2liaWxpdHlTdGF0ZSA9PT0gJ3Zpc2libGUnKSBydW4oKS5jYXRjaCgoKSA9PiB7fSkgfVxuICBjb25zdCBvbkZvY3VzID0gKCkgPT4geyBydW4oKS5jYXRjaCgoKSA9PiB7fSkgfVxuXG4gIHdpbi5hZGRFdmVudExpc3RlbmVyKCdmb2N1cycsIG9uRm9jdXMpXG4gIGRvYy5hZGRFdmVudExpc3RlbmVyKCd2aXNpYmlsaXR5Y2hhbmdlJywgb25WaXNpYmxlKVxuICBjb25zdCB0aW1lciA9IHNldEludGVydmFsKCgpID0+IHsgcnVuKCkuY2F0Y2goKCkgPT4ge30pIH0sIGludGVydmFsTXMpXG4gIHJldHVybiAoKSA9PiB7XG4gICAgd2luLnJlbW92ZUV2ZW50TGlzdGVuZXIoJ2ZvY3VzJywgb25Gb2N1cylcbiAgICBkb2MucmVtb3ZlRXZlbnRMaXN0ZW5lcigndmlzaWJpbGl0eWNoYW5nZScsIG9uVmlzaWJsZSlcbiAgICBjbGVhckludGVydmFsKHRpbWVyKVxuICB9XG59XG4iXSwibWFwcGluZ3MiOiJBQVNBLHNCQUFzQixpQkFBa0IsVUFBbUIsQ0FBQyxPQUFPLFNBQVMsTUFBTSxPQUFPLElBQUksR0FBMkI7QUFDdEgsTUFBSTtBQUNGLFVBQU0sV0FBVyxNQUFNLFFBQVEsb0JBQW9CLEVBQUUsT0FBTyxXQUFXLENBQUM7QUFDeEUsUUFBSSxDQUFDLFNBQVMsR0FBSSxRQUFPO0FBQ3pCLFVBQU0sT0FBTyxNQUFNLFNBQVMsS0FBSztBQUNqQyxXQUFPLE9BQU8sS0FBSyxXQUFXLFlBQVksS0FBSyxTQUFTLEtBQUssU0FBUztBQUFBLEVBQ3hFLFFBQVE7QUFDTixXQUFPO0FBQUEsRUFDVDtBQUNGO0FBZ0JPLGdCQUFTLGlCQUFrQixTQUFtQztBQUNuRSxRQUFNO0FBQUEsSUFDSjtBQUFBLElBQ0EsUUFBUSxNQUFNLGlCQUFpQjtBQUFBLElBQy9CO0FBQUEsSUFDQTtBQUFBLElBQ0EsTUFBTTtBQUFBLElBQ04sTUFBTTtBQUFBLElBQ04sYUFBYSxJQUFJLEtBQUs7QUFBQSxFQUN4QixJQUFJO0FBQ0osTUFBSSxDQUFDLFFBQVMsUUFBTyxNQUFNO0FBQUEsRUFBQztBQUU1QixNQUFJLFdBQVc7QUFDZixNQUFJLFdBQVc7QUFDZixRQUFNLE1BQU0sWUFBWTtBQUN0QixRQUFJLFlBQVksU0FBVTtBQUMxQixlQUFXO0FBQ1gsUUFBSTtBQUNGLFVBQUksT0FBUSxPQUFNLFFBQVEsUUFBUSxPQUFPLENBQUMsRUFBRSxNQUFNLE1BQU07QUFBQSxNQUFDLENBQUM7QUFDMUQsWUFBTSxTQUFTLE1BQU0sTUFBTTtBQUMzQixVQUFJLFVBQVUsV0FBVyxXQUFXLENBQUMsVUFBVTtBQUM3QyxtQkFBVztBQUNYLGdCQUFRLE1BQU07QUFBQSxNQUNoQjtBQUFBLElBQ0YsVUFBRTtBQUNBLGlCQUFXO0FBQUEsSUFDYjtBQUFBLEVBQ0Y7QUFDQSxRQUFNLFlBQVksTUFBTTtBQUFFLFFBQUksSUFBSSxvQkFBb0IsVUFBVyxLQUFJLEVBQUUsTUFBTSxNQUFNO0FBQUEsSUFBQyxDQUFDO0FBQUEsRUFBRTtBQUN2RixRQUFNLFVBQVUsTUFBTTtBQUFFLFFBQUksRUFBRSxNQUFNLE1BQU07QUFBQSxJQUFDLENBQUM7QUFBQSxFQUFFO0FBRTlDLE1BQUksaUJBQWlCLFNBQVMsT0FBTztBQUNyQyxNQUFJLGlCQUFpQixvQkFBb0IsU0FBUztBQUNsRCxRQUFNLFFBQVEsWUFBWSxNQUFNO0FBQUUsUUFBSSxFQUFFLE1BQU0sTUFBTTtBQUFBLElBQUMsQ0FBQztBQUFBLEVBQUUsR0FBRyxVQUFVO0FBQ3JFLFNBQU8sTUFBTTtBQUNYLFFBQUksb0JBQW9CLFNBQVMsT0FBTztBQUN4QyxRQUFJLG9CQUFvQixvQkFBb0IsU0FBUztBQUNyRCxrQkFBYyxLQUFLO0FBQUEsRUFDckI7QUFDRjsiLCJuYW1lcyI6W119