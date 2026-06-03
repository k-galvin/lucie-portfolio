import { describe, it, expect } from 'vitest';
import { normalizeSubjects, formatStatus, formatDimensions, splitBioParagraphs } from '../lib/utils';

describe('normalizeSubjects', () => {
  it('should handle empty or undefined inputs', () => {
    expect(normalizeSubjects(undefined)).toEqual([]);
    expect(normalizeSubjects(null)).toEqual([]);
    expect(normalizeSubjects('')).toEqual([]);
    expect(normalizeSubjects([])).toEqual([]);
  });

  it('should normalize single legacy string values', () => {
    expect(normalizeSubjects('boat')).toEqual(['boats']);
    expect(normalizeSubjects('ocean')).toEqual(['water']);
    expect(normalizeSubjects('garden')).toEqual(['gardens']);
    expect(normalizeSubjects('people')).toEqual(['people']);
    expect(normalizeSubjects('beach')).toEqual(['beach']);
  });

  it('should handle casing and whitespace in string inputs', () => {
    expect(normalizeSubjects('  BOAT  ')).toEqual(['boats']);
    expect(normalizeSubjects('Ocean')).toEqual(['water']);
  });

  it('should clean and normalize array inputs', () => {
    expect(normalizeSubjects(['gardens', 'water'])).toEqual(['gardens', 'water']);
    expect(normalizeSubjects(['boat', 'OCEAN'])).toEqual(['boat', 'ocean']); // clean inputs but maintain values
    expect(normalizeSubjects(['   ', 'people', ''])).toEqual(['people']);
  });
});

describe('formatStatus', () => {
  it('should format private collection statuses correctly', () => {
    expect(formatStatus('Private Collection')).toBe('In private collection');
    expect(formatStatus('in private collection')).toBe('In private collection');
  });

  it('should format on exhibition status correctly', () => {
    expect(formatStatus('On Exhibition')).toBe('On exhibition');
    expect(formatStatus('on exhibition')).toBe('On exhibition');
  });

  it('should return empty string for other inputs or empty values', () => {
    expect(formatStatus('')).toBe('');
    expect(formatStatus('Available')).toBe('');
    expect(formatStatus('Sold')).toBe('');
  });
});

describe('formatDimensions', () => {
  it('should format dimensions with integers and floats', () => {
    expect(formatDimensions(20, 30, 'in')).toBe('20 × 30 in');
    expect(formatDimensions(15.5, 24, 'cm')).toBe('15.5 × 24 cm');
  });

  it('should handle numeric string inputs', () => {
    expect(formatDimensions('18', '24', 'in')).toBe('18 × 24 in');
  });

  it('should handle empty or invalid dimensions gracefully', () => {
    expect(formatDimensions(NaN, 10, 'in')).toBe('');
    expect(formatDimensions('invalid', '10', 'in')).toBe('');
  });
});

describe('splitBioParagraphs', () => {
  it('should return empty array for empty inputs', () => {
    expect(splitBioParagraphs('')).toEqual([]);
    expect(splitBioParagraphs(null as any)).toEqual([]);
  });

  it('should split biography text correctly by double newlines', () => {
    const text = 'First paragraph.\n\nSecond paragraph.\n\n\nThird paragraph.';
    expect(splitBioParagraphs(text)).toEqual([
      'First paragraph.',
      'Second paragraph.',
      'Third paragraph.'
    ]);
  });

  it('should ignore single newlines within paragraphs', () => {
    const text = 'Line one.\nLine two.\n\nParagraph two.';
    expect(splitBioParagraphs(text)).toEqual([
      'Line one.\nLine two.',
      'Paragraph two.'
    ]);
  });
});
