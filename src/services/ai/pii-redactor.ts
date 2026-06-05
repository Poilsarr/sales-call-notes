import { spawn } from 'child_process';
import path from 'path';
import os from 'os';

export class PIIRedactorService {
  private patterns = {
    email: /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g,
    phone: /(\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/g,
    creditCard: /\b(?:\d{4}[-\s]?){3}\d{4}\b/g,
    ssn: /\b\d{3}-\d{2}-\d{4}\b/g,
  };

  async redact(text: string): Promise<{ redactedText: string; replacements: Array<{ original: string; replacement: string; type: string }> }> {
    try {
      // Use absolute path for script to avoid process.cwd() fragility
      const scriptPath = path.resolve(process.cwd(), 'src/services/ai/scripts/redact_pii.py');

      const result = await new Promise<{ stdout: string; stderr: string }>((resolve, reject) => {
        const pyProcess = spawn('python3', [scriptPath]);
        let stdoutData = '';
        let stderrData = '';

        pyProcess.stdout.on('data', (data) => { stdoutData += data; });
        pyProcess.stderr.on('data', (data) => { stderrData += data; });

        pyProcess.on('close', (code) => {
          if (code === 0) resolve({ stdout: stdoutData, stderr: stderrData });
          else reject(new Error(`Python process exited with code ${code}: ${stderrData}`));
        });

        pyProcess.on('error', (err) => reject(err));

        // Pipe text to stdin to prevent shell injection and arg length limits
        pyProcess.stdin.write(text);
        pyProcess.stdin.end();
      });

      const parsed = JSON.parse(result.stdout);

      if (parsed.error) throw new Error(parsed.error);

      return {
        redactedText: parsed.redactedText,
        replacements: parsed.replacements,
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
