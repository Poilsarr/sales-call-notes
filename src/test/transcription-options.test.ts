import { describe, expect, it } from 'vitest';

import {
  buildTranscriptionPrompt,
  parseRemoveFillers,
} from '@/lib/transcription-options';

describe('transcription options', () => {
  it('defaults filler removal to enabled when the form field is missing', () => {
    expect(parseRemoveFillers(null)).toBe(true);
  });

  it('disables filler removal when the form field is false', () => {
    expect(parseRemoveFillers('false')).toBe(false);
  });

  it('includes cleanup guidance only when filler removal is enabled', () => {
    expect(buildTranscriptionPrompt(true)).toContain('Remove filler words');
    expect(buildTranscriptionPrompt(false)).not.toContain('Remove filler words');
    expect(buildTranscriptionPrompt(false)).toContain('Pay special attention to');
  });
});
