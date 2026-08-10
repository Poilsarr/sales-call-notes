type CheckLevel = "required" | "optional";

type EnvGroup = {
  name: string;
  description: string;
  vars: Array<{ key: string; level: CheckLevel; description?: string }>;
};

import { config } from 'dotenv';

export const ENV_GROUPS: readonly EnvGroup[] = [
  {
    name: "Core",
    description: "Application runtime",
    vars: [
      { key: "DATABASE_URL", level: "required", description: "PostgreSQL connection string" },
      { key: "NEXT_PUBLIC_APP_URL", level: "required", description: "Public app URL" },
      { key: "NODE_ENV", level: "optional" },
    ],
  },
  {
    name: "Auth (Clerk)",
    description: "Session management",
    vars: [
      { key: "NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY", level: "required" },
      { key: "CLERK_SECRET_KEY", level: "required" },
      { key: "CLERK_WEBHOOK_SECRET", level: "optional" },
    ],
  },
  {
    name: "AI",
    description: "Model providers",
    vars: [
      { key: "OPENAI_API_KEY", level: "required" },
      { key: "GROQ_API_KEY", level: "required" },
      { key: "HF_TOKEN", level: "optional" },
    ],
  },
  {
    name: "HubSpot",
    description: "CRM sync",
    vars: [
      { key: "HUBSPOT_CLIENT_ID", level: "required" },
      { key: "HUBSPOT_CLIENT_SECRET", level: "required" },
      { key: "HUBSPOT_REDIRECT_URI", level: "optional" },
    ],
  },
  {
    name: "Salesforce",
    description: "CRM sync",
    vars: [
      { key: "SALESFORCE_CLIENT_ID", level: "required" },
      { key: "SALESFORCE_CLIENT_SECRET", level: "required" },
      { key: "SALESFORCE_REDIRECT_URI", level: "optional" },
      { key: "SALESFORCE_LOGIN_URL", level: "optional" },
    ],
  },
  {
    name: "Microsoft Teams",
    description: "Calendar + tasks",
    vars: [
      { key: "TEAMS_CLIENT_ID", level: "required" },
      { key: "TEAMS_CLIENT_SECRET", level: "required" },
      { key: "TEAMS_REDIRECT_URI", level: "optional" },
      { key: "MICROSOFT_TENANT_ID", level: "optional" },
    ],
  },
  {
    name: "Google (Calendar)",
    description: "OAuth client",
    vars: [
      { key: "GOOGLE_CLIENT_ID", level: "required" },
      { key: "GOOGLE_CLIENT_SECRET", level: "required" },
      { key: "GOOGLE_REDIRECT_URI", level: "optional", description: "Defaults to /api/integrations/google/callback" },
    ],
  },
  {
    name: "Slack",
    description: "Outgoing notifications + OAuth + commands",
    vars: [
      { key: "SLACK_CLIENT_ID", level: "optional", description: "OAuth" },
      { key: "SLACK_CLIENT_SECRET", level: "optional", description: "OAuth" },
      { key: "SLACK_SIGNING_SECRET", level: "optional", description: "Slash commands" },
      { key: "SLACK_WEBHOOK_URL", level: "optional", description: "Legacy fallback" },
      { key: "SLACK_REDIRECT_URI", level: "optional" },
    ],
  },
  {
    name: "Integrations Security",
    description: "At-rest encryption of OAuth tokens",
    vars: [
      { key: "ENCRYPTION_KEY", level: "optional", description: "32-byte base64 key (openssl rand -base64 32); absent = plaintext tokens" },
    ],
  },
  {
    name: "Cron",
    description: "Scheduled jobs",
    vars: [
      { key: "CRON_SECRET", level: "optional" },
    ],
  },
  {
    name: "Upstash Redis",
    description: "Rate limit + BullMQ",
    vars: [
      { key: "UPSTASH_REDIS_REST_URL", level: "required" },
      { key: "UPSTASH_REDIS_REST_TOKEN", level: "required" },
    ],
  },
  {
    name: "Paddle",
    description: "Billing",
    vars: [
      { key: "PADDLE_API_KEY", level: "required" },
      { key: "NEXT_PUBLIC_PADDLE_CLIENT_KEY", level: "required" },
      { key: "PADDLE_WEBHOOK_SECRET", level: "required" },
    ],
  },
  {
    name: "Sentry",
    description: "Error monitoring (optional)",
    vars: [
      { key: "NEXT_PUBLIC_SENTRY_DSN", level: "optional" },
      { key: "SENTRY_AUTH_TOKEN", level: "optional" },
      { key: "SENTRY_ORG", level: "optional" },
      { key: "SENTRY_PROJECT", level: "optional" },
    ],
  },
];

export type CheckResult = {
  group: string;
  key: string;
  level: CheckLevel;
  status: "set" | "missing";
  description?: string;
};

export type CheckSummary = {
  results: CheckResult[];
  requiredSet: number;
  requiredMissing: number;
  optionalSet: number;
  optionalMissing: number;
  ok: boolean;
};

export function checkEnv(env: NodeJS.ProcessEnv = process.env): CheckSummary {
  const results: CheckResult[] = [];
  let requiredSet = 0;
  let requiredMissing = 0;
  let optionalSet = 0;
  let optionalMissing = 0;

  for (const group of ENV_GROUPS) {
    for (const v of group.vars) {
      const value = env[v.key];
      const isSet = typeof value === "string" && value.trim().length > 0;
      const status: CheckResult["status"] = isSet ? "set" : "missing";
      results.push({
        group: group.name,
        key: v.key,
        level: v.level,
        status,
        description: v.description,
      });
      if (v.level === "required") {
        if (isSet) requiredSet += 1;
        else requiredMissing += 1;
      } else if (isSet) {
        optionalSet += 1;
      } else {
        optionalMissing += 1;
      }
    }
  }

  return {
    results,
    requiredSet,
    requiredMissing,
    optionalSet,
    optionalMissing,
    ok: requiredMissing === 0,
  };
}

const COLOR = {
  reset: "\x1b[0m",
  bold: "\x1b[1m",
  dim: "\x1b[2m",
  red: "\x1b[31m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  cyan: "\x1b[36m",
} as const;

const SYMBOL = {
  set: "[OK]",
  missing: "[--]",
  optionalSet: "[..]",
  optionalMissing: "[  ]",
} as const;

function supportsColor(): boolean {
  if (process.env.NO_COLOR) return false;
  if (process.env.FORCE_COLOR === "1") return true;
  return Boolean(process.stdout.isTTY);
}

function paint(s: string, code: string, enabled: boolean): string {
  if (!enabled) return s;
  return `${code}${s}${COLOR.reset}`;
}

function formatRow(result: CheckResult, color: boolean): string {
  const isRequired = result.level === "required";
  let symbol: string;
  let label: string;
  if (result.status === "set") {
    symbol = SYMBOL.set;
    label = paint("set", COLOR.green, color);
  } else if (isRequired) {
    symbol = SYMBOL.missing;
    label = paint("missing", COLOR.red, color);
  } else {
    symbol = SYMBOL.optionalMissing;
    label = paint("optional", COLOR.yellow, color);
  }
  const key = result.key.padEnd(38);
  const lvl = isRequired ? "req " : "opt ";
  return `  ${symbol} ${key} ${lvl} ${label}`;
}

export function formatReport(summary: CheckSummary, opts: { color?: boolean } = {}): string {
  const color = opts.color ?? supportsColor();
  const lines: string[] = [];

  const banner = paint("Gauge - environment check", `${COLOR.bold}${COLOR.cyan}`, color);
  lines.push(banner);
  lines.push("");

  let currentGroup = "";
  for (const r of summary.results) {
    if (r.group !== currentGroup) {
      currentGroup = r.group;
      lines.push("");
      lines.push(paint(currentGroup, `${COLOR.bold}${COLOR.blue}`, color));
    }
    lines.push(formatRow(r, color));
  }

  lines.push("");
  lines.push(paint("Summary", `${COLOR.bold}${COLOR.cyan}`, color));
  lines.push(
    `  required: ${paint(`${summary.requiredSet} set`, COLOR.green, color)}, ` +
      paint(`${summary.requiredMissing} missing`, COLOR.red, color),
  );
  lines.push(
    `  optional: ${paint(`${summary.optionalSet} set`, COLOR.green, color)}, ` +
      paint(`${summary.optionalMissing} unset`, COLOR.yellow, color),
  );

  if (summary.ok) {
    lines.push("");
    lines.push(paint("All required env vars are set.", `${COLOR.bold}${COLOR.green}`, color));
  } else {
    lines.push("");
    lines.push(
      paint(
        `${summary.requiredMissing} required env var(s) missing. ` +
          "See .env.example for the full list.",
        `${COLOR.bold}${COLOR.red}`,
        color,
      ),
    );
  }

  return lines.join("\n") + "\n";
}

function main(): number {
  config({ path: '.env.local' });
  const summary = checkEnv();
  process.stdout.write(formatReport(summary));
  return summary.ok ? 0 : 1;
}

if (require.main === module) {
  process.exit(main());
}
