/**
 * Normalizes a subject field (which could be a legacy string or an array of strings)
 * into a standardized list of modern plural/renamed subject categories:
 * - 'boat' -> 'boats'
 * - 'ocean' -> 'water'
 * - 'garden' -> 'gardens'
 * All other subjects are lowercased and cleaned.
 */
export function normalizeSubjects(subjectInput: any): string[] {
  if (Array.isArray(subjectInput)) {
    return subjectInput
      .map(s => typeof s === 'string' ? s.trim().toLowerCase() : '')
      .filter(s => s !== '');
  }

  if (typeof subjectInput === 'string' && subjectInput) {
    let s = subjectInput.trim().toLowerCase();
    if (s === 'boat') s = 'boats';
    if (s === 'ocean') s = 'water';
    if (s === 'garden') s = 'gardens';
    return [s];
  }

  return [];
}

/**
 * Standardizes the display label for an artwork's status.
 */
export function formatStatus(statusInput: string): string {
  if (!statusInput) return '';
  const lowerStatus = statusInput.trim().toLowerCase();
  if (lowerStatus === 'private collection' || lowerStatus === 'in private collection') {
    return 'In private collection';
  }
  if (lowerStatus === 'on exhibition') {
    return 'On exhibition';
  }
  return '';
}

/**
 * Formats dimensions into a clean string representation.
 */
export function formatDimensions(width: number | string, height: number | string, unit: string): string {
  const w = typeof width === 'string' ? parseFloat(width) : width;
  const h = typeof height === 'string' ? parseFloat(height) : height;
  
  if (isNaN(w) || isNaN(h)) return '';
  return `${w} × ${h} ${unit || 'in'}`;
}

/**
 * Splits biography text into separate paragraph strings by double newlines.
 */
export function splitBioParagraphs(bioText: string): string[] {
  if (!bioText) return [];
  return bioText
    .split(/\n\s*\n/)
    .map(p => p.trim())
    .filter(p => p.length > 0);
}

/**
 * Parses markdown links [Text](URL) in a string and converts them into HTML anchor tags.
 */
export function parseMarkdownLinks(text: string): string {
  if (!text) return '';
  return text.replace(
    /\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g,
    '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>'
  );
}

/**
 * Filters artworks based on criteria.
 */
export interface FilterCriteria {
  yearVal: string;
  showVal: string;
  subjectVal: string;
  searchVal: string;
}

export interface ArtworkCardData {
  year: string;
  show: string;
  subjects: string[];
  title: string;
}

export function filterArtworks(
  artwork: ArtworkCardData,
  criteria: FilterCriteria
): boolean {
  const matchesYear = criteria.yearVal === 'all' || artwork.year === criteria.yearVal;
  const matchesShow = criteria.showVal === 'all' || artwork.show === criteria.showVal;
  const matchesSubject = criteria.subjectVal === 'all' || artwork.subjects.includes(criteria.subjectVal);
  const matchesSearch = criteria.searchVal === '' || artwork.title.toLowerCase().includes(criteria.searchVal.toLowerCase().trim());

  return matchesYear && matchesShow && matchesSubject && matchesSearch;
}

/**
 * Verifies if the print setup is valid: if isPrint is true, printLink must be non-empty.
 */
export function checkPrintLinkRequired(isPrint: boolean, printLink: string): boolean {
  if (isPrint) {
    return typeof printLink === 'string' && printLink.trim().length > 0;
  }
  return true;
}

/**
 * Validates email pattern.
 */
export function validateEmail(email: string): boolean {
  if (!email) return false;
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Checks if the contact form submission should be blocked (honeypot detection).
 */
export function shouldBlockSubmit(honeyVal: string): boolean {
  return typeof honeyVal === 'string' && honeyVal.trim().length > 0;
}

/**
 * Interface representing sorting fields required for artworks
 */
export interface SortableArtwork {
  title: string;
  year: number;
  order: number;
  createdAt?: string;
}

/**
 * Sorts artworks array in-place based on the sortBy preference.
 */
export function sortArtworks<T extends SortableArtwork>(
  artworks: T[],
  sortBy: string
): T[] {
  return artworks.sort((a, b) => {
    if (sortBy === 'title-asc') {
      return a.title.localeCompare(b.title);
    } else if (sortBy === 'oldest') {
      const timeA = a.createdAt ? new Date(a.createdAt).getTime() : (a.order ?? 0);
      const timeB = b.createdAt ? new Date(b.createdAt).getTime() : (b.order ?? 0);
      if (timeA !== timeB) return timeA - timeB;
      return (a.order ?? 0) - (b.order ?? 0);
    } else if (sortBy === 'newest') {
      const timeA = a.createdAt ? new Date(a.createdAt).getTime() : (a.order ?? 0);
      const timeB = b.createdAt ? new Date(b.createdAt).getTime() : (b.order ?? 0);
      if (timeA !== timeB) return timeB - timeA;
      return (b.order ?? 0) - (a.order ?? 0);
    } else {
      // Default / custom order
      if (a.order !== b.order) return a.order - b.order;
      return b.year - a.year;
    }
  });
}

/**
 * Formats a Firebase Storage URL into an ImageKit CDN URL with resizing options.
 * Falls back to the original Firebase URL if the ImageKit endpoint is not configured in .env.
 */
export function getOptimizedImageUrl(imageUrl: string, width?: number): string {
  if (!imageUrl) return '';

  // 1. If it's a Cloudinary URL, apply Cloudinary transformations
  if (imageUrl.includes('res.cloudinary.com')) {
    if (imageUrl.includes('/upload/')) {
      const transforms = ['f_auto', 'q_auto'];
      if (width) {
        transforms.push(`c_limit,w_${width}`);
      }
      return imageUrl.replace('/upload/', `/upload/${transforms.join(',')}/`);
    }
    return imageUrl;
  }

  // 2. Fallback for lingering Firebase Storage URLs (proxied via ImageKit)
  if (imageUrl.includes('firebasestorage.googleapis.com')) {
    const imageKitEndpoint = import.meta.env.PUBLIC_IMAGEKIT_URL_ENDPOINT;
    if (!imageKitEndpoint) {
      return imageUrl;
    }

    try {
      const urlParts = imageUrl.split('firebasestorage.googleapis.com');
      if (urlParts.length < 2) return imageUrl;

      let relativePath = urlParts[1];

      // Strip token query parameter to ensure persistent CDN cache keys
      relativePath = relativePath.replace(/&token=[^&]+/g, '');
      relativePath = relativePath.replace(/\?token=[^&]+/g, '?');
      relativePath = relativePath.replace(/\?&/g, '?');
      if (relativePath.endsWith('?')) {
        relativePath = relativePath.slice(0, -1);
      }

      const cleanEndpoint = imageKitEndpoint.endsWith('/') ? imageKitEndpoint.slice(0, -1) : imageKitEndpoint;
      const cleanPath = relativePath.startsWith('/') ? relativePath : '/' + relativePath;

      let optimizedUrl = cleanEndpoint + cleanPath;

      const transforms: string[] = ['f-auto'];
      if (width) {
        transforms.push(`w-${width}`);
      }

      optimizedUrl += `&tr=${transforms.join(',')}`;

      return optimizedUrl;
    } catch (e) {
      console.warn('Failed to parse Firebase Storage URL for ImageKit optimization:', e);
      return imageUrl;
    }
  }

  // 3. Return other external/local/relative URLs as-is
  return imageUrl;
}



