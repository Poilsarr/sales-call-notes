import { sanitizeCsvCell } from './call-title';

export interface CallExportEntry {
  displayName?: string | null;
  filename?: string | null;
  createdAt: string | Date;
  healthScore?: number | null;
  sentiment?: string | null;
  summary?: string | null;
  actionItems?: Array<{ timestamp?: number | null }>;
}

export function formatExportTimestamp(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

export function buildCallsCsv(calls: CallExportEntry[]): string {
  const headers = 'Filename,Date,Health Score,Sentiment,Action Items,Summary,Action Item Timestamps\n';
  const cell = (v: unknown) => `"${sanitizeCsvCell(v)}"`;
  const rows = calls.map((c) =>
    [
      cell(c.displayName ?? c.filename),
      cell(new Date(c.createdAt).toLocaleDateString()),
      cell(c.healthScore ?? ''),
      cell(c.sentiment ?? ''),
      cell(c.actionItems?.length ?? 0),
      cell(c.summary ?? ''),
      cell(
        (c.actionItems ?? [])
          .map((a) => a.timestamp)
          .filter((ts): ts is number => typeof ts === 'number' && Number.isFinite(ts))
          .map(formatExportTimestamp)
          .join(' | '),
      ),
    ].join(','),
  );
  return headers + rows;
}
