'use client';

import { useState, useEffect } from 'react';
import TrialBanner from './trial-banner';
import FreePlanBanner from './free-plan-banner';
import UsageLimitBanner from './usage-limit-banner';

export function AppBanners() {
  const [billing, setBilling] = useState<{
    trialEndsAt: string | null;
    plan: string | null;
    usage: number;
    limit: number | 'unlimited';
    minuteUsage: number;
    minuteLimit: number | 'unlimited';
  }>({ trialEndsAt: null, plan: null, usage: 0, limit: 5, minuteUsage: 0, minuteLimit: 300 });

  useEffect(() => {
    fetch('/api/billing')
      .then(r => r.json())
      .then(d => {
        setBilling({
          trialEndsAt: d.trialEndsAt ?? null,
          plan: d.plan ?? null,
          usage: typeof d.usage === 'number' ? d.usage : 0,
          limit: d.limit !== undefined ? d.limit : 5,
          minuteUsage: typeof d.minuteUsage === 'number' ? d.minuteUsage : 0,
          minuteLimit: d.minuteLimit !== undefined ? d.minuteLimit : 300,
        });
      })
      .catch(() => {});
  }, []);

  return (
    // ponytail: each banner returns null when there's nothing to show (no trial, paid plan, under limits). The previous `min-h-[40px]` wrappers preserved space for absent banners and added ~120px of dead vertical space above every page header on every app page.
    <>
      <TrialBanner trialEndsAt={billing.trialEndsAt} />
      <FreePlanBanner plan={billing.plan} />
      <UsageLimitBanner
        plan={billing.plan}
        usage={billing.usage}
        limit={billing.limit}
        minuteUsage={billing.minuteUsage}
        minuteLimit={billing.minuteLimit}
      />
    </>
  );
}
