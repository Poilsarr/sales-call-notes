# Graph Report - /Users/kushagarhsingh/Desktop/com analayze/works/sales-call-notes  (2026-05-10)

## Corpus Check
- Corpus is ~6,420 words - fits in a single context window. You may not need a graph.

## Summary
- 42 nodes · 48 edges · 13 communities detected
- Extraction: 79% EXTRACTED · 21% INFERRED · 0% AMBIGUOUS · INFERRED: 10 edges (avg confidence: 0.84)
- Token cost: 0 input · 0 output

## God Nodes (most connected - your core abstractions)
1. `CallNote Pro` - 15 edges
2. `/api/summarize` - 6 edges
3. `Whisper` - 4 edges
4. `CallRecord` - 4 edges
5. `Ollama` - 3 edges
6. `React 18` - 3 edges
7. `formatForClipboard()` - 2 edges
8. `saveToHistory()` - 2 edges
9. `handleCopy()` - 2 edges
10. `processCall()` - 2 edges

## Surprising Connections (you probably didn't know these)
- `CallNote Pro` --uses--> `localStorage`  [EXTRACTED]
  README.md → SPEC.md
- `CallNote Pro` --exports_to--> `HubSpot`  [INFERRED]
  README.md → SPEC.md
- `CallNote Pro` --exports_to--> `Salesforce`  [INFERRED]
  README.md → SPEC.md
- `CallNote Pro` --rationale_for--> `PostgreSQL`  [EXTRACTED]
  README.md → SPEC.md
- `CallNote Pro` --rationale_for--> `Prisma`  [EXTRACTED]
  README.md → SPEC.md

## Hyperedges (group relationships)
- **AI Processing Pipeline** — api_transcribe, whisper, api_summarize, ollama [EXTRACTED 1.00]
- **CRM Export Flow** — callnote_pro, hubspot, salesforce, action_items, key_decisions, next_steps, summary [EXTRACTED 0.90]
- **Future Storage Stack** — postgresql, prisma, clerk [EXTRACTED 1.00]

## Communities

### Community 0 - "Community 0"
Cohesion: 0.24
Nodes (4): formatForClipboard(), handleCopy(), processCall(), saveToHistory()

### Community 1 - "Community 1"
Cohesion: 0.53
Nodes (6): Action Items, /api/summarize, CallRecord, Key Decisions, Next Steps, Summary

### Community 2 - "Community 2"
Cohesion: 0.5
Nodes (5): /api/upload, CallNote Pro, Clerk, HubSpot, Salesforce

### Community 3 - "Community 3"
Cohesion: 0.5
Nodes (0): 

### Community 4 - "Community 4"
Cohesion: 0.5
Nodes (4): /api/transcribe, Ollama, Whisper, Whisper Server

### Community 5 - "Community 5"
Cohesion: 1.0
Nodes (0): 

### Community 6 - "Community 6"
Cohesion: 1.0
Nodes (1): TailwindCSS

### Community 7 - "Community 7"
Cohesion: 1.0
Nodes (2): /api/history, localStorage

### Community 8 - "Community 8"
Cohesion: 1.0
Nodes (2): Next.js 14, React 18

### Community 9 - "Community 9"
Cohesion: 1.0
Nodes (2): PostgreSQL, Prisma

### Community 10 - "Community 10"
Cohesion: 1.0
Nodes (0): 

### Community 11 - "Community 11"
Cohesion: 1.0
Nodes (0): 

### Community 12 - "Community 12"
Cohesion: 1.0
Nodes (0): 

## Knowledge Gaps
- **3 isolated node(s):** `Clerk`, `/api/upload`, `Whisper Server`
  These have ≤1 connection - possible missing edges or undocumented components.
- **Thin community `Community 5`** (2 nodes): `layout.tsx`, `RootLayout()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 6`** (2 nodes): `tailwind.config.ts`, `TailwindCSS`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 7`** (2 nodes): `/api/history`, `localStorage`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 8`** (2 nodes): `Next.js 14`, `React 18`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 9`** (2 nodes): `PostgreSQL`, `Prisma`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 10`** (1 nodes): `next-env.d.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 11`** (1 nodes): `test.mp3`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 12`** (1 nodes): `test-1sec.mp3`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `CallNote Pro` connect `Community 2` to `Community 1`, `Community 4`, `Community 6`, `Community 7`, `Community 8`, `Community 9`?**
  _High betweenness centrality (0.480) - this node is a cross-community bridge._
- **Why does `React 18` connect `Community 8` to `Community 0`, `Community 2`?**
  _High betweenness centrality (0.268) - this node is a cross-community bridge._
- **Why does `/api/summarize` connect `Community 1` to `Community 2`, `Community 4`?**
  _High betweenness centrality (0.168) - this node is a cross-community bridge._
- **Are the 5 inferred relationships involving `CallNote Pro` (e.g. with `Next.js 14` and `React 18`) actually correct?**
  _`CallNote Pro` has 5 INFERRED edges - model-reasoned connections that need verification._
- **Are the 2 inferred relationships involving `Whisper` (e.g. with `Ollama` and `Whisper Server`) actually correct?**
  _`Whisper` has 2 INFERRED edges - model-reasoned connections that need verification._
- **What connects `Clerk`, `/api/upload`, `Whisper Server` to the rest of the system?**
  _3 weakly-connected nodes found - possible documentation gaps or missing edges._