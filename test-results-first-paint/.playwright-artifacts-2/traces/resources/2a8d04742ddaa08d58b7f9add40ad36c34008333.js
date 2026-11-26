export const defaultState = () => {
  return {
    apiConnected: true,
    //            api is connected, socket may not be.
    open: false,
    //                   socket is open or closed.
    connecting: false,
    //             socket is trying to connect.
    stalled: false,
    //                socket is open, but nothing has arrived for a while.
    disconnecting: false,
    //          indicates we know a disconnect is coming, and to retry.
    ready: false,
    //                  indicates the socket is ready (and has first dump of data...)
    acceptingNotifications: false,
    // indicates we're accepting notification data because we've finished subscribing to objects
    error: null,
    //                    if the socket has an error or not
    connectionId: null
    //             connection id assigned to the socket
  };
};
export const state = defaultState();

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbInN0YXRlLnRzIl0sInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB0eXBlIHsgU29ja2V0U3RhdGUgfSBmcm9tICcuL3R5cGVzJ1xuXG5leHBvcnQgY29uc3QgZGVmYXVsdFN0YXRlID0gKCk6IFNvY2tldFN0YXRlID0+IHtcbiAgcmV0dXJuIHtcbiAgICBhcGlDb25uZWN0ZWQ6IHRydWUsIC8vICAgICAgICAgICAgYXBpIGlzIGNvbm5lY3RlZCwgc29ja2V0IG1heSBub3QgYmUuXG4gICAgb3BlbjogZmFsc2UsIC8vICAgICAgICAgICAgICAgICAgIHNvY2tldCBpcyBvcGVuIG9yIGNsb3NlZC5cbiAgICBjb25uZWN0aW5nOiBmYWxzZSwgLy8gICAgICAgICAgICAgc29ja2V0IGlzIHRyeWluZyB0byBjb25uZWN0LlxuICAgIHN0YWxsZWQ6IGZhbHNlLCAvLyAgICAgICAgICAgICAgICBzb2NrZXQgaXMgb3BlbiwgYnV0IG5vdGhpbmcgaGFzIGFycml2ZWQgZm9yIGEgd2hpbGUuXG4gICAgZGlzY29ubmVjdGluZzogZmFsc2UsIC8vICAgICAgICAgIGluZGljYXRlcyB3ZSBrbm93IGEgZGlzY29ubmVjdCBpcyBjb21pbmcsIGFuZCB0byByZXRyeS5cbiAgICByZWFkeTogZmFsc2UsIC8vICAgICAgICAgICAgICAgICAgaW5kaWNhdGVzIHRoZSBzb2NrZXQgaXMgcmVhZHkgKGFuZCBoYXMgZmlyc3QgZHVtcCBvZiBkYXRhLi4uKVxuICAgIGFjY2VwdGluZ05vdGlmaWNhdGlvbnM6IGZhbHNlLCAvLyBpbmRpY2F0ZXMgd2UncmUgYWNjZXB0aW5nIG5vdGlmaWNhdGlvbiBkYXRhIGJlY2F1c2Ugd2UndmUgZmluaXNoZWQgc3Vic2NyaWJpbmcgdG8gb2JqZWN0c1xuICAgIGVycm9yOiBudWxsLCAvLyAgICAgICAgICAgICAgICAgICAgaWYgdGhlIHNvY2tldCBoYXMgYW4gZXJyb3Igb3Igbm90XG4gICAgY29ubmVjdGlvbklkOiBudWxsIC8vICAgICAgICAgICAgIGNvbm5lY3Rpb24gaWQgYXNzaWduZWQgdG8gdGhlIHNvY2tldFxuICB9XG59XG5cbmV4cG9ydCBjb25zdCBzdGF0ZSA9IGRlZmF1bHRTdGF0ZSgpXG4iXSwibWFwcGluZ3MiOiJBQUVPLGFBQU0sZUFBZSxNQUFtQjtBQUM3QyxTQUFPO0FBQUEsSUFDTCxjQUFjO0FBQUE7QUFBQSxJQUNkLE1BQU07QUFBQTtBQUFBLElBQ04sWUFBWTtBQUFBO0FBQUEsSUFDWixTQUFTO0FBQUE7QUFBQSxJQUNULGVBQWU7QUFBQTtBQUFBLElBQ2YsT0FBTztBQUFBO0FBQUEsSUFDUCx3QkFBd0I7QUFBQTtBQUFBLElBQ3hCLE9BQU87QUFBQTtBQUFBLElBQ1AsY0FBYztBQUFBO0FBQUEsRUFDaEI7QUFDRjtBQUVPLGFBQU0sUUFBUSxhQUFhOyIsIm5hbWVzIjpbXX0=