import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const root = process.cwd();

describe('support chatbot mounting', () => {
  it('is mounted in the root layout (visible on every page)', () => {
    const layout = readFileSync(join(root, 'src/app/layout.tsx'), 'utf8');
    expect(layout).toContain('SupportChatbot');
    expect(layout).toMatch(/<SupportChatbot\s*\/>/);
  });

  it('widget is fixed bottom-right (stays intact, no scroll needed)', () => {
    const widget = readFileSync(join(root, 'src/components/support-chatbot.tsx'), 'utf8');
    // Launcher button — lifted on mobile to clear sticky CTA pills, corner on sm+
    expect(widget).toContain('fixed bottom-20 right-4 sm:bottom-5 sm:right-5');
    // Chat panel
    expect(widget).toContain('fixed bottom-24 right-4');
    // High z-index so it sits above content (incl. sticky pills at z-70)
    expect(widget).toContain('z-[90]');
  });
});
