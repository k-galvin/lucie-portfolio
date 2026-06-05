import { describe, it, expect, afterEach } from 'vitest';
import { normalizeSubjects, formatStatus, formatDimensions, splitBioParagraphs, parseMarkdownLinks, sortArtworks, type SortableArtwork, getOptimizedImageUrl } from '../lib/utils';

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

describe('parseMarkdownLinks', () => {
  it('should return empty string for empty inputs', () => {
    expect(parseMarkdownLinks('')).toBe('');
    expect(parseMarkdownLinks(null as any)).toBe('');
  });

  it('should parse simple markdown links into HTML anchors', () => {
    const input = 'Check out [Saatchi Art](https://saatchi.com/123) for details.';
    expect(parseMarkdownLinks(input)).toBe(
      'Check out <a href="https://saatchi.com/123" target="_blank" rel="noopener noreferrer">Saatchi Art</a> for details.'
    );
  });

  it('should parse multiple markdown links in one text block', () => {
    const input = 'Read [Bio](https://bio.com) or [Store](https://store.com).';
    expect(parseMarkdownLinks(input)).toBe(
      'Read <a href="https://bio.com" target="_blank" rel="noopener noreferrer">Bio</a> or <a href="https://store.com" target="_blank" rel="noopener noreferrer">Store</a>.'
    );
  });

  it('should leave normal text unchanged', () => {
    expect(parseMarkdownLinks('Normal biography text with no links.')).toBe(
      'Normal biography text with no links.'
    );
  });
});

describe('sortArtworks', () => {
  const mockArtworks: SortableArtwork[] = [
    { title: 'Zebra', year: 2024, order: 20, createdAt: '2026-06-01T12:00:00Z' },
    { title: 'Apple', year: 2023, order: 10, createdAt: '2026-06-03T12:00:00Z' },
    { title: 'Banana', year: 2025, order: 30, createdAt: '2026-06-02T12:00:00Z' }
  ];

  it('should sort by title alphabetically (title-asc)', () => {
    const items = [...mockArtworks];
    sortArtworks(items, 'title-asc');
    expect(items.map(i => i.title)).toEqual(['Apple', 'Banana', 'Zebra']);
  });

  it('should sort by added oldest to newest (oldest)', () => {
    const items = [...mockArtworks];
    sortArtworks(items, 'oldest');
    expect(items.map(i => i.title)).toEqual(['Zebra', 'Banana', 'Apple']);
  });

  it('should sort by added newest to oldest (newest)', () => {
    const items = [...mockArtworks];
    sortArtworks(items, 'newest');
    expect(items.map(i => i.title)).toEqual(['Apple', 'Banana', 'Zebra']);
  });

  it('should sort by custom order (custom / default)', () => {
    const items = [...mockArtworks];
    sortArtworks(items, 'custom');
    expect(items.map(i => i.title)).toEqual(['Apple', 'Zebra', 'Banana']);
  });

  it('should fall back to order when createdAt is missing for oldest/newest', () => {
    const legacyArtworks: SortableArtwork[] = [
      { title: 'Old Legacy', year: 2022, order: 5 },
      { title: 'New Legacy', year: 2022, order: 15 }
    ];

    const oldestItems = [...legacyArtworks];
    sortArtworks(oldestItems, 'oldest');
    expect(oldestItems.map(i => i.title)).toEqual(['Old Legacy', 'New Legacy']);

    const newestItems = [...legacyArtworks];
    sortArtworks(newestItems, 'newest');
    expect(newestItems.map(i => i.title)).toEqual(['New Legacy', 'Old Legacy']);
  });
});

describe('getOptimizedImageUrl', () => {
  const originalEndpoint = import.meta.env.PUBLIC_IMAGEKIT_URL_ENDPOINT;

  afterEach(() => {
    // Restore original environment variable
    import.meta.env.PUBLIC_IMAGEKIT_URL_ENDPOINT = originalEndpoint;
  });

  it('should return empty string for empty inputs', () => {
    expect(getOptimizedImageUrl('')).toBe('');
    expect(getOptimizedImageUrl(null as any)).toBe('');
  });

  it('should return original URL if it is not a Firebase Storage URL', () => {
    const localPath = '/images/process_1.webp';
    const externalUrl = 'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119';
    expect(getOptimizedImageUrl(localPath)).toBe(localPath);
    expect(getOptimizedImageUrl(externalUrl)).toBe(externalUrl);
  });

  it('should return original URL if PUBLIC_IMAGEKIT_URL_ENDPOINT is not configured', () => {
    import.meta.env.PUBLIC_IMAGEKIT_URL_ENDPOINT = '';
    const firebaseUrl = 'https://firebasestorage.googleapis.com/v0/b/bucket/o/artwork%2Fart.webp?alt=media&token=123';
    expect(getOptimizedImageUrl(firebaseUrl)).toBe(firebaseUrl);
  });

  it('should map Firebase Storage URL to ImageKit URL and apply format auto', () => {
    import.meta.env.PUBLIC_IMAGEKIT_URL_ENDPOINT = 'https://ik.imagekit.io/test-id/';
    const firebaseUrl = 'https://firebasestorage.googleapis.com/v0/b/bucket/o/artwork%2Fart.webp?alt=media&token=123';
    const expected = 'https://ik.imagekit.io/test-id/v0/b/bucket/o/artwork%2Fart.webp?alt=media&token=123&tr=f-auto';
    expect(getOptimizedImageUrl(firebaseUrl)).toBe(expected);
  });

  it('should apply custom width transformation when width parameter is provided', () => {
    import.meta.env.PUBLIC_IMAGEKIT_URL_ENDPOINT = 'https://ik.imagekit.io/test-id';
    const firebaseUrl = 'https://firebasestorage.googleapis.com/v0/b/bucket/o/artwork%2Fart.webp?alt=media&token=123';
    const expected = 'https://ik.imagekit.io/test-id/v0/b/bucket/o/artwork%2Fart.webp?alt=media&token=123&tr=f-auto,w-800';
    expect(getOptimizedImageUrl(firebaseUrl, 800)).toBe(expected);
  });
});

