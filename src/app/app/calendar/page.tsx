'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { Calendar, Clock, Users, Video, ExternalLink, RefreshCw, AlertCircle, CheckCircle2, Loader2, Plug } from 'lucide-react';
import { toast } from 'sonner';

interface CalendarEvent {
  id: string;
  summary: string;
  start: string;
  end: string;
  hangoutLink?: string;
  conferenceData?: { url: string; type?: string };
  attendees?: string[];
}

export default function CalendarPage() {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [code, setCode] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    setCode(null);
    try {
      const res = await fetch('/api/calendar', { cache: 'no-store' });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error || 'Failed to load calendar');
        setCode(data.code || null);
        return;
      }
      setEvents(Array.isArray(data.events) ? data.events : []);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load calendar');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const formatTime = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleString(undefined, { weekday: 'short', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  const getPlatform = (url?: string) => {
    if (!url) return null;
    if (url.includes('meet.google.com')) return 'Google Meet';
    if (url.includes('zoom.us')) return 'Zoom';
    if (url.includes('teams.microsoft.com')) return 'Teams';
    return 'Meet';
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-semibold text-white mb-2 flex items-center gap-3">
            <Calendar className="w-7 h-7 text-[#F26522]" />
            Calendar
          </h1>
          <p className="text-zinc-400">Your Google Calendar — next 7 days, auto-detected from your connected account</p>
        </div>
        <button
          onClick={() => void load()}
          disabled={loading}
          className="rounded-full px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-sm font-medium flex items-center gap-2 disabled:opacity-50"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
          Refresh
        </button>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="doppel-outer-dark">
              <div className="doppel-inner-dark p-4">
                <div className="h-4 w-40 bg-zinc-800 animate-pulse rounded" />
                <div className="h-3 w-64 bg-zinc-800/60 animate-pulse rounded mt-3" />
              </div>
            </div>
          ))}
        </div>
      ) : error ? (
        <div className="rounded-xl border border-amber-500/20 bg-amber-500/10 p-6">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-amber-400 mt-0.5" />
            <div className="flex-1">
              <p className="text-white font-medium">
                {code === 'NOT_CONNECTED' ? 'Google Calendar not connected' : code === 'NEEDS_RECONNECT' ? 'Session expired — please reconnect' : 'Could not load calendar'}
              </p>
              <p className="text-sm text-zinc-400 mt-1">{error}</p>
              {code === 'NOT_CONNECTED' || code === 'NEEDS_RECONNECT' ? (
                <Link
                  href="/integrations"
                  className="inline-flex items-center gap-2 mt-4 rounded-full bg-[#F26522] hover:bg-[#e05a1a] text-white px-4 py-2 text-sm font-semibold"
                >
                  <Plug className="w-4 h-4" />
                  Connect Google Calendar
                </Link>
              ) : (
                <button
                  onClick={() => void load()}
                  className="mt-4 rounded-full bg-zinc-800 hover:bg-zinc-700 text-white px-4 py-2 text-sm font-medium"
                >
                  Try again
                </button>
              )}
            </div>
          </div>
        </div>
      ) : events.length === 0 ? (
        <div className="rounded-xl border border-dashed border-zinc-800 bg-zinc-900/30 p-8 text-center">
          <div className="w-12 h-12 rounded-full bg-zinc-800 flex items-center justify-center mx-auto mb-3">
            <CheckCircle2 className="w-6 h-6 text-zinc-500" />
          </div>
          <p className="text-white font-medium">No upcoming events</p>
          <p className="text-sm text-zinc-500 mt-1">No events in the next 7 days on your primary calendar. Future meetings will appear here with a one-tap Join link.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {events.map((ev) => {
            const url = ev.conferenceData?.url || ev.hangoutLink;
            const platform = getPlatform(url);
            return (
              <div key={ev.id} className="doppel-outer-dark">
                <div className="doppel-inner-dark p-4 flex items-start justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <p className="text-white font-medium truncate">{ev.summary}</p>
                    <div className="flex flex-wrap items-center gap-3 mt-1.5 text-sm text-zinc-400">
                      <span className="flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5" />
                        {formatTime(ev.start)} — {new Date(ev.end).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}
                      </span>
                      {ev.attendees && ev.attendees.length > 0 && (
                        <span className="flex items-center gap-1.5">
                          <Users className="w-3.5 h-3.5" />
                          {ev.attendees.slice(0, 3).join(', ')}
                          {ev.attendees.length > 3 ? ` +${ev.attendees.length - 3}` : ''}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="shrink-0 flex items-center gap-2">
                    {url ? (
                      <a
                        href={url}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1.5 rounded-full bg-emerald-600 hover:bg-emerald-500 text-white px-3 py-1.5 text-sm font-medium"
                        onClick={() => toast.success('Opening meeting link')}
                      >
                        <Video className="w-4 h-4" />
                        Join {platform ? `· ${platform}` : ''}
                        <ExternalLink className="w-3.5 h-3.5 opacity-70" />
                      </a>
                    ) : (
                      <span className="text-xs text-zinc-500 px-2 py-1 rounded-full border border-zinc-800">No meet link</span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <div className="rounded-xl bg-zinc-900/40 border border-zinc-800 px-4 py-3 flex items-center justify-between">
        <p className="text-xs text-zinc-500">
          Connected via <span className="text-zinc-300">Google Calendar</span> · Primary calendar · Next 10 events · {events.length} shown
        </p>
        <Link href="/integrations" className="text-xs text-zinc-400 hover:text-white underline-offset-4 hover:underline">
          Manage integrations →
        </Link>
      </div>
    </div>
  );
}
