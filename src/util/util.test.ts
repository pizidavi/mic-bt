import { describe, expect, it } from 'vitest';

import { clx, sleep } from '@/util/util';

describe('clx', () => {
  it('merges conflicting tailwind classes', () => {
    expect(clx('text-h1', 'text-h2')).toBe('text-h2');
  });

  it('filters out falsy values', () => {
    const disabled = false;
    expect(clx('px-2', disabled && 'p-4', '')).toBe('px-2');
  });
});

describe('sleep', () => {
  it('resolves after the given delay', async () => {
    await expect(sleep(10)).resolves.toBeUndefined();
  });
});
