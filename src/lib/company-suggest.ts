/**
 * Company name suggestion from Clerk email domain.
 * Never auto-saves — returns a chip string or null.
 * Generic freemail domains are skipped.
 */

export const GENERIC_EMAIL_DOMAINS = new Set<string>([
  "gmail.com",
  "googlemail.com",
  "yahoo.com",
  "yahoo.co.uk",
  "yahoo.fr",
  "outlook.com",
  "outlook.co.uk",
  "hotmail.com",
  "hotmail.co.uk",
  "hotmail.fr",
  "live.com",
  "msn.com",
  "icloud.com",
  "me.com",
  "mac.com",
  "proton.me",
  "protonmail.com",
  "protonmail.ch",
  "pm.me",
  "aol.com",
  "gmx.com",
  "gmx.de",
  "yandex.com",
  "yandex.ru",
  "zoho.com",
  "hey.com",
  "fastmail.com",
  "tutanota.com",
  "tutanota.de",
  "mail.com",
  "inbox.com",
  "mail.ru",
]);

export function isGenericEmailDomain(domain: string): boolean {
  const d = domain.trim().toLowerCase();
  return GENERIC_EMAIL_DOMAINS.has(d);
}

export function titleCaseCompanyName(input: string): string {
  const cleaned = input
    .trim()
    .replace(/[-_]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  if (!cleaned) return "";
  return cleaned
    .split(" ")
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(" ");
}

/**
 * Suggest a company name from an email address.
 * E.g., "sarah@smith-associates.com" → "Smith Associates"
 * Returns null for generic domains or invalid email.
 */
export function suggestCompanyFromEmail(email: string | null | undefined): string | null {
  if (!email || typeof email !== "string") return null;
  const trimmed = email.trim();
  const atIdx = trimmed.lastIndexOf("@");
  if (atIdx === -1 || atIdx === trimmed.length - 1) return null;
  const domain = trimmed.slice(atIdx + 1).trim().toLowerCase();
  if (!domain || !domain.includes(".")) return null;
  if (isGenericEmailDomain(domain)) return null;
  // Also check base domain without subdomain? e.g., mail.gmail.com → gmail.com
  // If domain ends with generic, treat as generic.
  for (const generic of GENERIC_EMAIL_DOMAINS) {
    if (domain === generic || domain.endsWith(`.${generic}`)) return null;
  }
  const firstLabel = domain.split(".")[0];
  if (!firstLabel) return null;
  const suggestion = titleCaseCompanyName(firstLabel);
  if (!suggestion) return null;
  if (suggestion.length > 120) return suggestion.slice(0, 120).trim();
  return suggestion;
}

/**
 * Alias for backwards compat / plan reference.
 */
export const suggestCompanyName = suggestCompanyFromEmail;
