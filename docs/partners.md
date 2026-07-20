# Partner Program — Free Manual Workflow

Gauge's affiliate/partner program runs **without any paid affiliate SaaS**
(Rewardful/PartnerStack cost ~$49/mo — not worth it at our stage). This doc
explains the zero-cost referral workflow built on top of the existing
`PartnerApplication` table + Paddle.

## What's already built (free)

- Public landing page: `/partners` — "Earn 30% recurring commission"
- Application form: `/partners/apply` → `POST /api/partners/apply`
  - Validates input, stores the lead in `PartnerApplication`, emails
    `hello@usegauge.com` via Resend.
- `PartnerApplication` model (`prisma/schema.prisma`) with a `referralCode`
  column to map partners to their Paddle coupon.

## The manual referral loop (no software cost)

1. **Apply** — partner submits `/partners/apply`. You get an email alert.
2. **Approve** — reply to the applicant, set their `status = "approved"` in
   the DB, and create a unique **Paddle coupon code** for them
   (e.g. `PARTNER_JANE`). Store it in `PartnerApplication.referralCode`.
   - Paddle coupons are a free built-in feature — no extra tooling.
3. **Track** — every sale that uses `PARTNER_JANE` in Paddle is attributed
   to Jane. Pull Paddle transactions filtered by that code (Paddle dashboard
   or API) to see referred revenue.
4. **Pay** — monthly, sum the referred revenue for each partner, calculate
   30%, and pay via PayPal/Stripe manually. At <20 partners this is ~10 min/mo.

## Commission math

```
partner_earnings = SUM(Paddle transaction amount WHERE coupon == referralCode) * 0.30
```

Paid monthly, net-30, minimum payout $50 (configurable).

## Why not Rewardful/PartnerStack yet?

They automate link attribution + auto-payout + partner dashboards. Useful at
scale (hundreds of active partners), but:
- $49/mo kills the "minimal cost" principle
- We have 0 partners today — manual is fine
- When volume justifies it, flip the `/partners` "Become a Partner" CTA from
  `/partners/apply` to the hosted signup URL. The DB + form can stay as a
  fallback.

## SQL cheat-sheet

```sql
-- List new applications to review
SELECT id, name, email, audience, reach, status, createdAt
FROM "PartnerApplication" WHERE status = 'new' ORDER BY "createdAt" DESC;

-- Approve + assign a referral code
UPDATE "PartnerApplication"
SET status = 'approved', "referralCode" = 'PARTNER_JANE'
WHERE email = 'jane@company.com';

-- All approved partners and their codes (for monthly payout)
SELECT name, email, "referralCode"
FROM "PartnerApplication" WHERE status = 'approved';
```

## Files

- `src/app/partners/page.tsx` — landing page
- `src/app/partners/apply/page.tsx` — application form
- `src/app/api/partners/apply/route.ts` — submission API
- `src/services/email.ts` — `sendPartnerApplicationEmail`
- `prisma/schema.prisma` — `PartnerApplication` model
