# Getting Started

## Prerequisites

- Node.js 18+
- Python 3.9+ (for Whisper)
- Ollama (for local LLM)

## Installation

```bash
# Clone the repository
cd sales-call-notes

# Install dependencies
npm install
```

## Setup AI Services

### 1. Install Whisper

```bash
# Option A: Install OpenAI Whisper
pip install openai-whisper

# Option B: Use whisper-server
pip install whisper-server
whisper-server --port 9000
```

### 2. Setup Ollama

```bash
# Install Ollama
brew install ollama  # macOS
# or: curl -fsSL https://ollama.com/install.sh | sh

# Start Ollama server
ollama serve

# Pull the model
ollama pull minimax-m2:cloud
```

## Running the App

```bash
# Development
npm run dev

# Production build
npm run build
npm start
```

The app runs on `http://localhost:3003`.

## Usage

1. Click "Try Free" or "Start Free" to open the app modal
2. Upload an audio file (MP3, WAV, M4A, WebM)
3. Wait for transcription + summarization
4. Review summary, action items, key decisions, next steps
5. Click "Copy to CRM" to copy formatted text
6. Access past calls via "History" tab