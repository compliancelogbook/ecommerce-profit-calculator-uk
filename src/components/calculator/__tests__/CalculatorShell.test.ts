import { readFileSync } from 'fs';
import { join } from 'path';
import { describe, expect, it } from 'vitest';

// CalculatorShell is a "use client" component that calls usePathname() and
// useState() — it cannot be imported/called directly in Vitest the way the
// hook-free page.tsx Server Components are (see
// src/app/__tests__/react-tree-helpers.ts and
// src/app/__tests__/route-content-consistency.test.ts for that technique,
// and why it does not apply here). So, like the layout.tsx/globals.css
// scroll-behavior check, this reads the component's source text directly
// and asserts on the specific patterns that make up its active-tab
// treatment, rather than rendering anything.
const source = readFileSync(join(__dirname, '../CalculatorShell.tsx'), 'utf8');

// Isolate the tabClassName template literal so assertions can't accidentally
// match unrelated font-weight/aria usage elsewhere in this large file.
const tabClassNameMatch = source.match(/const tabClassName = `([\s\S]*?)`;/);
if (!tabClassNameMatch) {
  throw new Error('Could not locate the tabClassName template literal in CalculatorShell.tsx — has the tab switcher been restructured?');
}
const tabClassNameSource = tabClassNameMatch[1];

describe('CalculatorShell tab switcher — active-tab text treatment', () => {
  it('applies font-semibold (not font-medium) to the active tab', () => {
    // Matches the isActive branch of the ternary specifically: text-white
    // together with font-semibold, both inside the same branch.
    expect(tabClassNameSource).toMatch(/tab\.isActive\s*\?\s*'text-white font-semibold'/);
  });

  it('applies font-medium (not font-semibold) to inactive tabs', () => {
    expect(tabClassNameSource).toMatch(/:\s*'text-\[#888\] font-medium hover:text-\[#eaeaea\]'/);
  });

  it('does not apply font-medium unconditionally to every tab (the bug this fix corrects: text-white alone changes colour, not weight)', () => {
    // The static prefix of the template literal (everything before the
    // ternary) must not itself contain a bare font-medium — otherwise every
    // tab, active or not, would render at the same weight regardless of the
    // conditional classes below, exactly reproducing the reported defect.
    const staticPrefix = tabClassNameSource.split('${')[0];
    expect(staticPrefix).not.toMatch(/font-medium/);
    expect(staticPrefix).not.toMatch(/font-semibold/);
  });

  it('retains aria-current on dedicated-route <Link> tabs', () => {
    expect(source).toMatch(/<Link key=\{tab\.platform\} href=\{tab\.href\} aria-current=\{tab\.ariaCurrent\}/);
  });

  it('adds aria-pressed to the homepage\'s local-state <button> tabs, reflecting tab.isActive', () => {
    // The <button> branch (href === null, local-state mode) has no
    // navigation state for aria-current to describe, so aria-pressed is the
    // correct assistive-tech signal for a toggle-style selected control.
    const buttonBlockMatch = source.match(/return \(\s*<button[\s\S]*?<\/button>\s*\);/);
    expect(buttonBlockMatch).not.toBeNull();
    expect(buttonBlockMatch![0]).toMatch(/aria-pressed=\{tab\.isActive\}/);
  });

  it('does not reintroduce the removed underline/glow indicator (layoutId="activeTab")', () => {
    expect(source).not.toMatch(/layoutId=["']activeTab["']/);
    expect(source).not.toMatch(/activeIndicator/);
  });
});
