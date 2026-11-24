export function validPsk(psk) {
  return psk.length >= 8 && psk.length <= 63 || /^[0-9a-f]{64}$/i.test(psk);
}
export function joinErrorCopy(error, name, ssid) {
  switch (error.code) {
    case "wrong_password":
      return `${ssid} didn't accept that password.`;
    case "ssid_not_found":
      return `${name} can't see ${ssid} from here.`;
    case "no_address":
      return `${name} joined ${ssid}, but the router didn't give it an address. Restarting the router often fixes this.`;
    case "timeout":
      return `Joining ${ssid} took too long.`;
    case "eap_failed":
      return `${ssid} didn't accept that username or password.`;
    case "cert_invalid":
      return `${ssid}'s certificate couldn't be checked.`;
    case "unsupported_security":
      return `${name} can't join this kind of network.`;
    default:
      return `${name} couldn't join ${ssid}.`;
  }
}
export function writeErrorCopy(error, name) {
  switch (error?.code) {
    case "stale_rev":
      return `This step changed on ${name}'s screen.`;
    case "busy":
      return `${name} is busy with another step. One moment…`;
    case "invalid_network":
      return "Check the network details and try again.";
    case "protected":
      return `${name} is protected. Change Wi-Fi on its screen.`;
    default:
      return error?.message ?? `${name} couldn't do that. Try again.`;
  }
}

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIndpZmlDb3B5LnRzIl0sInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogVGhlIFdpLUZpIHN0ZXAncyB3b3JkcyBhbmQgY2hlY2tzICgwMi1zZXR1cC1hcGkubWQgwqc1LjYsIDA4LWVycm9ycy5tZCksXG4gKiBzaGFyZWQgYnkgZXZlcnkgcGFnZSB0aGF0IGRyYXdzIHRoZSBzdGVwLlxuICovXG5pbXBvcnQgdHlwZSB7IFNldHVwRXJyb3IgfSBmcm9tICcuL3R5cGVzJ1xuXG4vKiogQSBXUEEgcGFzc3BocmFzZTogOCB0byA2MyBjaGFyYWN0ZXJzLCBvciA2NCBoZXggZGlnaXRzICgwMiDCpzUuNikuICovXG5leHBvcnQgZnVuY3Rpb24gdmFsaWRQc2sgKHBzazogc3RyaW5nKTogYm9vbGVhbiB7XG4gIHJldHVybiAocHNrLmxlbmd0aCA+PSA4ICYmIHBzay5sZW5ndGggPD0gNjMpIHx8IC9eWzAtOWEtZl17NjR9JC9pLnRlc3QocHNrKVxufVxuXG4vKiogMDgtZXJyb3JzLm1kLCB0aGUgam9pbiByb3dzLiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGpvaW5FcnJvckNvcHkgKGVycm9yOiBTZXR1cEVycm9yLCBuYW1lOiBzdHJpbmcsIHNzaWQ6IHN0cmluZyk6IHN0cmluZyB7XG4gIHN3aXRjaCAoZXJyb3IuY29kZSkge1xuICAgIGNhc2UgJ3dyb25nX3Bhc3N3b3JkJzogcmV0dXJuIGAke3NzaWR9IGRpZG4ndCBhY2NlcHQgdGhhdCBwYXNzd29yZC5gXG4gICAgY2FzZSAnc3NpZF9ub3RfZm91bmQnOiByZXR1cm4gYCR7bmFtZX0gY2FuJ3Qgc2VlICR7c3NpZH0gZnJvbSBoZXJlLmBcbiAgICBjYXNlICdub19hZGRyZXNzJzogcmV0dXJuIGAke25hbWV9IGpvaW5lZCAke3NzaWR9LCBidXQgdGhlIHJvdXRlciBkaWRuJ3QgZ2l2ZSBpdCBhbiBhZGRyZXNzLiBSZXN0YXJ0aW5nIHRoZSByb3V0ZXIgb2Z0ZW4gZml4ZXMgdGhpcy5gXG4gICAgY2FzZSAndGltZW91dCc6IHJldHVybiBgSm9pbmluZyAke3NzaWR9IHRvb2sgdG9vIGxvbmcuYFxuICAgIGNhc2UgJ2VhcF9mYWlsZWQnOiByZXR1cm4gYCR7c3NpZH0gZGlkbid0IGFjY2VwdCB0aGF0IHVzZXJuYW1lIG9yIHBhc3N3b3JkLmBcbiAgICBjYXNlICdjZXJ0X2ludmFsaWQnOiByZXR1cm4gYCR7c3NpZH0ncyBjZXJ0aWZpY2F0ZSBjb3VsZG4ndCBiZSBjaGVja2VkLmBcbiAgICBjYXNlICd1bnN1cHBvcnRlZF9zZWN1cml0eSc6IHJldHVybiBgJHtuYW1lfSBjYW4ndCBqb2luIHRoaXMga2luZCBvZiBuZXR3b3JrLmBcbiAgICBkZWZhdWx0OiByZXR1cm4gYCR7bmFtZX0gY291bGRuJ3Qgam9pbiAke3NzaWR9LmBcbiAgfVxufVxuXG4vKiogMDgtZXJyb3JzLm1kLCB0aGUgcm93cyBldmVyeSBzY3JlZW4gaGFuZGxlcy4gKi9cbmV4cG9ydCBmdW5jdGlvbiB3cml0ZUVycm9yQ29weSAoZXJyb3I6IFNldHVwRXJyb3IgfCBudWxsLCBuYW1lOiBzdHJpbmcpOiBzdHJpbmcge1xuICBzd2l0Y2ggKGVycm9yPy5jb2RlKSB7XG4gICAgY2FzZSAnc3RhbGVfcmV2JzogcmV0dXJuIGBUaGlzIHN0ZXAgY2hhbmdlZCBvbiAke25hbWV9J3Mgc2NyZWVuLmBcbiAgICBjYXNlICdidXN5JzogcmV0dXJuIGAke25hbWV9IGlzIGJ1c3kgd2l0aCBhbm90aGVyIHN0ZXAuIE9uZSBtb21lbnTigKZgXG4gICAgY2FzZSAnaW52YWxpZF9uZXR3b3JrJzogcmV0dXJuICdDaGVjayB0aGUgbmV0d29yayBkZXRhaWxzIGFuZCB0cnkgYWdhaW4uJ1xuICAgIGNhc2UgJ3Byb3RlY3RlZCc6IHJldHVybiBgJHtuYW1lfSBpcyBwcm90ZWN0ZWQuIENoYW5nZSBXaS1GaSBvbiBpdHMgc2NyZWVuLmBcbiAgICBkZWZhdWx0OiByZXR1cm4gZXJyb3I/Lm1lc3NhZ2UgPz8gYCR7bmFtZX0gY291bGRuJ3QgZG8gdGhhdC4gVHJ5IGFnYWluLmBcbiAgfVxufVxuIl0sIm1hcHBpbmdzIjoiQUFPTyxnQkFBUyxTQUFVLEtBQXNCO0FBQzlDLFNBQVEsSUFBSSxVQUFVLEtBQUssSUFBSSxVQUFVLE1BQU8sa0JBQWtCLEtBQUssR0FBRztBQUM1RTtBQUdPLGdCQUFTLGNBQWUsT0FBbUIsTUFBYyxNQUFzQjtBQUNwRixVQUFRLE1BQU0sTUFBTTtBQUFBLElBQ2xCLEtBQUs7QUFBa0IsYUFBTyxHQUFHLElBQUk7QUFBQSxJQUNyQyxLQUFLO0FBQWtCLGFBQU8sR0FBRyxJQUFJLGNBQWMsSUFBSTtBQUFBLElBQ3ZELEtBQUs7QUFBYyxhQUFPLEdBQUcsSUFBSSxXQUFXLElBQUk7QUFBQSxJQUNoRCxLQUFLO0FBQVcsYUFBTyxXQUFXLElBQUk7QUFBQSxJQUN0QyxLQUFLO0FBQWMsYUFBTyxHQUFHLElBQUk7QUFBQSxJQUNqQyxLQUFLO0FBQWdCLGFBQU8sR0FBRyxJQUFJO0FBQUEsSUFDbkMsS0FBSztBQUF3QixhQUFPLEdBQUcsSUFBSTtBQUFBLElBQzNDO0FBQVMsYUFBTyxHQUFHLElBQUksa0JBQWtCLElBQUk7QUFBQSxFQUMvQztBQUNGO0FBR08sZ0JBQVMsZUFBZ0IsT0FBMEIsTUFBc0I7QUFDOUUsVUFBUSxPQUFPLE1BQU07QUFBQSxJQUNuQixLQUFLO0FBQWEsYUFBTyx3QkFBd0IsSUFBSTtBQUFBLElBQ3JELEtBQUs7QUFBUSxhQUFPLEdBQUcsSUFBSTtBQUFBLElBQzNCLEtBQUs7QUFBbUIsYUFBTztBQUFBLElBQy9CLEtBQUs7QUFBYSxhQUFPLEdBQUcsSUFBSTtBQUFBLElBQ2hDO0FBQVMsYUFBTyxPQUFPLFdBQVcsR0FBRyxJQUFJO0FBQUEsRUFDM0M7QUFDRjsiLCJuYW1lcyI6W119