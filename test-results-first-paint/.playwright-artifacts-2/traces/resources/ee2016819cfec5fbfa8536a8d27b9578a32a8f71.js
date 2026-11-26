import { consola } from "/.vite-e2e/4291/deps/consola.js?v=9b9fafc7";
const webSocketWrapper = (url, signal) => {
  const debug = (message, ...args) => consola.debug(`[webSocketWrapper] ${url} ${message}`, ...args);
  return new Promise((resolve, reject) => {
    debug("opening...");
    const dispose = () => {
      signal?.removeEventListener("abort", abortHandler);
      connection.close();
    };
    const abortHandler = () => {
      debug("aborted");
      dispose();
      reject(new Error("AbortError"));
    };
    signal?.addEventListener("abort", abortHandler);
    const connection = new WebSocket(url);
    connection.onopen = (event) => {
      debug("opened", event);
      dispose();
      resolve(null);
    };
    connection.onerror = (event) => {
      debug("error", event);
      dispose();
      reject(event);
    };
    connection.onclose = (event) => {
      debug("closed", event);
    };
  });
};
export default webSocketWrapper;

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIndlYi1zb2NrZXQtd3JhcHBlci50cyJdLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBjb25zb2xhIH0gZnJvbSAnY29uc29sYSdcblxuY29uc3Qgd2ViU29ja2V0V3JhcHBlciA9ICh1cmw6IHN0cmluZywgc2lnbmFsPzogQWJvcnRTaWduYWwpID0+IHtcbiAgY29uc3QgZGVidWcgPSAobWVzc2FnZTogc3RyaW5nLCAuLi5hcmdzOiB1bmtub3duW10pID0+IGNvbnNvbGEuZGVidWcoYFt3ZWJTb2NrZXRXcmFwcGVyXSAke3VybH0gJHttZXNzYWdlfWAsIC4uLmFyZ3MpXG5cbiAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcbiAgICBkZWJ1Zygnb3BlbmluZy4uLicpXG5cbiAgICBjb25zdCBkaXNwb3NlID0gKCkgPT4ge1xuICAgICAgc2lnbmFsPy5yZW1vdmVFdmVudExpc3RlbmVyKCdhYm9ydCcsIGFib3J0SGFuZGxlcilcblxuICAgICAgY29ubmVjdGlvbi5jbG9zZSgpXG4gICAgfVxuXG4gICAgY29uc3QgYWJvcnRIYW5kbGVyID0gKCkgPT4ge1xuICAgICAgZGVidWcoJ2Fib3J0ZWQnKVxuXG4gICAgICBkaXNwb3NlKClcblxuICAgICAgcmVqZWN0KG5ldyBFcnJvcignQWJvcnRFcnJvcicpKVxuICAgIH1cblxuICAgIHNpZ25hbD8uYWRkRXZlbnRMaXN0ZW5lcignYWJvcnQnLCBhYm9ydEhhbmRsZXIpXG5cbiAgICBjb25zdCBjb25uZWN0aW9uID0gbmV3IFdlYlNvY2tldCh1cmwpXG5cbiAgICBjb25uZWN0aW9uLm9ub3BlbiA9IChldmVudCkgPT4ge1xuICAgICAgZGVidWcoJ29wZW5lZCcsIGV2ZW50KVxuXG4gICAgICBkaXNwb3NlKClcblxuICAgICAgcmVzb2x2ZShudWxsKVxuICAgIH1cblxuICAgIGNvbm5lY3Rpb24ub25lcnJvciA9IChldmVudCkgPT4ge1xuICAgICAgZGVidWcoJ2Vycm9yJywgZXZlbnQpXG5cbiAgICAgIGRpc3Bvc2UoKVxuXG4gICAgICByZWplY3QoZXZlbnQpXG4gICAgfVxuXG4gICAgY29ubmVjdGlvbi5vbmNsb3NlID0gKGV2ZW50KSA9PiB7XG4gICAgICBkZWJ1ZygnY2xvc2VkJywgZXZlbnQpXG4gICAgfVxuICB9KVxufVxuXG5leHBvcnQgZGVmYXVsdCB3ZWJTb2NrZXRXcmFwcGVyXG4iXSwibWFwcGluZ3MiOiJBQUFBLFNBQVMsZUFBZTtBQUV4QixNQUFNLG1CQUFtQixDQUFDLEtBQWEsV0FBeUI7QUFDOUQsUUFBTSxRQUFRLENBQUMsWUFBb0IsU0FBb0IsUUFBUSxNQUFNLHNCQUFzQixHQUFHLElBQUksT0FBTyxJQUFJLEdBQUcsSUFBSTtBQUVwSCxTQUFPLElBQUksUUFBUSxDQUFDLFNBQVMsV0FBVztBQUN0QyxVQUFNLFlBQVk7QUFFbEIsVUFBTSxVQUFVLE1BQU07QUFDcEIsY0FBUSxvQkFBb0IsU0FBUyxZQUFZO0FBRWpELGlCQUFXLE1BQU07QUFBQSxJQUNuQjtBQUVBLFVBQU0sZUFBZSxNQUFNO0FBQ3pCLFlBQU0sU0FBUztBQUVmLGNBQVE7QUFFUixhQUFPLElBQUksTUFBTSxZQUFZLENBQUM7QUFBQSxJQUNoQztBQUVBLFlBQVEsaUJBQWlCLFNBQVMsWUFBWTtBQUU5QyxVQUFNLGFBQWEsSUFBSSxVQUFVLEdBQUc7QUFFcEMsZUFBVyxTQUFTLENBQUMsVUFBVTtBQUM3QixZQUFNLFVBQVUsS0FBSztBQUVyQixjQUFRO0FBRVIsY0FBUSxJQUFJO0FBQUEsSUFDZDtBQUVBLGVBQVcsVUFBVSxDQUFDLFVBQVU7QUFDOUIsWUFBTSxTQUFTLEtBQUs7QUFFcEIsY0FBUTtBQUVSLGFBQU8sS0FBSztBQUFBLElBQ2Q7QUFFQSxlQUFXLFVBQVUsQ0FBQyxVQUFVO0FBQzlCLFlBQU0sVUFBVSxLQUFLO0FBQUEsSUFDdkI7QUFBQSxFQUNGLENBQUM7QUFDSDtBQUVBLGVBQWU7IiwibmFtZXMiOltdfQ==