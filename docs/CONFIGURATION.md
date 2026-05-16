# Configuration

## Environment Variables

### Required Setup

| Variable | Description | Default |
|----------|-------------|---------|
| `PORT` | Next.js server port | `3003` |

### Optional (for cloud features)

| Variable | Description |
|----------|-------------|
| `OPENAI_API_KEY` | OpenAI API key (future feature) |
| `DATABASE_URL` | PostgreSQL connection string (future) |

## Local AI Services

### Whisper

- **Port**: 9000
- **Model**: base (or custom)
- **Command**: `whisper-server --port 9000`

### Ollama

- **Port**: 11434
- **Model**: minimax-m2:cloud
- **Command**: `ollama serve`

## App Settings

### File Uploads

- **Max Size**: 50MB
- **Allowed Types**: .mp3, .wav, .m4a, .webm

### localStorage

- **Key**: `callnote_history`
- **Format**: JSON array of call records

## Development Config

### Next.js (next.config.js)

```js
/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
}

module.exports = nextConfig
```

### TailwindCSS (tailwind.config.js)

Custom colors from SPEC.md:
- Primary: #2563EB (blue-600)
- Success: #16A34A (green-600)
- Background: #F9FAFB (gray-50)

## Production

Build with `npm run build`, start with `npm start`.

No additional configuration required for MVP.