export type FeatureContent = {
  summary: string
  bullets: string[]
  specs: { label: string; value: string }[]
  meta: { label: string; value: string }[]
}

export const featureContent: Record<number, FeatureContent> = {
  1: {
    summary: "Drag-drop or paste a link. We auto-detect format, sample rate, and channels on contact.",
    bullets: [
      "Drag-drop, click to browse, or paste a public URL",
      "Auto-detects format, bitrate, mono vs stereo on drop",
      "Handles 4-hour files without splitting or truncation",
      "Concurrent uploads with per-file progress bars",
      "Resumes interrupted uploads from the same tab",
    ],
    specs: [
      { label: "Formats", value: "MP3, WAV, M4A, WebM, OGG, FLAC" },
      { label: "Max file size", value: "500 MB per file" },
      { label: "Max duration", value: "4 hours per recording" },
      { label: "Sources", value: "Local, URL, Google Drive (Pro+)" },
    ],
    meta: [
      { label: "Pipeline", value: "Chunked HTTPS, parallel parts" },
      { label: "Normalize", value: "Server-side ffmpeg, 16 kHz mono" },
    ],
  },
  2: {
    summary: "Whisper Large V3 with robust handling for accents, crosstalk, and phone audio.",
    bullets: [
      "Whisper Large V3 with custom domain adaptation",
      "Evaluated on Switchboard plus an internal sales-call sample; accuracy varies by audio quality",
      "Robust to accents, crosstalk, and bad phone audio",
      "Auto punctuation, capitalization, filler-word cleanup",
      "Timestamped segments down to the 100 ms level",
    ],
    specs: [
      { label: "Model", value: "Whisper Large V3 (Groq-hosted)" },
      { label: "Languages", value: "12 first-class languages, auto-detect default" },
      { label: "Latency", value: "~30s for a 10-minute call" },
      { label: "Output", value: "JSON, SRT, VTT, plain text" },
    ],
    meta: [
      { label: "Powered by", value: "OpenAI Whisper + Groq LPU" },
      { label: "Fallback", value: "Whisper Cloud (OpenAI) for long files" },
    ],
  },
  3: {
    summary: "2-3 sentence recap with decisions and next steps. Prompt-tuned on real B2B sales transcripts.",
    bullets: [
      "2-3 sentence recap of the full conversation",
      "Pulls out decisions, objections, and buying signals",
      "Next-steps section with clear ownership per item",
      "Prompt-tuned on real B2B SaaS sales transcripts",
      "Executive summary mode available for managers",
    ],
    specs: [
      { label: "Length", value: "2-3 sentences, configurable up to 8" },
      { label: "Sections", value: "Recap, decisions, next steps, risks" },
      { label: "Tone", value: "Sales-rep friendly, no consultant jargon" },
      { label: "Model", value: "GPT-4o (default), Claude Sonnet opt-in" },
    ],
    meta: [
      { label: "Powered by", value: "GPT-4o with custom sales prompt" },
      { label: "Eval", value: "Human-reviewed on a 200-call sample set" },
    ],
  },
  4: {
    summary: "Detects tasks, assigns owners, and infers due dates from phrases like 'by Friday'.",
    bullets: [
      "Detects commitments, promises, and TODOs in context",
      "Assigns owners using the speaker diarization map",
      "Infers due dates from 'by Friday', 'next week', etc",
      "One-click push to Linear, Asana, Notion, or HubSpot",
      "Surfaces items mentioned in passing, not just TODOs",
    ],
    specs: [
      { label: "Owner inference", value: "Speaker map + name recognition" },
      { label: "Date parsing", value: "Natural language + calendar context" },
      { label: "Confidence", value: "0-1 score per item, filterable" },
      { label: "Integrations", value: "Linear, Asana, Notion, HubSpot Tasks" },
    ],
    meta: [
      { label: "Powered by", value: "GPT-4o function calling" },
      { label: "Coverage", value: "Reviewed against an internal eval set; coverage varies by call style" },
    ],
  },
  5: {
    summary: "Paste-ready notes for HubSpot, Salesforce, or Teams. Right fields, not a wall of text.",
    bullets: [
      "Field-mapped templates for HubSpot, Salesforce, Teams",
      "Paste-ready formatting with the right line breaks",
      "Auto-attaches the call recording link and transcript",
      "One-way push keeps CRM notes in step with Gauge; edits in Gauge don't auto-sync back",
      "Per-team custom templates with merge fields",
    ],
    specs: [
      { label: "CRMs", value: "HubSpot, Salesforce, MS Teams, Pipedrive" },
      { label: "Sync mode", value: "One-click copy, OAuth push, or webhook" },
      { label: "Fields", value: "Subject, body, next steps, recording URL" },
      { label: "Custom", value: "Team templates with merge tokens" },
    ],
    meta: [
      { label: "Auth", value: "OAuth 2.0, scopes per workspace" },
      { label: "Latency", value: "Under 2s end-to-end push" },
    ],
  },
  6: {
    summary: "Health score, sentiment arc, talk ratio, BANT signals, decision-maker flag on every call.",
    bullets: [
      "Deal health score 0-100 with explainable drivers",
      "Sentiment arc charted across the call timeline",
      "Talk ratio rep vs prospect with lopsided-deal warning",
      "Detects budget, authority, need, and timing signals",
      "Decision-maker presence flag from speaker analysis",
    ],
    specs: [
      { label: "Score", value: "0-100 deal health, weighted rubric" },
      { label: "Frameworks", value: "BANT, MEDDIC, SPICED, GPCTBA" },
      { label: "Charts", value: "Sentiment arc, talk ratio, topic mix" },
      { label: "Refresh", value: "Recomputed on every transcript edit" },
    ],
    meta: [
      { label: "Powered by", value: "GPT-4o + custom classifier layer" },
      { label: "Coverage", value: "60+ rep-coachable signals tracked" },
    ],
  },
  7: {
    summary: "Pyannote labels who said what, with overlap detection and a per-segment confidence score.",
    bullets: [
      "Auto-labels speakers as Speaker 1, 2, 3 in real time",
      "Rename to real names with one click per call",
      "Detects overlapping speech and crosstalk separately",
      "Speaker confidence score on every segment",
      "Reuses speaker names across repeat callers",
    ],
    specs: [
      { label: "Engine", value: "Pyannote 3.1 + custom fine-tune" },
      { label: "Max speakers", value: "10 per call, configurable higher" },
      { label: "Overlap", value: "Detected and split into segments" },
      { label: "Accuracy", value: "Overlap-aware; accuracy varies by mic setup and overlap" },
    ],
    meta: [
      { label: "Powered by", value: "Pyannote.audio + speaker embeddings" },
      { label: "Memory", value: "Cross-call name persistence" },
    ],
  },
  8: {
    summary: "Search across calls, transcripts, and items. Filter by date, rep, deal stage, or keyword.",
    bullets: [
      "Full-text search across transcripts, summaries, items",
      "Filter by date range, rep, deal stage, or customer",
      "Saved searches with email alerts on new matches",
      "Tag calls with custom labels and segment slices",
      "Bulk export of search results to CSV or JSON",
    ],
    specs: [
      { label: "Index", value: "Postgres tsvector with GIN" },
      { label: "Latency", value: "Under 200ms across 10k calls" },
      { label: "Filters", value: "Date, rep, customer, stage, tag, score" },
      { label: "Retention", value: "Unlimited on the Business plan" },
    ],
    meta: [
      { label: "Storage", value: "Neon Postgres + S3 audio bucket" },
      { label: "Encryption", value: "AES-256 at rest, TLS in transit" },
    ],
  },
  9: {
    summary: "Cloud processing by default with disclosed providers. Local-only option for regulated calls; never used to train models.",
    bullets: [
      "Processed by disclosed cloud providers by default, never used to train models",
      "Opt-in local-only mode for regulated industries like finance",
      "Export and deletion controls on every workspace",
      "Toggle local-only per call from the upload screen",
      "Processing location shown on every card and transcript view",
    ],
    specs: [
      { label: "Default", value: "Cloud processing, local-only opt-in" },
      { label: "Local engine", value: "whisper.cpp on WebGPU or WASM" },
      { label: "Cloud sync", value: "On by default, local-only per call" },
      { label: "Compliance", value: "GDPR-friendly with deletion controls" },
    ],
    meta: [
      { label: "Powered by", value: "Groq-hosted Whisper + local whisper.cpp option" },
      { label: "Fallback", value: "Local model when offline and supported" },
    ],
  },
  10: {
    summary: "12 first-class languages. Auto-detects the spoken language, no menu to click.",
    bullets: [
      "EN, ES, FR, DE, PT, IT, NL, PL, JA, ZH, KO, AR first-class",
      "Auto-detects the spoken language per call",
      "Mixed-language calls handled without mode switching",
      "Translation pass produces an English transcript",
      "Per-language accuracy reporting in the analytics tab",
    ],
    specs: [
      { label: "First-class", value: "EN, ES, FR, DE, PT, IT, NL, PL, JA, ZH, KO, AR" },
      { label: "Total supported", value: "12 first-class; more via Whisper multilingual (accuracy varies)" },
      { label: "Detection", value: "First 30 seconds, confidence-scored" },
      { label: "Translation", value: "GPT-4o pass, opt-in per workspace" },
    ],
    meta: [
      { label: "Powered by", value: "Whisper multilingual + GPT-4o" },
      { label: "Eval", value: "Tested on FLEURS and CommonVoice" },
    ],
  },
  11: {
    summary: "Full-schema JSON for every call. Drop into Zapier, Make, n8n, or your own data pipeline.",
    bullets: [
      "Full schema: transcript, summary, items, analytics",
      "Per-field export to filter down to what you need",
      "Stable v1 API with semver guarantees for breaking",
      "Bulk export of the full archive to S3 or GCS",
      "Webhooks fire on every completed call",
    ],
    specs: [
      { label: "Schema", value: "Gauge Call v1, semver-locked" },
      { label: "Delivery", value: "S3, GCS, webhook, or signed URL" },
      { label: "Format", value: "JSON Lines for bulk, JSON for single" },
      { label: "Auth", value: "API key on Pro, OAuth on Business" },
    ],
    meta: [
      { label: "Spec", value: "Documented at /api-docs/v1" },
      { label: "SLA", value: "Webhooks with 3x retry; status visible per call" },
    ],
  },
  12: {
    summary: "Manager view of every rep. Team rollups, leaderboards, and 1:1 prep on one screen.",
    bullets: [
      "Team-wide deal health score trend over time",
      "Leaderboards by call volume, close rate, and score",
      "Filter by rep, segment, deal stage, or date range",
      "1:1 prep view with call-by-call drill-down",
      "CSV export of any rollup for board decks",
    ],
    specs: [
      { label: "Views", value: "Team, rep, segment, deal-stage" },
      { label: "Charts", value: "Score trend, talk ratio, activity heatmap" },
      { label: "Drill-down", value: "Per-call to transcript in two clicks" },
      { label: "Sharing", value: "Read-only links, embeddable charts" },
    ],
    meta: [
      { label: "Access", value: "Manager role required, RBAC enforced" },
      { label: "Refresh", value: "Live, ~30s lag from upload" },
    ],
  },
}
