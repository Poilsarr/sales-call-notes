# Testing

## Current State

The repository has an automated Vitest suite covering services, API routes,
components, integrations, and security helpers. Run `npm test` for the full
suite; run `npx playwright test` for the local browser smoke suite. Authenticated
browser tests are skipped unless Clerk E2E credentials are provided.

## Recommended Test Setup

### Unit Tests

```bash
npm test
```

### Test Structure

```
src/
├── __tests__/
│   ├── components/
│   │   └── AppInterface.test.tsx
│   └── utils/
│       └── formatCallRecord.test.ts
```

## Manual Testing Checklist

### Audio Upload

- [ ] Drag-drop uploads file
- [ ] Click-to-upload opens file picker
- [ ] Invalid file types rejected
- [ ] Progress indicator shows during upload

### Transcription

- [ ] MP3 files transcribe correctly
- [ ] WAV files transcribe correctly
- [ ] M4A files transcribe correctly
- [ ] Large files (>10MB) handle gracefully
- [ ] Error states display properly

### Summarization

- [ ] Summary extracts correctly
- [ ] Action items identified
- [ ] Key decisions extracted
- [ ] Next steps extracted
- [ ] Handles empty transcripts

### History

- [ ] Calls save to localStorage
- [ ] History displays past calls
- [ ] Search filters work
- [ ] Delete removes entries
- [ ] Empty state displays

### UI/UX

- [ ] Responsive on mobile
- [ ] Loading states show
- [ ] Error states display
- [ ] Copy to clipboard works

## Integration Testing

Test complete flows:

1. Upload audio → transcription → summarization → save to history
2. View history → search → view details → delete

## Performance Targets

- Transcription: <30s for 5-min audio
- Summarization: <10s
