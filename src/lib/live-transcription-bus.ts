export type LiveTranscriptionEvent =
  | {
      type: "connected";
      sessionId: string;
      message: string;
    }
  | {
      type: "keepalive";
      timestamp: number;
    }
  | {
      type: "transcript";
      sessionId: string;
      text: string;
      isFinal: boolean;
      timestamp: number;
    };

type SessionListener = (event: LiveTranscriptionEvent) => void;

type SessionState = {
  backlog: LiveTranscriptionEvent[];
  listeners: Set<SessionListener>;
};

const MAX_BACKLOG_ITEMS = 100;

declare global {
  // eslint-disable-next-line no-var
  var __liveTranscriptionSessions: Map<string, SessionState> | undefined;
}

function getSessionsStore() {
  if (!globalThis.__liveTranscriptionSessions) {
    globalThis.__liveTranscriptionSessions = new Map<string, SessionState>();
  }

  return globalThis.__liveTranscriptionSessions;
}

function getOrCreateSession(sessionId: string) {
  const sessions = getSessionsStore();
  const existing = sessions.get(sessionId);
  if (existing) return existing;

  const created: SessionState = {
    backlog: [],
    listeners: new Set(),
  };
  sessions.set(sessionId, created);
  return created;
}

export function subscribeToLiveTranscriptionSession(sessionId: string, listener: SessionListener) {
  const session = getOrCreateSession(sessionId);
  session.listeners.add(listener);

  return {
    backlog: [...session.backlog],
    unsubscribe: () => {
      session.listeners.delete(listener);
      if (session.listeners.size === 0 && session.backlog.length === 0) {
        getSessionsStore().delete(sessionId);
      }
    },
  };
}

export function publishLiveTranscriptionEvent(sessionId: string, event: LiveTranscriptionEvent) {
  const session = getOrCreateSession(sessionId);

  if (event.type === "transcript") {
    session.backlog.push(event);
    if (session.backlog.length > MAX_BACKLOG_ITEMS) {
      session.backlog = session.backlog.slice(-MAX_BACKLOG_ITEMS);
    }
  }

  session.listeners.forEach((listener) => listener(event));
}

export function resetLiveTranscriptionSessions() {
  getSessionsStore().clear();
}
