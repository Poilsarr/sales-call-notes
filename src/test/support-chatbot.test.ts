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

  it('panel is a native dialog with stable keys (no array-index keys)', () => {
    const widget = readFileSync(join(root, 'src/components/support-chatbot.tsx'), 'utf8');
    // Native <dialog open> (non-modal: no focus trap, manual Esc close preserved)
    // with UA defaults neutralised (auto margin, 1em padding, inset-inline-start).
    expect(widget).toContain('<dialog');
    expect(widget).toContain('m-0 p-0 start-auto');
    // No bare index keys anywhere (messages use stable ids, text parts use
    // content + occurrence-count keys with no map-index reference).
    expect(widget).not.toMatch(/key=\{i\}/);
    expect(widget).not.toMatch(/parts\.map\(\(part,\s*i\)/);
  });
});
