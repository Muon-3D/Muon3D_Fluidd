export interface SocketState {
  apiConnected: boolean;
  open: boolean;
  connecting: boolean;
  stalled: boolean;
  disconnecting: boolean;
  ready: boolean;
  acceptingNotifications: boolean;
  error: SocketError | null;
  connectionId: string | null;
  /** The socket hasn't opened since the last tries: why, and whether enough have failed to say it can't be reached. */
  failure: SocketFailure | null;
}

export interface SocketFailure {
  /** The end of "Can't reach Boxwood: …". */
  reason: string;
  unreachable: boolean;
}

export interface SocketError {
    code: number;
    message: string;
}
