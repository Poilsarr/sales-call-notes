-- Add `referralCode` to PartnerApplication for the manual Paddle-coupon
-- referral workflow (no paid affiliate SaaS required).
--
-- Background: instead of Rewardful/PartnerStack ($49/mo), each approved
-- partner is assigned a unique Paddle coupon code (e.g. "PARTNER_JANE").
-- Sales using that code in Paddle are attributed to the partner;
-- commissions are paid manually from Paddle payout data. The code is
-- stored here so we can map Paddle transactions back to a partner.
--
-- Idempotent (IF NOT EXISTS) so re-running is a safe no-op.

ALTER TABLE "PartnerApplication" ADD COLUMN IF NOT EXISTS "referralCode" TEXT;

CREATE INDEX IF NOT EXISTS "PartnerApplication_referralCode_idx" ON "PartnerApplication"("referralCode");
