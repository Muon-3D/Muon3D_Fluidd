export const defaultState = () => {
  return {
    notifications: []
    // status:
    // printer.mcu.last_stats
    // printer.system_stats
    // notifications:
    // notify_cpu_throttled (to detect a throttle condition like under volt etc)
    // actions:
    // machine.proc.stats
    // cpu overtemp
    // mcu overtemp
    // mcu awake time graphing
    // If it was me, I'd probably just start with displaying everything on a single graph with 100% being one core usage.  So, just graph sysload outright (sysload * 100), cputime change ((cputime - last_cputime) * 100), mcu_awake (formula above), mcu load (formula above).
  };
};
export const state = defaultState();

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbInN0YXRlLnRzIl0sInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB0eXBlIHsgTm90aWZpY2F0aW9uc1N0YXRlIH0gZnJvbSAnLi90eXBlcydcblxuZXhwb3J0IGNvbnN0IGRlZmF1bHRTdGF0ZSA9ICgpOiBOb3RpZmljYXRpb25zU3RhdGUgPT4ge1xuICByZXR1cm4ge1xuICAgIG5vdGlmaWNhdGlvbnM6IFtdXG5cbiAgICAvLyBzdGF0dXM6XG4gICAgLy8gcHJpbnRlci5tY3UubGFzdF9zdGF0c1xuICAgIC8vIHByaW50ZXIuc3lzdGVtX3N0YXRzXG5cbiAgICAvLyBub3RpZmljYXRpb25zOlxuICAgIC8vIG5vdGlmeV9jcHVfdGhyb3R0bGVkICh0byBkZXRlY3QgYSB0aHJvdHRsZSBjb25kaXRpb24gbGlrZSB1bmRlciB2b2x0IGV0YylcblxuICAgIC8vIGFjdGlvbnM6XG4gICAgLy8gbWFjaGluZS5wcm9jLnN0YXRzXG5cbiAgICAvLyBjcHUgb3ZlcnRlbXBcbiAgICAvLyBtY3Ugb3ZlcnRlbXBcblxuICAgIC8vIG1jdSBhd2FrZSB0aW1lIGdyYXBoaW5nXG5cbiAgICAvLyBJZiBpdCB3YXMgbWUsIEknZCBwcm9iYWJseSBqdXN0IHN0YXJ0IHdpdGggZGlzcGxheWluZyBldmVyeXRoaW5nIG9uIGEgc2luZ2xlIGdyYXBoIHdpdGggMTAwJSBiZWluZyBvbmUgY29yZSB1c2FnZS4gIFNvLCBqdXN0IGdyYXBoIHN5c2xvYWQgb3V0cmlnaHQgKHN5c2xvYWQgKiAxMDApLCBjcHV0aW1lIGNoYW5nZSAoKGNwdXRpbWUgLSBsYXN0X2NwdXRpbWUpICogMTAwKSwgbWN1X2F3YWtlIChmb3JtdWxhIGFib3ZlKSwgbWN1IGxvYWQgKGZvcm11bGEgYWJvdmUpLlxuXG4gIH1cbn1cblxuZXhwb3J0IGNvbnN0IHN0YXRlID0gZGVmYXVsdFN0YXRlKClcbiJdLCJtYXBwaW5ncyI6IkFBRU8sYUFBTSxlQUFlLE1BQTBCO0FBQ3BELFNBQU87QUFBQSxJQUNMLGVBQWUsQ0FBQztBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQSxFQW1CbEI7QUFDRjtBQUVPLGFBQU0sUUFBUSxhQUFhOyIsIm5hbWVzIjpbXX0=