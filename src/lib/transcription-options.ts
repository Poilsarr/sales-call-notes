const BASE_TRANSCRIPTION_PROMPT = `This is a sales enrollment call. A representative is enrolling a customer in an energy or insurance plan.
Pay special attention to: customer names, addresses, account numbers, utility company names, plan names, rates/prices, phone numbers, email addresses, dates.
Spell out numbers clearly.`;

const FILLER_REMOVAL_PROMPT =
  'CRITICAL: Remove filler words (um, ah, uh, like, you know) and stuttering. Ensure the transcript is clean, professional, and reads like a polished record of the conversation.';

export function parseRemoveFillers(rawValue: FormDataEntryValue | null): boolean {
  if (typeof rawValue !== 'string') return true;

  const normalized = rawValue.trim().toLowerCase();
  if (!normalized) return true;

  return normalized !== 'false';
}

export function buildTranscriptionPrompt(removeFillers = true): string {
  return removeFillers
    ? `${BASE_TRANSCRIPTION_PROMPT}\n${FILLER_REMOVAL_PROMPT}`
    : BASE_TRANSCRIPTION_PROMPT;
}
