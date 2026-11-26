import consola from "/.vite-e2e/4291/deps/consola.js?v=9b9fafc7";
const sleep = (ms, signal) => {
  const debug = (message, ...args) => consola.debug(`[sleep] ${message}`, ...args);
  return new Promise((resolve, reject) => {
    debug(`sleeping for ${ms}...`);
    const dispose = () => {
      signal?.removeEventListener("abort", abortHandler);
      clearTimeout(timeoutId);
    };
    const abortHandler = () => {
      debug("aborted");
      dispose();
      reject(new Error("AbortError"));
    };
    const timeoutHandler = () => {
      debug("timed out");
      dispose();
      resolve(null);
    };
    signal?.addEventListener("abort", abortHandler);
    const timeoutId = setTimeout(timeoutHandler, ms);
  });
};
export default sleep;

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbInNsZWVwLnRzIl0sInNvdXJjZXNDb250ZW50IjpbImltcG9ydCBjb25zb2xhIGZyb20gJ2NvbnNvbGEnXG5cbmNvbnN0IHNsZWVwID0gKG1zOiBudW1iZXIsIHNpZ25hbD86IEFib3J0U2lnbmFsKSA9PiB7XG4gIGNvbnN0IGRlYnVnID0gKG1lc3NhZ2U6IHN0cmluZywgLi4uYXJnczogdW5rbm93bltdKSA9PiBjb25zb2xhLmRlYnVnKGBbc2xlZXBdICR7bWVzc2FnZX1gLCAuLi5hcmdzKVxuXG4gIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XG4gICAgZGVidWcoYHNsZWVwaW5nIGZvciAke21zfS4uLmApXG5cbiAgICBjb25zdCBkaXNwb3NlID0gKCkgPT4ge1xuICAgICAgc2lnbmFsPy5yZW1vdmVFdmVudExpc3RlbmVyKCdhYm9ydCcsIGFib3J0SGFuZGxlcilcblxuICAgICAgY2xlYXJUaW1lb3V0KHRpbWVvdXRJZClcbiAgICB9XG5cbiAgICBjb25zdCBhYm9ydEhhbmRsZXIgPSAoKSA9PiB7XG4gICAgICBkZWJ1ZygnYWJvcnRlZCcpXG5cbiAgICAgIGRpc3Bvc2UoKVxuXG4gICAgICByZWplY3QobmV3IEVycm9yKCdBYm9ydEVycm9yJykpXG4gICAgfVxuXG4gICAgY29uc3QgdGltZW91dEhhbmRsZXIgPSAoKSA9PiB7XG4gICAgICBkZWJ1ZygndGltZWQgb3V0JylcblxuICAgICAgZGlzcG9zZSgpXG5cbiAgICAgIHJlc29sdmUobnVsbClcbiAgICB9XG5cbiAgICBzaWduYWw/LmFkZEV2ZW50TGlzdGVuZXIoJ2Fib3J0JywgYWJvcnRIYW5kbGVyKVxuXG4gICAgY29uc3QgdGltZW91dElkID0gc2V0VGltZW91dCh0aW1lb3V0SGFuZGxlciwgbXMpXG4gIH0pXG59XG5cbmV4cG9ydCBkZWZhdWx0IHNsZWVwXG4iXSwibWFwcGluZ3MiOiJBQUFBLE9BQU8sYUFBYTtBQUVwQixNQUFNLFFBQVEsQ0FBQyxJQUFZLFdBQXlCO0FBQ2xELFFBQU0sUUFBUSxDQUFDLFlBQW9CLFNBQW9CLFFBQVEsTUFBTSxXQUFXLE9BQU8sSUFBSSxHQUFHLElBQUk7QUFFbEcsU0FBTyxJQUFJLFFBQVEsQ0FBQyxTQUFTLFdBQVc7QUFDdEMsVUFBTSxnQkFBZ0IsRUFBRSxLQUFLO0FBRTdCLFVBQU0sVUFBVSxNQUFNO0FBQ3BCLGNBQVEsb0JBQW9CLFNBQVMsWUFBWTtBQUVqRCxtQkFBYSxTQUFTO0FBQUEsSUFDeEI7QUFFQSxVQUFNLGVBQWUsTUFBTTtBQUN6QixZQUFNLFNBQVM7QUFFZixjQUFRO0FBRVIsYUFBTyxJQUFJLE1BQU0sWUFBWSxDQUFDO0FBQUEsSUFDaEM7QUFFQSxVQUFNLGlCQUFpQixNQUFNO0FBQzNCLFlBQU0sV0FBVztBQUVqQixjQUFRO0FBRVIsY0FBUSxJQUFJO0FBQUEsSUFDZDtBQUVBLFlBQVEsaUJBQWlCLFNBQVMsWUFBWTtBQUU5QyxVQUFNLFlBQVksV0FBVyxnQkFBZ0IsRUFBRTtBQUFBLEVBQ2pELENBQUM7QUFDSDtBQUVBLGVBQWU7IiwibmFtZXMiOltdfQ==