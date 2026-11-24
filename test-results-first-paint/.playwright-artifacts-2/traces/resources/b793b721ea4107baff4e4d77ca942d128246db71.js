import { consola } from "/.vite-e2e/4291/deps/consola.js?v=9b9fafc7";
const sanitizeEndpoint = (endpoint) => {
  if (endpoint) {
    try {
      const url = new URL(endpoint);
      const path = url.pathname.endsWith("/") ? url.pathname.slice(0, -1) : url.pathname;
      return `${url.protocol}//${url.host}${path}`;
    } catch (e) {
      consola.debug("Error parsing endpoint url in config.json", e);
    }
  }
};
export default sanitizeEndpoint;

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbInNhbml0aXplLWVuZHBvaW50LnRzIl0sInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IGNvbnNvbGEgfSBmcm9tICdjb25zb2xhJ1xuXG5jb25zdCBzYW5pdGl6ZUVuZHBvaW50ID0gKGVuZHBvaW50Pzogc3RyaW5nKSA9PiB7XG4gIGlmIChlbmRwb2ludCkge1xuICAgIHRyeSB7XG4gICAgICBjb25zdCB1cmwgPSBuZXcgVVJMKGVuZHBvaW50KVxuICAgICAgY29uc3QgcGF0aCA9IHVybC5wYXRobmFtZS5lbmRzV2l0aCgnLycpXG4gICAgICAgID8gdXJsLnBhdGhuYW1lLnNsaWNlKDAsIC0xKVxuICAgICAgICA6IHVybC5wYXRobmFtZVxuICAgICAgcmV0dXJuIGAke3VybC5wcm90b2NvbH0vLyR7dXJsLmhvc3R9JHtwYXRofWBcbiAgICB9IGNhdGNoIChlKSB7XG4gICAgICBjb25zb2xhLmRlYnVnKCdFcnJvciBwYXJzaW5nIGVuZHBvaW50IHVybCBpbiBjb25maWcuanNvbicsIGUpXG4gICAgfVxuICB9XG59XG5cbmV4cG9ydCBkZWZhdWx0IHNhbml0aXplRW5kcG9pbnRcbiJdLCJtYXBwaW5ncyI6IkFBQUEsU0FBUyxlQUFlO0FBRXhCLE1BQU0sbUJBQW1CLENBQUMsYUFBc0I7QUFDOUMsTUFBSSxVQUFVO0FBQ1osUUFBSTtBQUNGLFlBQU0sTUFBTSxJQUFJLElBQUksUUFBUTtBQUM1QixZQUFNLE9BQU8sSUFBSSxTQUFTLFNBQVMsR0FBRyxJQUNsQyxJQUFJLFNBQVMsTUFBTSxHQUFHLEVBQUUsSUFDeEIsSUFBSTtBQUNSLGFBQU8sR0FBRyxJQUFJLFFBQVEsS0FBSyxJQUFJLElBQUksR0FBRyxJQUFJO0FBQUEsSUFDNUMsU0FBUyxHQUFHO0FBQ1YsY0FBUSxNQUFNLDZDQUE2QyxDQUFDO0FBQUEsSUFDOUQ7QUFBQSxFQUNGO0FBQ0Y7QUFFQSxlQUFlOyIsIm5hbWVzIjpbXX0=