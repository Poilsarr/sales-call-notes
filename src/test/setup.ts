import "@testing-library/jest-dom";

// The GDPR export token HMAC needs a secret. The prod runtime reads
// EXPORT_TOKEN_SECRET from Vercel env; in CI the same env var is set
// per the new "Write CI .env" step. For local `npx vitest run`, fall
// back to a deterministic test-only value so the gdpr-token tests
// pass on a fresh checkout. The constant is intentionally a throwaway
// — never used in production.
if (!process.env.EXPORT_TOKEN_SECRET) {
  process.env.EXPORT_TOKEN_SECRET = "test-only-export-token-secret-32-chars-minimum";
}
