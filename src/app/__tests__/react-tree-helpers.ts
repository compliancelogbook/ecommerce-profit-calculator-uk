// Deliberately not a *.test.ts file — a small shared helper imported BY
// tests, not a test itself.
//
// Every page.tsx in this app is a plain, synchronous, hook-free Server
// Component: `export default function X() { return (<div>...</div>); }`.
// Calling that function directly (never via ReactDOM/a renderer) returns a
// plain, inert tree of objects — JSX compiles to React.createElement calls,
// and constructing an element never invokes the function it names as
// `.type`. That means this file can walk the returned tree to find e.g. the
// <CalculatorShell> node and read its props, or the <h1> node and read its
// text, WITHOUT rendering anything and WITHOUT adding a DOM/testing-library
// dependency this codebase doesn't otherwise need. It must never be used to
// call a hook-using component itself (e.g. CalculatorShell) — only to
// inspect elements that already exist as data in a hook-free tree.

import type { ReactElement, ReactNode } from 'react';

type AnyElement = ReactElement<Record<string, unknown>>;

function isElement(node: unknown): node is AnyElement {
  return typeof node === 'object' && node !== null && 'type' in node && 'props' in node;
}

function childrenOf(node: AnyElement): ReactNode {
  return node.props.children as ReactNode;
}

/** Depth-first search for every element whose `type` === `target` (a component function reference, or a DOM tag string like 'h1'). */
export function findAll(root: ReactNode, target: unknown): AnyElement[] {
  const results: AnyElement[] = [];
  function visit(node: ReactNode): void {
    if (Array.isArray(node)) {
      node.forEach(visit);
      return;
    }
    if (!isElement(node)) return;
    if (node.type === target) results.push(node);
    const children = childrenOf(node);
    if (children !== undefined) visit(children);
  }
  visit(root);
  return results;
}

export function findFirst(root: ReactNode, target: unknown): AnyElement | undefined {
  return findAll(root, target)[0];
}

/** Concatenated text content of an element's descendant string/number children — enough to read a plain <h1>Some Text</h1>. */
export function textContentOf(node: AnyElement | undefined): string {
  if (!node) return '';
  const parts: string[] = [];
  function visit(n: ReactNode): void {
    if (n === null || n === undefined || typeof n === 'boolean') return;
    if (typeof n === 'string' || typeof n === 'number') {
      parts.push(String(n));
      return;
    }
    if (Array.isArray(n)) {
      n.forEach(visit);
      return;
    }
    if (isElement(n)) {
      const children = childrenOf(n);
      if (children !== undefined) visit(children);
    }
  }
  visit(childrenOf(node));
  return parts.join('');
}
