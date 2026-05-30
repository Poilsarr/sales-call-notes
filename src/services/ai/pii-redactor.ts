import { execFile } from 'child_process';
import { promisify } from 'util';
import path from 'path';
import os from 'os';

const execFilePromise = promisify(execFile);

export class PIIRedactorService {
  private patterns = {
    email: /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g,
    phone: /(\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/g,
    creditCard: /\b(?:\d{4}[-\s]?){3}\d{4}\b/g,
    ssn: /\b\d{3}-\d{2}-\d{4}\b/g,
  };

  async redact(text: string): Promise<{ redactedText: string; replacements: Array<{ original: string; replacement: string; type: string }> }> {
    try {
      // Attempt ML-based redaction via Python script
      const scriptPath = path.join(process.cwd(), 'src/services/ai/scripts/redact_pii.py');

      // Sanitize text for shell argument passing (simple escape)
      const sanitizedText = text.replace(/"/g, '\\"');

      const { stdout } = await execFilePromise('python3', [scriptPath, sanitizedText]);
      const result = JSON.parse(stdout);

      if (result.error) throw new Error(result.error);

      return {
        redactedText: result.redactedText,
        replacements: result.replacements,
      };
    } catch (e) {
      console.log(`ML PII redaction failed, falling back to regex: ${e}`);
      return this.redactRegex(text);
    }
  }

  private redactRegex(text: string): { redactedText: string; replacements: Array<{ original: string; replacement: string; type: string }> } {
    let redactedText = text;
    const replacements: Array<{ original: string; replacement: string; type: string }> = [];

    for (const [type, pattern] of Object.entries(this.patterns)) {
      const matches = text.match(pattern);
      if (matches) {
        matches.forEach(match => {
          const replacement = `[${type.toUpperCase()}]`;
          redactedText = redactedText.replace(match, replacement);
          replacements.push({ original: match, replacement, type });
        });
      }
    }

    return { redactedText, replacements };
  }
}
