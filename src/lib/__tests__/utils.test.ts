import { describe, expect, it } from 'vitest';
import { cleanSlug, cn, formatDate, formatSlug, readingTime } from '../utils';

describe('cn', () => {
  it('merges class names and resolves Tailwind conflicts', () => {
    expect(cn('px-2 py-1', 'px-4')).toBe('py-1 px-4');
  });

  it('drops falsy values', () => {
    expect(cn('text-sm', false, undefined, null, 'font-bold')).toBe('text-sm font-bold');
  });
});

describe('formatDate', () => {
  it('formats a date as MM/DD/YYYY', () => {
    expect(formatDate(new Date('2024-06-04T00:00:00Z'))).toBe('06/04/2024');
  });
});

describe('readingTime', () => {
  it('returns "0 min read" for undefined input', () => {
    expect(readingTime(undefined)).toBe('0 min read');
  });

  it('strips HTML tags before counting words', () => {
    const html = '<p>one</p><p>two three</p>';
    expect(readingTime(html)).toBe(readingTime('one two three'));
  });

  it('rounds up to the nearest minute, with a 1-minute baseline', () => {
    const words = Array(200).fill('word').join(' ');
    expect(readingTime(words)).toBe('2 min read');
  });
});

describe('formatSlug', () => {
  it('strips /index.md from the id', () => {
    expect(formatSlug('it/post-00001/index.md')).toBe('it/post-00001');
  });

  it('strips /index.mdx from the id', () => {
    expect(formatSlug('en/post-00002/index.mdx')).toBe('en/post-00002');
  });

  it('strips a bare .md extension', () => {
    expect(formatSlug('it/post-00003.md')).toBe('it/post-00003');
  });
});

describe('cleanSlug', () => {
  it('strips the language prefix and file extension', () => {
    expect(cleanSlug('it/post-00001/index.md')).toBe('post-00001');
    expect(cleanSlug('en/post-00002/index.md')).toBe('post-00002');
  });

  it('leaves ids without a language prefix untouched (besides extension)', () => {
    expect(cleanSlug('post-00003/index.md')).toBe('post-00003');
  });
});
