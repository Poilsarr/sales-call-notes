# RISK MATRIX — every scenario we planned for, and the response

| # | Scenario | Probability | Impact | Response (built/prevented) | Status |
|---|---|---|---|---|---|
| R1 | Free page still claims 600min/unlimited | Med (copy drift) | Legal/trust | Regression tests pin 3 pages; plans.ts read at test time | Prevented (S1) |
| R2 | `BYOK_MASTER_KEY` missing at save | High (new env var) | Feature dead | PUT returns 500 with actionable message; GET still works | Handled |
| R3 | Master key rotated after keys stored | Low | Stored keys unreadable | Resolver fail-soft → shared keys; logs; docs warn | Handled |
| R4 | Tampered/wrong ciphertext | Low | Decrypt throw | GCM auth tag; resolver try/catch; unit tests | Handled |
| R5 | User pastes wrong-format key | Med | Confusing 401s later | Prefix+length validation at save (sk-/sk_/gsk_) | Handled |
| R6 | Free user hits BYOK API | Med | Abuse | 403 + upgradeUrl; UI hides form | Handled |
| R7 | BYOK Groq key + model override regression | Med | Paid whisper-1 for BYOK users | Route forces large-v3 in both paths (ffmpeg + estimate) | Handled |
| R8 | Groq 401 with OpenAI-only user | Med | Failed call | transcribe() retry to whisper-1; route only forces large-v3 when groqKey present | Handled |
| R9 | Shared keys absent + BYOK set → route guard | Med | False 500 | Guard accepts byok keys as alternative | Handled |
| R10 | Migration on prod runs twice | Low | Duplicate column | `IF NOT EXISTS` idempotent SQL | Handled |
| R11 | Prisma client drift (new columns invisible) | Med | TS errors | `prisma generate` run; build gate catches | Handled |
| R12 | Neon unreachable during migration | Seen (P1001) | No migration file | Offline hand-written SQL + generate; dev DB sync later | Handled |
| R13 | Verify gate claims without evidence | N/A | Trust | verification-before-completion skill; evidence in every gate report | Active |
| R14 | Agents edit same files in parallel | Med | Conflicts | Disjoint scopes per agent (code vs UI vs a11y vs tests); code agents read-only for review gates | Active |
| R15 | Gong numbers unverifiable on /vs/gong | Med | Trust | Only sourced/hedged claims; reality-check agent gate | Planned (S5) |
| R16 | ActionItem.timestamp breaks serializers | Med | API break | Serializer additive (null default); CSV test update | Planned (S8) |
| R17 | Share sitemap leaks private calls | Med | Privacy | Only public-share rows; predicate in sitemap query | Planned (S9) |
| R18 | Vocabulary prompt bloat (token cap) | Low | Cost | Cap 50 terms; char cap on injected block | Planned (S7) |
| R19 | RAG chat retrieval returns unrelated calls | Med | Bad UX | Top-5 cosine + summary-only context; BYOK embedding aware | Planned (S10) |
| R20 | E2E claims without Clerk creds | High | False success | NEVER claim; mark user-blocked in reports | Active |

## Outcome matrix (what "done" looks like per gate)

- **Gate PASS:** vitest 0 failures + build exit 0 + each verification
  agent returns `PASS` with file:line evidence, or `ISSUES` with exact
  findings that we then fix and re-run the gate.
- **Gate FAIL:** no advance to next sub-task; fix findings → re-run full
  gate → only then proceed.
- **User-blocked items:** recorded in sequence + handoff; never faked.
