# API Reference

## Endpoints

### POST /api/transcribe

Transcribe audio file to text using Whisper.

**Request:**
```json
{
  "file": "File object (FormData)"
}
```

**Response:**
```json
{
  "transcript": "Transcribed text..."
}
```

**Errors:**
- 400: No file provided
- 500: Transcription failed

---

### POST /api/summarize

Analyze transcript and extract structured data using Ollama.

**Request:**
```json
{
  "transcript": "Full transcript text..."
}
```

**Response:**
```json
{
  "summary": "2-3 sentence summary",
  "actionItems": [
    {"task": "Send welcome email", "owner": "Company", "due": "3-5 days"}
  ],
  "keyDecisions": ["Enrolled in premium plan"],
  "nextSteps": [
    {"step": "Follow-up call", "date": "Tuesday"}
  ]
}
```

**Errors:**
- 400: No transcript provided
- 500: Summarization failed

---

### GET /api/history

Retrieve all saved calls.

**Response:**
```json
{
  "calls": [
    {
      "id": "call_1234567890",
      "createdAt": "2024-01-15T10:30:00Z",
      "filename": "call.mp3",
      "transcript": "...",
      "summary": "...",
      "actionItems": [],
      "keyDecisions": [],
      "nextSteps": []
    }
  ]
}
```

---

### POST /api/history

Save a new call to history.

**Request:**
```json
{
  "filename": "call.mp3",
  "transcript": "...",
  "summary": "...",
  "actionItems": [],
  "keyDecisions": [],
  "nextSteps": []
}
```

**Response:**
```json
{
  "call": {
    "id": "call_1234567890",
    "createdAt": "2024-01-15T10:30:00Z",
    ...
  }
}
```

---

### DELETE /api/history

Delete a call by ID.

**Request:**
```json
{
  "id": "call_1234567890"
}
```

**Response:**
```json
{
  "success": true
}
```

---

### POST /api/upload

Handle file uploads.

**Request:** FormData with file

**Response:**
```json
{
  "filepath": "/tmp/uploaded_file.mp3",
  "filename": "call.mp3"
}
```