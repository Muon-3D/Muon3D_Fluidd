export function localHost(address) {
  const value = address.trim().replace(/^http:\/\//i, "").replace(/\/$/, "");
  if (!value || /[\s/@?#\\]/.test(value)) throw new Error("Use a local IP address or a .local name, with an optional port.");
  let url;
  try {
    url = new URL(`http://${value}`);
  } catch {
    throw new Error("That is not a printer address.");
  }
  const host = url.hostname.toLowerCase();
  const parts = host.split(".").map(Number);
  const ipv4 = parts.length === 4 && parts.every((n) => Number.isInteger(n) && n >= 0 && n <= 255);
  const privateIpv4 = ipv4 && (parts[0] === 10 || parts[0] === 127 || parts[0] === 192 && parts[1] === 168 || parts[0] === 172 && parts[1] >= 16 && parts[1] <= 31 || parts[0] === 169 && parts[1] === 254);
  const privateIpv6 = host === "[::1]" || /^\[(?:f[cd][0-9a-f]{2}:|fe[89ab][0-9a-f]:)/i.test(host);
  const mdns = /^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?(?:\.[a-z0-9](?:[a-z0-9-]*[a-z0-9])?)*\.local$/.test(host);
  if (!privateIpv4 && !privateIpv6 && !mdns && host !== "localhost") throw new Error("This printer must be on your local network. Use its local IP address or .local name.");
  return url.host;
}
export function localCameraUrl(value, host) {
  if (typeof value !== "string" || !value.trim()) return null;
  try {
    const url = new URL(value, `http://${host}`);
    if (!["http:", "https:", "rtsp:"].includes(url.protocol) || url.username || url.password) return null;
    localHost(url.host);
    return url.href;
  } catch {
    return null;
  }
}

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImFkZHJlc3MudHMiXSwic291cmNlc0NvbnRlbnQiOlsiLyoqIERpcmVjdCBwcmludGVycyB1c2UgZXhwbGljaXQgbG9jYWwgSVBzIG9yIG1ETlMgbmFtZXMsIGluY2x1ZGluZyBvbiBIVFRQUyBwYWdlcy4gKi9cbmV4cG9ydCBmdW5jdGlvbiBsb2NhbEhvc3QgKGFkZHJlc3M6IHN0cmluZyk6IHN0cmluZyB7XG4gIGNvbnN0IHZhbHVlID0gYWRkcmVzcy50cmltKCkucmVwbGFjZSgvXmh0dHA6XFwvXFwvL2ksICcnKS5yZXBsYWNlKC9cXC8kLywgJycpXG4gIGlmICghdmFsdWUgfHwgL1tcXHMvQD8jXFxcXF0vLnRlc3QodmFsdWUpKSB0aHJvdyBuZXcgRXJyb3IoJ1VzZSBhIGxvY2FsIElQIGFkZHJlc3Mgb3IgYSAubG9jYWwgbmFtZSwgd2l0aCBhbiBvcHRpb25hbCBwb3J0LicpXG4gIGxldCB1cmw6IFVSTFxuICB0cnkgeyB1cmwgPSBuZXcgVVJMKGBodHRwOi8vJHt2YWx1ZX1gKSB9IGNhdGNoIHsgdGhyb3cgbmV3IEVycm9yKCdUaGF0IGlzIG5vdCBhIHByaW50ZXIgYWRkcmVzcy4nKSB9XG4gIGNvbnN0IGhvc3QgPSB1cmwuaG9zdG5hbWUudG9Mb3dlckNhc2UoKVxuICBjb25zdCBwYXJ0cyA9IGhvc3Quc3BsaXQoJy4nKS5tYXAoTnVtYmVyKVxuICBjb25zdCBpcHY0ID0gcGFydHMubGVuZ3RoID09PSA0ICYmIHBhcnRzLmV2ZXJ5KG4gPT4gTnVtYmVyLmlzSW50ZWdlcihuKSAmJiBuID49IDAgJiYgbiA8PSAyNTUpXG4gIGNvbnN0IHByaXZhdGVJcHY0ID0gaXB2NCAmJiAocGFydHNbMF0gPT09IDEwIHx8IHBhcnRzWzBdID09PSAxMjcgfHxcbiAgICAocGFydHNbMF0gPT09IDE5MiAmJiBwYXJ0c1sxXSA9PT0gMTY4KSB8fCAocGFydHNbMF0gPT09IDE3MiAmJiBwYXJ0c1sxXSA+PSAxNiAmJiBwYXJ0c1sxXSA8PSAzMSkgfHxcbiAgICAocGFydHNbMF0gPT09IDE2OSAmJiBwYXJ0c1sxXSA9PT0gMjU0KSlcbiAgY29uc3QgcHJpdmF0ZUlwdjYgPSBob3N0ID09PSAnWzo6MV0nIHx8IC9eXFxbKD86ZltjZF1bMC05YS1mXXsyfTp8ZmVbODlhYl1bMC05YS1mXTopL2kudGVzdChob3N0KVxuICBjb25zdCBtZG5zID0gL15bYS16MC05XSg/OlthLXowLTktXSpbYS16MC05XSk/KD86XFwuW2EtejAtOV0oPzpbYS16MC05LV0qW2EtejAtOV0pPykqXFwubG9jYWwkLy50ZXN0KGhvc3QpXG4gIGlmICghcHJpdmF0ZUlwdjQgJiYgIXByaXZhdGVJcHY2ICYmICFtZG5zICYmIGhvc3QgIT09ICdsb2NhbGhvc3QnKSB0aHJvdyBuZXcgRXJyb3IoJ1RoaXMgcHJpbnRlciBtdXN0IGJlIG9uIHlvdXIgbG9jYWwgbmV0d29yay4gVXNlIGl0cyBsb2NhbCBJUCBhZGRyZXNzIG9yIC5sb2NhbCBuYW1lLicpXG4gIHJldHVybiB1cmwuaG9zdFxufVxuXG5leHBvcnQgZnVuY3Rpb24gbG9jYWxDYW1lcmFVcmwgKHZhbHVlOiB1bmtub3duLCBob3N0OiBzdHJpbmcpOiBzdHJpbmcgfCBudWxsIHtcbiAgaWYgKHR5cGVvZiB2YWx1ZSAhPT0gJ3N0cmluZycgfHwgIXZhbHVlLnRyaW0oKSkgcmV0dXJuIG51bGxcbiAgdHJ5IHtcbiAgICBjb25zdCB1cmwgPSBuZXcgVVJMKHZhbHVlLCBgaHR0cDovLyR7aG9zdH1gKVxuICAgIGlmICghWydodHRwOicsICdodHRwczonLCAncnRzcDonXS5pbmNsdWRlcyh1cmwucHJvdG9jb2wpIHx8IHVybC51c2VybmFtZSB8fCB1cmwucGFzc3dvcmQpIHJldHVybiBudWxsXG4gICAgbG9jYWxIb3N0KHVybC5ob3N0KVxuICAgIHJldHVybiB1cmwuaHJlZlxuICB9IGNhdGNoIHsgcmV0dXJuIG51bGwgfVxufVxuIl0sIm1hcHBpbmdzIjoiQUFDTyxnQkFBUyxVQUFXLFNBQXlCO0FBQ2xELFFBQU0sUUFBUSxRQUFRLEtBQUssRUFBRSxRQUFRLGVBQWUsRUFBRSxFQUFFLFFBQVEsT0FBTyxFQUFFO0FBQ3pFLE1BQUksQ0FBQyxTQUFTLGFBQWEsS0FBSyxLQUFLLEVBQUcsT0FBTSxJQUFJLE1BQU0saUVBQWlFO0FBQ3pILE1BQUk7QUFDSixNQUFJO0FBQUUsVUFBTSxJQUFJLElBQUksVUFBVSxLQUFLLEVBQUU7QUFBQSxFQUFFLFFBQVE7QUFBRSxVQUFNLElBQUksTUFBTSxnQ0FBZ0M7QUFBQSxFQUFFO0FBQ25HLFFBQU0sT0FBTyxJQUFJLFNBQVMsWUFBWTtBQUN0QyxRQUFNLFFBQVEsS0FBSyxNQUFNLEdBQUcsRUFBRSxJQUFJLE1BQU07QUFDeEMsUUFBTSxPQUFPLE1BQU0sV0FBVyxLQUFLLE1BQU0sTUFBTSxPQUFLLE9BQU8sVUFBVSxDQUFDLEtBQUssS0FBSyxLQUFLLEtBQUssR0FBRztBQUM3RixRQUFNLGNBQWMsU0FBUyxNQUFNLENBQUMsTUFBTSxNQUFNLE1BQU0sQ0FBQyxNQUFNLE9BQzFELE1BQU0sQ0FBQyxNQUFNLE9BQU8sTUFBTSxDQUFDLE1BQU0sT0FBUyxNQUFNLENBQUMsTUFBTSxPQUFPLE1BQU0sQ0FBQyxLQUFLLE1BQU0sTUFBTSxDQUFDLEtBQUssTUFDNUYsTUFBTSxDQUFDLE1BQU0sT0FBTyxNQUFNLENBQUMsTUFBTTtBQUNwQyxRQUFNLGNBQWMsU0FBUyxXQUFXLDhDQUE4QyxLQUFLLElBQUk7QUFDL0YsUUFBTSxPQUFPLGlGQUFpRixLQUFLLElBQUk7QUFDdkcsTUFBSSxDQUFDLGVBQWUsQ0FBQyxlQUFlLENBQUMsUUFBUSxTQUFTLFlBQWEsT0FBTSxJQUFJLE1BQU0sc0ZBQXNGO0FBQ3pLLFNBQU8sSUFBSTtBQUNiO0FBRU8sZ0JBQVMsZUFBZ0IsT0FBZ0IsTUFBNkI7QUFDM0UsTUFBSSxPQUFPLFVBQVUsWUFBWSxDQUFDLE1BQU0sS0FBSyxFQUFHLFFBQU87QUFDdkQsTUFBSTtBQUNGLFVBQU0sTUFBTSxJQUFJLElBQUksT0FBTyxVQUFVLElBQUksRUFBRTtBQUMzQyxRQUFJLENBQUMsQ0FBQyxTQUFTLFVBQVUsT0FBTyxFQUFFLFNBQVMsSUFBSSxRQUFRLEtBQUssSUFBSSxZQUFZLElBQUksU0FBVSxRQUFPO0FBQ2pHLGNBQVUsSUFBSSxJQUFJO0FBQ2xCLFdBQU8sSUFBSTtBQUFBLEVBQ2IsUUFBUTtBQUFFLFdBQU87QUFBQSxFQUFLO0FBQ3hCOyIsIm5hbWVzIjpbXX0=