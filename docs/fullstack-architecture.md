# CallNote Pro - Full-Stack Architecture

## System Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                         Frontend Layer                           │
│  Next.js 14 + React + TailwindCSS + GSAP + Clerk Auth            │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                         API Gateway                               │
│  Next.js API Routes + Rate Limiting + Auth Middleware            │
└─────────────────────────────────────────────────────────────────┘
                              │
        ┌─────────────────────┼─────────────────────┐
        ▼                     ▼                     ▼
┌──────────────┐    ┌──────────────┐    ┌──────────────┐
│   Service    │    │   Service    │    │   Service    │
│   Layer      │    │   Layer      │    │   Layer      │
├──────────────┤    ├──────────────┤    ├──────────────┤
│ Transcription│    │  Analysis    │    │   CRM Sync   │
│  (Whisper)   │    │  (Ollama)    │    │  (Webhooks)  │
└──────────────┘    └──────────────┘    └──────────────┘
        │                     │                     │
        └─────────────────────┼─────────────────────┘
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                         Data Layer                                │
│  PostgreSQL + Prisma ORM + Redis Cache + S3 Storage             │
└─────────────────────────────────────────────────────────────────┘
```

---

## Technology Stack

### Frontend
- **Framework**: Next.js 14 (App Router)
- **UI**: React 18 + TailwindCSS
- **Animations**: GSAP
- **Auth**: Clerk (OAuth + SSO)
- **State**: React Context + Zustand
- **Forms**: React Hook Form + Zod

### Backend
- **API**: Next.js API Routes
- **ORM**: Prisma
- **Database**: PostgreSQL
- **Cache**: Redis (Upstash)
- **Queue**: BullMQ (for background jobs)
- **Storage**: AWS S3 (or local for MVP)

### AI Services
- **Transcription**: OpenAI Whisper (cloud) or local Whisper
- **Analysis**: Ollama (local) or OpenAI GPT-4 (cloud)
- **Speaker Diarization**: pyannote.audio (local)

### Infrastructure
- **Hosting**: Vercel (frontend) + Railway/Render (backend)
- **Monitoring**: Sentry (errors) + Vercel Analytics
- **Logging**: Datadog or LogRocket
- **CI/CD**: GitHub Actions

---

## Database Schema

```prisma
// Core Models
model User {
  id            String    @id @default(cuid())
  email         String    @unique
  name          String?
  avatar        String?
  plan          Plan      @default(FREE)
  credits       Int       @default(5) // Monthly call credits
  teamId        String?
  team          Team?     @relation(fields: [teamId], references: [id])
  calls         Call[]
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt

  @@index([email])
  @@index([teamId])
}

model Team {
  id            String    @id @default(cuid())
  name          String
  slug          String    @unique
  ownerId       String
  owner         User      @relation(fields: [ownerId], references: [id])
  members       User[]
  calls         Call[]
  integrations Integration[]
  settings      Json?
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt

  @@index([slug])
  @@index([ownerId])
}

model Call {
  id            String    @id @default(cuid())
  userId        String
  user          User      @relation(fields: [userId], references: [id])
  teamId        String?
  team          Team?     @relation(fields: [teamId], references: [id])

  // Audio
  filename      String
  audioUrl      String?
  duration      Int?      // seconds

  // Transcription
  transcript    String?   @db.Text
  language      String    @default("en")

  // Analysis
  summary       String?   @db.Text
  healthScore   Float?    // 0-1
  sentiment     String?   // positive/neutral/negative

  // CRM Sync
  crmSynced     Boolean   @default(false)
  crmProvider   String?   // hubspot/salesforce
  crmRecordId   String?

  // Metadata
  source        String    @default("upload") // upload/zoom/meet/teams
  tags          String[]
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt

  actionItems   ActionItem[]
  decisions     Decision[]
  nextSteps     NextStep[]
  speakers      Speaker[]
  analytics     Analytics?

  @@index([userId])
  @@index([teamId])
  @@index([createdAt])
}

model ActionItem {
  id        String  @id @default(cuid())
  callId    String
  call      Call    @relation(fields: [callId], references: [id])
  task      String
  owner     String
  due       String?
  status    Status  @default(PENDING)
  completedAt DateTime?
  createdAt DateTime @default(now())

  @@index([callId])
  @@index([status])
}

model Decision {
  id        String  @id @default(cuid())
  callId    String
  call      Call    @relation(fields: [callId], references: [id])
  content   String
  category  String? // pricing/timeline/features/other
  createdAt DateTime @default(now())

  @@index([callId])
}

model NextStep {
  id        String  @id @default(cuid())
  callId    String
  call      Call    @relation(fields: [callId], references: [id])
  step      String
  date      String?
  status    Status  @default(PENDING)
  completedAt DateTime?
  createdAt DateTime @default(now())

  @@index([callId])
  @@index([status])
}

model Speaker {
  id        String  @id @default(cuid())
  callId    String
  call      Call    @relation(fields: [callId], references: [id])
  name      String?
  label     String  // Speaker 1, Speaker 2, etc.
  segments  Json    // Timestamps where this speaker spoke
  duration  Int?    // Total speaking time in seconds
  createdAt DateTime @default(now())

  @@index([callId])
}

model Analytics {
  id              String  @id @default(cuid())
  callId          String  @unique
  call            Call    @relation(fields: [callId], references: [id])

  // Call metrics
  talkRatio       Json?   // {speaker1: 0.6, speaker2: 0.4}
  interruptions   Int?
  questionsAsked  Int?
  objections      Json?   // List of objections raised

  // Sales signals
  budgetMentioned Boolean @default(false)
  timelineMentioned Boolean @default(false)
  decisionMakerPresent Boolean @default(false)
  competitorMentioned Boolean @default(false)

  createdAt       DateTime @default(now())
}

model Integration {
  id          String  @id @default(cuid())
  teamId      String
  team        Team    @relation(fields: [teamId], references: [id])
  provider    String  // hubspot/salesforce/zapier
  config      Json
  enabled     Boolean @default(true)
  syncedAt    DateTime?
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt()

  @@index([teamId])
  @@index([provider])
}

model RateLimit {
  id        String  @id @default(cuid())
  userId    String  @unique
  requests  Int     @default(0)
  windowStart DateTime @default(now())
  createdAt DateTime @default(now())

  @@index([userId])
}

// Enums
enum Plan {
  FREE
  PRO
  BUSINESS
  ENTERPRISE
}

enum Status {
  PENDING
  IN_PROGRESS
  COMPLETED
  CANCELLED
}
```

---

## API Routes

### Authentication
```
POST   /api/auth/register
POST   /api/auth/login
GET    /api/auth/me
POST   /api/auth/logout
```

### Calls
```
POST   /api/calls/upload          # Upload audio file
POST   /api/calls/transcribe     # Start transcription
POST   /api/calls/analyze         # Start AI analysis
GET    /api/calls                # List calls
GET    /api/calls/:id            # Get call details
PUT    /api/calls/:id            # Update call
DELETE /api/calls/:id            # Delete call
POST   /api/calls/:id/sync-crm   # Sync to CRM
```

### Action Items
```
GET    /api/action-items         # List action items
PUT    /api/action-items/:id     # Update status
DELETE /api/action-items/:id     # Delete
```

### Integrations
```
GET    /api/integrations         # List integrations
POST   /api/integrations         # Add integration
PUT    /api/integrations/:id     # Update config
DELETE /api/integrations/:id     # Remove
POST   /api/integrations/:id/test # Test connection
```

### Analytics
```
GET    /api/analytics/calls      # Call analytics
GET    /api/analytics/trends     # Trend analysis
GET    /api/analytics/health     # Health scores
```

### Webhooks (for CRM)
```
POST   /api/webhooks/hubspot     # HubSpot webhook
POST   /api/webhooks/salesforce  # Salesforce webhook
```

---

## Rate Limiting Strategy

### Tiers
| Plan | Calls/month | API calls/min |
|------|-------------|---------------|
| Free | 5 | 10 |
| Pro | Unlimited | 30 |
| Business | Unlimited | 100 |
| Enterprise | Unlimited | 500 |

### Implementation
```typescript
// middleware.ts
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

const ratelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(10, "1 m"),
  analytics: true,
});

export async function middleware(req: Request) {
  const userId = await getUserId(req);
  const { success } = await ratelimit.limit(userId);

  if (!success) {
    return new Response("Too many requests", { status: 429 });
  }
}
```

---

## Authentication Flow

### Clerk Integration
```typescript
// middleware.ts
import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

const isProtectedRoute = createRouteMatcher([
  "/app(.*)",
  "/api/calls(.*)",
  "/api/integrations(.*)",
]);

export default clerkMiddleware((auth, req) => {
  if (isProtectedRoute(req)) auth().protect();
});

export const config = {
  matcher: ["/((?!.*\\..*|_next).*)", "/", "/(api|trpc)(.*)"],
};
```

### OAuth Providers
- Google OAuth
- Microsoft OAuth
- SSO (SAML 2.0)

---

## CRM Integration Architecture

### HubSpot
```typescript
// services/crm/hubspot.ts
export class HubSpotService {
  async syncCall(call: Call, accessToken: string) {
    // Create contact
    const contact = await this.createContact(call, accessToken);

    // Create deal
    const deal = await this.createDeal(call, contact.id, accessToken);

    // Create note with action items
    await this.createNote(call, deal.id, accessToken);

    return { contactId: contact.id, dealId: deal.id };
  }

  async createContact(call: Call, accessToken: string) {
    // Extract contact info from transcript
    const contactInfo = await this.extractContactInfo(call.transcript);

    return await hubspotClient.crm.contacts.create({
      properties: {
        email: contactInfo.email,
        firstname: contactInfo.firstName,
        lastname: contactInfo.lastName,
        phone: contactInfo.phone,
      },
    });
  }

  async createDeal(call: Call, contactId: string, accessToken: string) {
    return await hubspotClient.crm.deals.create({
      properties: {
        dealname: `${call.filename} - ${new Date(call.createdAt).toLocaleDateString()}`,
        dealstage: "appointmentscheduled",
        amount: call.analytics?.budgetMentioned ? "10000" : "0",
        closedate: call.analytics?.timelineMentioned ? call.nextSteps[0]?.date : null,
      },
    });
  }

  async createNote(call: Call, dealId: string, accessToken: string) {
    const noteContent = this.formatNote(call);

    return await hubspotClient.crm.objects.notes.create({
      properties: {
        hs_note_body: noteContent,
        hs_timestamp: Date.now(),
        hs_parent_id: dealId,
        hs_parent_type: "deal",
      },
    });
  }
}
```

### Salesforce
```typescript
// services/crm/salesforce.ts
export class SalesforceService {
  async syncCall(call: Call, accessToken: string) {
    // Similar structure to HubSpot
    // Create Lead/Contact
    // Create Opportunity
    // Create Task with action items
  }
}
```

---

## Background Job Processing

### BullMQ Queue
```typescript
// queues/transcription.ts
import { Queue } from "bullmq";
import Redis from "ioredis";

const connection = new Redis(process.env.REDIS_URL);
export const transcriptionQueue = new Queue("transcription", { connection });

// Worker
import { Worker } from "bullmq";

const worker = new Worker("transcription", async (job) => {
  const { callId, audioUrl } = job.data;

  // Transcribe with Whisper
  const transcript = await transcribeAudio(audioUrl);

  // Analyze with Ollama
  const analysis = await analyzeTranscript(transcript);

  // Save to database
  await prisma.call.update({
    where: { id: callId },
    data: {
      transcript,
      summary: analysis.summary,
      healthScore: analysis.healthScore,
    },
  });

  // Sync to CRM if enabled
  await syncToCRM(callId);
}, { connection });
```

---

## Security Architecture

### Data Protection
- **Encryption at rest**: AES-256 for database
- **Encryption in transit**: TLS 1.3
- **Local AI option**: Data never leaves device
- **Data retention**: Configurable (default 90 days)

### Access Control
- **RBAC**: Owner, Admin, Member, Viewer
- **Team isolation**: Data scoped to team
- **API keys**: Scoped to user/team

### Compliance
- **GDPR**: Right to deletion, data export
- **SOC2 Type II**: Audit logging, access controls
- **HIPAA**: BAA available (optional)

---

## Monitoring & Observability

### Error Tracking
```typescript
// lib/sentry.ts
import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: 1.0,
});
```

### Analytics
```typescript
// lib/analytics.ts
import { analytics } from "@vercel/analytics";

export function trackEvent(name: string, properties?: any) {
  analytics.track(name, properties);
}
```

### Logging
```typescript
// lib/logger.ts
import pino from "pino";

export const logger = pino({
  level: process.env.LOG_LEVEL || "info",
  transport: {
    target: "pino-pretty",
  },
});
```

---

## Deployment Architecture

### Development
```
Local Development
├── Next.js dev server (localhost:3000)
├── PostgreSQL (Docker)
├── Redis (Docker)
├── Ollama (localhost:11434)
└── Whisper (local)
```

### Production
```
Vercel (Frontend + API)
├── Edge Functions (auth, rate limiting)
├── Serverless Functions (API routes)
└── Static Assets

Railway/Render (Backend Services)
├── PostgreSQL
├── Redis
├── BullMQ Workers
└── Cron Jobs

AWS S3 (Storage)
├── Audio files
├── Transcripts
└── Exports
```

---

## Development Phases

### Phase 1: Foundation (Week 1-2)
- ✅ Fix current errors
- ✅ Add Clerk authentication
- ✅ Connect PostgreSQL + Prisma
- ✅ Implement rate limiting
- ✅ Add error tracking (Sentry)

### Phase 2: Core Features (Week 3-4)
- ✅ Speaker diarization
- ✅ Team sharing
- ✅ Call history with search
- ✅ Export to CRM (HubSpot, Salesforce)
- ✅ Meeting analytics

### Phase 3: Integrations (Week 5-6)
- ✅ Zoom integration
- ✅ Google Meet integration
- ✅ Microsoft Teams integration
- ✅ OAuth providers
- ✅ Webhook system

### Phase 4: Production Ready (Week 7-8)
- ✅ Security audit
- ✅ Performance optimization
- ✅ Load testing
- ✅ Documentation
- ✅ Beta launch

---

## Success Metrics

### Technical
- API response time < 200ms (p95)
- Transcription time < 30s for 5-min audio
- Uptime > 99.9%
- Error rate < 0.1%

### Business
- User retention (30-day) > 60%
- NPS score > 50
- Revenue ARR > $100K (Q4 2026)
- Team adoption > 50% of users