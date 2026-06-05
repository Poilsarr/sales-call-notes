# CallNote Pro: Comprehensive Audit & Growth Roadmap

## 🛡️ Security Audit
**Overall Status: 🔴 CRITICAL VULNERABILITIES FOUND**

### 1. Critical: Command Injection
- **Location:** `src/services/ai/diarization.ts`
- **Finding:** `DiarizationService` interpolates `audioPath` directly into a Python script executed via `spawn`.
- **Risk:** Remote Code Execution (RCE). A malicious filename could execute arbitrary shell commands on the server.
- **Fix:** Pass `audioPath` as a separate argument in the `args` array of `spawn` and access it via `sys.argv[1]` in Python.

### 2. Medium: Broken Rate Limiting
- **Location:** `src/middleware.ts` vs `src/middleware-rate-limit.ts`
- **Finding:** Rate limiting logic is written but never called in the main middleware pipeline.
- **Risk:** Denial of Service (DoS) and API abuse.
- **Fix:** Integrate `rateLimitMiddleware` into `src/middleware.ts`.

### 3. Low: Weak File Validation
- **Location:** `/api/analyze/route.ts`
- **Finding:** Relies on client-side `mimeType` for audio validation.
- **Risk:** Upload of malicious binaries disguised as audio.
- **Fix:** Use `file-type` library to verify magic bytes of the uploaded buffer.

---

## 🚀 Competitor Analysis & Gaps
**Competitors:** Otter.ai, Fireflies.ai, Gong.io

### The "Local-First" Edge
CallNote Pro's unique value is **Privacy**. While competitors process everything in the cloud, CallNote Pro's "Your data never leaves your device" messaging is a killer differentiator for Legal, Health, and Finance sectors.

### Feature Gaps
| Feature | Status | Priority | Strategic Impact |
| :--- | :--- | :--- | :--- |
| **CRM Sync** | ❌ Missing | P0 | Essential for SDR workflow. Needs bi-directional HubSpot/Salesforce sync. |
| **SDR Frameworks** | ❌ Missing | P0 | Move from generic summaries to BANT/MEDDIC mapping. |
| **Speaker ID** | ❌ Missing | P1 | Critical for multi-party call analysis. |
| **Deal Health** | ❌ Missing | P2 | Pattern recognition across multiple calls to flag "At Risk" deals. |

---

## 🤖 AI Feature Recommendations (Zero Cost)
Since processing is local (User's GPU/CPU), these features cost $0 in API fees:

1. **Real-time PII Redactor:** Local-first scrub of passwords/credit cards *before* saving.
2. **Semantic Knowledge Graph:** Local embeddings (via WASM) to find patterns across all past calls (e.g., "Who mentioned budget in last 30 days?").
3. **Live Objection Prompting:** Low-latency local LLM suggestions during the call for handling objections.
4. **Hyper-Personalization Engine:** AI extracts an "Emotional Hook" and "Gold Nugget" to draft human-sounding follow-up emails.

---

## 🌐 Domain & Deployment Strategy

### Domain Purchase
- **Recommendation:** **WAIT**. Do not buy until you have a validated landing page and initial user interest (PMF).
- **Once Ready:** Use `.ai` or `.io` for tech credibility.

### Deployment Pipeline
- **Frontend:** Vercel (Edge functions for API, Next.js hosting).
- **AI Backend:** Dedicated GPU VPS (e.g., Lambda Labs, RunPod) running Docker containers for Whisper and Ollama.
- **Data:** PostgreSQL (via Prisma) for user accounts; LocalStorage for the "Privacy-First" free tier.

---

## 🛠️ Next Steps Action Plan
1. [ ] **FIX CRITICAL:** Remove string interpolation in `DiarizationService`.
2. [ ] **FIX MEDIUM:** Connect `rateLimitMiddleware` to `src/middleware.ts`.
3. [ ] **BUILD:** Implement a basic HubSpot/Salesforce "Copy-to-CRM" formatter.
4. [ ] **BUILD:** Add BANT template to the summarization prompt.
5. [ ] **LUNCH:** Deploy a landing page to gather a waitlist.
