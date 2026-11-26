import { cloudApi } from "/src/services/muon-cloud/api.ts";
import { cloudState } from "/src/services/muon-cloud/state.ts";
import { lookNearby, nearbyState } from "/src/services/muon-ble/nearby.ts";
import { bluetoothWhy } from "/src/services/muon-ble/unavailable.ts";
import { probeSecureApi } from "/src/services/muon-cloud/connect-in-place.ts";
import { runScan } from "/src/services/scan/scan.ts";
import { newScanState } from "/src/services/scan/text.ts";
import { scanState } from "/src/services/scan/state.ts";
export * from "/src/services/scan/scan.ts";
export { scanState };
export function liveScanDeps() {
  const canBluetooth = nearbyState.support === "supported";
  return {
    accountPrinters: async () => {
      if (!cloudState.account) return [];
      const { printers } = await cloudApi.printers();
      return printers;
    },
    nearby: async () => {
      const { printers } = await cloudApi.nearby();
      return printers.map((p) => ({
        printerId: p.printer_id,
        name: p.name,
        model: p.model,
        linked: !!p.linked,
        localAddrs: p.local_addrs ?? [],
        secureName: p.secure_name ?? null
      }));
    },
    // The same question an Open then asks: does Moonraker answer this page over the secure name.
    reach: async (name) => await probeSecureApi(name) === "reached",
    bluetooth: canBluetooth ? () => lookNearby() : null,
    bluetoothUnavailable: bluetoothWhy()?.text ?? null,
    pageHost: location.hostname
  };
}
let scanning = false;
export async function scanForPrinters() {
  if (scanning) return null;
  scanning = true;
  try {
    await runScan(liveScanDeps(), scanState);
    return scanState.heard;
  } finally {
    scanning = false;
  }
}
export function dismissScan() {
  Object.assign(scanState, newScanState());
}

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImluZGV4LnRzIl0sInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogVGhlIHBhZ2UncyBzY2FuIChLQU4tNTQwOSk6IHRoZSByZWFsIHNvdXJjZXMgd2lyZWQgaW50byBgcnVuU2NhbmAuXG4gKi9cbmltcG9ydCB7IGNsb3VkQXBpIH0gZnJvbSAnQC9zZXJ2aWNlcy9tdW9uLWNsb3VkL2FwaSdcbmltcG9ydCB7IGNsb3VkU3RhdGUgfSBmcm9tICdAL3NlcnZpY2VzL211b24tY2xvdWQvc3RhdGUnXG5pbXBvcnQgeyBsb29rTmVhcmJ5LCBuZWFyYnlTdGF0ZSwgdHlwZSBOZWFyYnlQcmludGVyIH0gZnJvbSAnQC9zZXJ2aWNlcy9tdW9uLWJsZS9uZWFyYnknXG5pbXBvcnQgeyBibHVldG9vdGhXaHkgfSBmcm9tICdAL3NlcnZpY2VzL211b24tYmxlL3VuYXZhaWxhYmxlJ1xuaW1wb3J0IHsgcHJvYmVTZWN1cmVBcGkgfSBmcm9tICdAL3NlcnZpY2VzL211b24tY2xvdWQvY29ubmVjdC1pbi1wbGFjZSdcbmltcG9ydCB7IHJ1blNjYW4sIHR5cGUgU2NhbkRlcHMgfSBmcm9tICcuL3NjYW4nXG5pbXBvcnQgeyBuZXdTY2FuU3RhdGUgfSBmcm9tICcuL3RleHQnXG5cbmltcG9ydCB7IHNjYW5TdGF0ZSB9IGZyb20gJy4vc3RhdGUnXG5cbmV4cG9ydCAqIGZyb20gJy4vc2NhbidcblxuZXhwb3J0IHsgc2NhblN0YXRlIH1cblxuLyoqIFRoZSByZWFsIHNvdXJjZXMuIFNpZ25lZCBvdXQsIHRoZXJlIGFyZSBubyBhY2NvdW50IHByaW50ZXJzIHRvIGFzayBmb3IuICovXG5leHBvcnQgZnVuY3Rpb24gbGl2ZVNjYW5EZXBzICgpOiBTY2FuRGVwcyB7XG4gIGNvbnN0IGNhbkJsdWV0b290aCA9IG5lYXJieVN0YXRlLnN1cHBvcnQgPT09ICdzdXBwb3J0ZWQnXG4gIHJldHVybiB7XG4gICAgYWNjb3VudFByaW50ZXJzOiBhc3luYyAoKSA9PiB7XG4gICAgICBpZiAoIWNsb3VkU3RhdGUuYWNjb3VudCkgcmV0dXJuIFtdXG4gICAgICBjb25zdCB7IHByaW50ZXJzIH0gPSBhd2FpdCBjbG91ZEFwaS5wcmludGVycygpXG4gICAgICByZXR1cm4gcHJpbnRlcnNcbiAgICB9LFxuICAgIG5lYXJieTogYXN5bmMgKCkgPT4ge1xuICAgICAgY29uc3QgeyBwcmludGVycyB9ID0gYXdhaXQgY2xvdWRBcGkubmVhcmJ5KClcbiAgICAgIHJldHVybiBwcmludGVycy5tYXAocCA9PiAoe1xuICAgICAgICBwcmludGVySWQ6IHAucHJpbnRlcl9pZCxcbiAgICAgICAgbmFtZTogcC5uYW1lLFxuICAgICAgICBtb2RlbDogcC5tb2RlbCxcbiAgICAgICAgbGlua2VkOiAhIXAubGlua2VkLFxuICAgICAgICBsb2NhbEFkZHJzOiBwLmxvY2FsX2FkZHJzID8/IFtdLFxuICAgICAgICBzZWN1cmVOYW1lOiBwLnNlY3VyZV9uYW1lID8/IG51bGxcbiAgICAgIH0pKVxuICAgIH0sXG4gICAgLy8gVGhlIHNhbWUgcXVlc3Rpb24gYW4gT3BlbiB0aGVuIGFza3M6IGRvZXMgTW9vbnJha2VyIGFuc3dlciB0aGlzIHBhZ2Ugb3ZlciB0aGUgc2VjdXJlIG5hbWUuXG4gICAgcmVhY2g6IGFzeW5jIChuYW1lOiBzdHJpbmcpID0+IChhd2FpdCBwcm9iZVNlY3VyZUFwaShuYW1lKSkgPT09ICdyZWFjaGVkJyxcbiAgICBibHVldG9vdGg6IGNhbkJsdWV0b290aCA/ICgpID0+IGxvb2tOZWFyYnkoKSA6IG51bGwsXG4gICAgYmx1ZXRvb3RoVW5hdmFpbGFibGU6IGJsdWV0b290aFdoeSgpPy50ZXh0ID8/IG51bGwsXG4gICAgcGFnZUhvc3Q6IGxvY2F0aW9uLmhvc3RuYW1lXG4gIH1cbn1cblxubGV0IHNjYW5uaW5nID0gZmFsc2VcblxuLyoqXG4gKiBTY2FucyBmcm9tIGEgY2xpY2suIENhbGwgaXQgc3RyYWlnaHQgZnJvbSB0aGUgY2xpY2sgaGFuZGxlcjogQmx1ZXRvb3RoJ3MgY2hvb3NlciBuZWVkcyB0aGF0IGdlc3R1cmUuXG4gKiBSZXR1cm5zIHRoZSBwcmludGVyIHBpY2tlZCBpbiB0aGUgQmx1ZXRvb3RoIGNob29zZXIsIGlmIGFueSwgZm9yIHRoZSBjYWxsZXIgdG8gb3Blbi5cbiAqL1xuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIHNjYW5Gb3JQcmludGVycyAoKTogUHJvbWlzZTxOZWFyYnlQcmludGVyIHwgbnVsbD4ge1xuICBpZiAoc2Nhbm5pbmcpIHJldHVybiBudWxsXG4gIHNjYW5uaW5nID0gdHJ1ZVxuICB0cnkge1xuICAgIGF3YWl0IHJ1blNjYW4obGl2ZVNjYW5EZXBzKCksIHNjYW5TdGF0ZSlcbiAgICByZXR1cm4gc2NhblN0YXRlLmhlYXJkXG4gIH0gZmluYWxseSB7XG4gICAgc2Nhbm5pbmcgPSBmYWxzZVxuICB9XG59XG5cbi8qKiBIaWRlcyB0aGUgcmVzdWx0cy4gKi9cbmV4cG9ydCBmdW5jdGlvbiBkaXNtaXNzU2NhbiAoKSB7XG4gIE9iamVjdC5hc3NpZ24oc2NhblN0YXRlLCBuZXdTY2FuU3RhdGUoKSlcbn1cbiJdLCJtYXBwaW5ncyI6IkFBR0EsU0FBUyxnQkFBZ0I7QUFDekIsU0FBUyxrQkFBa0I7QUFDM0IsU0FBUyxZQUFZLG1CQUF1QztBQUM1RCxTQUFTLG9CQUFvQjtBQUM3QixTQUFTLHNCQUFzQjtBQUMvQixTQUFTLGVBQThCO0FBQ3ZDLFNBQVMsb0JBQW9CO0FBRTdCLFNBQVMsaUJBQWlCO0FBRTFCLGNBQWM7QUFFZCxTQUFTO0FBR0YsZ0JBQVMsZUFBMEI7QUFDeEMsUUFBTSxlQUFlLFlBQVksWUFBWTtBQUM3QyxTQUFPO0FBQUEsSUFDTCxpQkFBaUIsWUFBWTtBQUMzQixVQUFJLENBQUMsV0FBVyxRQUFTLFFBQU8sQ0FBQztBQUNqQyxZQUFNLEVBQUUsU0FBUyxJQUFJLE1BQU0sU0FBUyxTQUFTO0FBQzdDLGFBQU87QUFBQSxJQUNUO0FBQUEsSUFDQSxRQUFRLFlBQVk7QUFDbEIsWUFBTSxFQUFFLFNBQVMsSUFBSSxNQUFNLFNBQVMsT0FBTztBQUMzQyxhQUFPLFNBQVMsSUFBSSxRQUFNO0FBQUEsUUFDeEIsV0FBVyxFQUFFO0FBQUEsUUFDYixNQUFNLEVBQUU7QUFBQSxRQUNSLE9BQU8sRUFBRTtBQUFBLFFBQ1QsUUFBUSxDQUFDLENBQUMsRUFBRTtBQUFBLFFBQ1osWUFBWSxFQUFFLGVBQWUsQ0FBQztBQUFBLFFBQzlCLFlBQVksRUFBRSxlQUFlO0FBQUEsTUFDL0IsRUFBRTtBQUFBLElBQ0o7QUFBQTtBQUFBLElBRUEsT0FBTyxPQUFPLFNBQWtCLE1BQU0sZUFBZSxJQUFJLE1BQU87QUFBQSxJQUNoRSxXQUFXLGVBQWUsTUFBTSxXQUFXLElBQUk7QUFBQSxJQUMvQyxzQkFBc0IsYUFBYSxHQUFHLFFBQVE7QUFBQSxJQUM5QyxVQUFVLFNBQVM7QUFBQSxFQUNyQjtBQUNGO0FBRUEsSUFBSSxXQUFXO0FBTWYsc0JBQXNCLGtCQUFrRDtBQUN0RSxNQUFJLFNBQVUsUUFBTztBQUNyQixhQUFXO0FBQ1gsTUFBSTtBQUNGLFVBQU0sUUFBUSxhQUFhLEdBQUcsU0FBUztBQUN2QyxXQUFPLFVBQVU7QUFBQSxFQUNuQixVQUFFO0FBQ0EsZUFBVztBQUFBLEVBQ2I7QUFDRjtBQUdPLGdCQUFTLGNBQWU7QUFDN0IsU0FBTyxPQUFPLFdBQVcsYUFBYSxDQUFDO0FBQ3pDOyIsIm5hbWVzIjpbXX0=