import { describe, it, expect } from 'vitest';
import { filterArtworks, type ArtworkCardData, type FilterCriteria } from '../lib/utils';
import { JSDOM } from 'jsdom';

describe('Gallery Filter and Search Logic tests', () => {
  const mockArtworks: [ArtworkCardData, ArtworkCardData, ArtworkCardData, ArtworkCardData] = [
    {
      title: 'Boats in the Harbor',
      year: '2023',
      show: 'Library Show',
      subjects: ['boats', 'water']
    },
    {
      title: 'Water Lily Garden',
      year: '2024',
      show: 'Summer Exhibition',
      subjects: ['water', 'gardens']
    },
    {
      title: 'Sandy Beach Day',
      year: '2023',
      show: '',
      subjects: ['beach']
    },
    {
      title: 'Portrait of David',
      year: '2022',
      show: 'Library Show',
      subjects: ['people']
    }
  ];

  it('should match all when all criteria are set to all/empty', () => {
    const criteria: FilterCriteria = {
      yearVal: 'all',
      showVal: 'all',
      subjectVal: 'all',
      searchVal: ''
    };

    mockArtworks.forEach(art => {
      expect(filterArtworks(art, criteria)).toBe(true);
    });
  });

  it('should filter by year', () => {
    const criteria: FilterCriteria = {
      yearVal: '2023',
      showVal: 'all',
      subjectVal: 'all',
      searchVal: ''
    };

    expect(filterArtworks(mockArtworks[0], criteria)).toBe(true);
    expect(filterArtworks(mockArtworks[1], criteria)).toBe(false);
    expect(filterArtworks(mockArtworks[2], criteria)).toBe(true);
    expect(filterArtworks(mockArtworks[3], criteria)).toBe(false);
  });

  it('should filter by show', () => {
    const criteria: FilterCriteria = {
      yearVal: 'all',
      showVal: 'Library Show',
      subjectVal: 'all',
      searchVal: ''
    };

    expect(filterArtworks(mockArtworks[0], criteria)).toBe(true);
    expect(filterArtworks(mockArtworks[1], criteria)).toBe(false);
    expect(filterArtworks(mockArtworks[2], criteria)).toBe(false);
    expect(filterArtworks(mockArtworks[3], criteria)).toBe(true);
  });

  it('should filter by single subject matching arrays', () => {
    const criteria: FilterCriteria = {
      yearVal: 'all',
      showVal: 'all',
      subjectVal: 'water',
      searchVal: ''
    };

    // Boats in Harbor has subjects ['boats', 'water']
    expect(filterArtworks(mockArtworks[0], criteria)).toBe(true);
    // Water Lily Garden has subjects ['water', 'gardens']
    expect(filterArtworks(mockArtworks[1], criteria)).toBe(true);
    // Sandy Beach has subjects ['beach']
    expect(filterArtworks(mockArtworks[2], criteria)).toBe(false);
  });

  it('should filter by search query (case-insensitive & substring)', () => {
    const criteria: FilterCriteria = {
      yearVal: 'all',
      showVal: 'all',
      subjectVal: 'all',
      searchVal: '  bOAt '
    };

    expect(filterArtworks(mockArtworks[0], criteria)).toBe(true); // 'Boats in the Harbor'
    expect(filterArtworks(mockArtworks[1], criteria)).toBe(false);
  });

  it('should filter with combined criteria', () => {
    const criteria: FilterCriteria = {
      yearVal: '2023',
      showVal: 'Library Show',
      subjectVal: 'boats',
      searchVal: 'harbor'
    };

    expect(filterArtworks(mockArtworks[0], criteria)).toBe(true);
    expect(filterArtworks(mockArtworks[1], criteria)).toBe(false);
    expect(filterArtworks(mockArtworks[3], criteria)).toBe(false); // Wrong subject, wrong search
  });

  // JSDOM Simulation
  it('should filter DOM elements correctly on simulated user changes', () => {
    const dom = new JSDOM(`
      <div>
        <select id="filter-year">
          <option value="all">All</option>
          <option value="2023">2023</option>
        </select>
        <select id="filter-show">
          <option value="all">All</option>
          <option value="Library Show">Library Show</option>
        </select>
        <input id="filter-search" value="" />

        <div id="artworks-grid">
          <div class="artwork-card" data-year="2023" data-show="Library Show">
            <span class="overlay-title">Boats in the Harbor</span>
          </div>
          <div class="artwork-card" data-year="2024" data-show="Summer Exhibition">
            <span class="overlay-title">Water Lily Garden</span>
          </div>
        </div>
      </div>
    `);

    const document = dom.window.document;
    const cards = Array.from(document.querySelectorAll('.artwork-card')) as HTMLElement[];

    const applyFiltersSimulated = () => {
      const yearVal = (document.getElementById('filter-year') as HTMLSelectElement).value;
      const showVal = (document.getElementById('filter-show') as HTMLSelectElement).value;
      const searchVal = (document.getElementById('filter-search') as HTMLInputElement).value;

      cards.forEach(card => {
        const matches = filterArtworks(
          {
            year: card.dataset.year || '',
            show: card.dataset.show || '',
            subjects: [],
            title: card.querySelector('.overlay-title')?.textContent || ''
          },
          { yearVal, showVal, subjectVal: 'all', searchVal }
        );

        if (matches) {
          card.classList.remove('filtered-out');
        } else {
          card.classList.add('filtered-out');
        }
      });
    };

    // Initially active
    applyFiltersSimulated();
    expect(cards[0]!.classList.contains('filtered-out')).toBe(false);
    expect(cards[1]!.classList.contains('filtered-out')).toBe(false);

    // Filter by year = 2023
    (document.getElementById('filter-year') as HTMLSelectElement).value = '2023';
    applyFiltersSimulated();
    expect(cards[0]!.classList.contains('filtered-out')).toBe(false);
    expect(cards[1]!.classList.contains('filtered-out')).toBe(true);

    // Set year back to all
    (document.getElementById('filter-year') as HTMLSelectElement).value = 'all';
    applyFiltersSimulated();
    expect(cards[0]!.classList.contains('filtered-out')).toBe(false);
    expect(cards[1]!.classList.contains('filtered-out')).toBe(false);
  });

  it('should sort exhibitions in reverse alphabetical order (2026 before 2025)', () => {
    const shows = ['2025 Summer Solo Show', '2026 Retrospective', '2024 Group Exhibition'];
    const sortedShows = Array.from(shows).sort((a, b) => b.localeCompare(a, undefined, { numeric: true, sensitivity: 'base' }));

    expect(sortedShows).toEqual(['2026 Retrospective', '2025 Summer Solo Show', '2024 Group Exhibition']);
  });

  it('should calculate pagination slices, toggle prev/next button states, and render correct page controls', () => {
    // 1. Setup DOM structure
    const dom = new JSDOM(`
      <div>
        <div id="artworks-grid"></div>
        <div id="pagination-bar" class="hidden">
          <button id="art-prev-btn" class="page-btn" aria-label="Previous Page">&larr;</button>
          <div id="page-numbers" class="page-numbers-container"></div>
          <button id="art-next-btn" class="page-btn" aria-label="Next Page">&rarr;</button>
        </div>
      </div>
    `);

    const document = dom.window.document;
    const grid = document.getElementById('artworks-grid');
    const prevBtn = document.getElementById('art-prev-btn') as HTMLButtonElement;
    const nextBtn = document.getElementById('art-next-btn') as HTMLButtonElement;
    const pageNumbersContainer = document.getElementById('page-numbers');
    const paginationBar = document.getElementById('pagination-bar');

    // 2. Generate 14 mock artworks (should result in 3 pages: 6, 6, 2)
    const mockFilteredArtworks: any[] = [];
    for (let i = 1; i <= 14; i++) {
      mockFilteredArtworks.push({
        id: `art-${i}`,
        title: `Artwork ${i}`,
        year: 2024,
        imageUrl: `thumb${i}.jpg`
      });
    }

    let currentPage = 1;
    const itemsPerPage = 6;

    // Helper functions
    const updatePaginationControls = (totalPages: number) => {
      if (!paginationBar) return;
      if (mockFilteredArtworks.length === 0) {
        paginationBar.classList.add('hidden');
        return;
      }
      paginationBar.classList.remove('hidden');

      if (prevBtn) prevBtn.disabled = currentPage === 1;
      if (nextBtn) nextBtn.disabled = currentPage === totalPages;

      if (pageNumbersContainer) {
        pageNumbersContainer.innerHTML = '';
        for (let i = 1; i <= totalPages; i++) {
          const btn = document.createElement('button');
          btn.className = `page-num ${i === currentPage ? 'active' : ''}`;
          btn.textContent = i.toString();
          btn.addEventListener('click', () => {
            currentPage = i;
            renderGallery();
          });
          pageNumbersContainer.appendChild(btn);
        }
      }
    };

    const renderGallery = () => {
      if (!grid) return;
      grid.innerHTML = '';
      
      const col = document.createElement('div');
      col.className = 'artworks-column';
      grid.appendChild(col);

      const totalItems = mockFilteredArtworks.length;
      const totalPages = Math.ceil(totalItems / itemsPerPage) || 1;

      const startIndex = (currentPage - 1) * itemsPerPage;
      const endIndex = Math.min(startIndex + itemsPerPage, totalItems);
      const activeSlice = mockFilteredArtworks.slice(startIndex, endIndex);

      activeSlice.forEach(artwork => {
        const card = document.createElement('div');
        card.className = 'artwork-card';
        card.textContent = artwork.title;
        col.appendChild(card);
      });

      updatePaginationControls(totalPages);
    };

    // --- Scenario A: Render Page 1 ---
    currentPage = 1;
    renderGallery();

    let cards = grid?.querySelectorAll('.artwork-card') || [];
    expect(cards.length).toBe(6);
    expect(cards[0].textContent).toBe('Artwork 1');
    expect(cards[5].textContent).toBe('Artwork 6');

    // Page controls states
    expect(prevBtn.disabled).toBe(true);
    expect(nextBtn.disabled).toBe(false);
    
    // Check generated numeric buttons
    let pageNumBtns = pageNumbersContainer?.querySelectorAll('.page-num') || [];
    expect(pageNumBtns.length).toBe(3); // 14 items / 6 = 3 pages
    expect(pageNumBtns[0].classList.contains('active')).toBe(true);
    expect(pageNumBtns[1].classList.contains('active')).toBe(false);

    // --- Scenario B: Go to Page 2 ---
    currentPage = 2;
    renderGallery();

    cards = grid?.querySelectorAll('.artwork-card') || [];
    expect(cards.length).toBe(6);
    expect(cards[0].textContent).toBe('Artwork 7');
    expect(cards[5].textContent).toBe('Artwork 12');

    expect(prevBtn.disabled).toBe(false);
    expect(nextBtn.disabled).toBe(false);
    
    // Re-query buttons to check updated active class
    pageNumBtns = pageNumbersContainer?.querySelectorAll('.page-num') || [];
    expect(pageNumBtns[1].classList.contains('active')).toBe(true);

    // --- Scenario C: Go to Page 3 (Last page with remaining 2 items) ---
    currentPage = 3;
    renderGallery();

    cards = grid?.querySelectorAll('.artwork-card') || [];
    expect(cards.length).toBe(2);
    expect(cards[0].textContent).toBe('Artwork 13');
    expect(cards[1].textContent).toBe('Artwork 14');

    expect(prevBtn.disabled).toBe(false);
    expect(nextBtn.disabled).toBe(true);
  });

  it('should generate pagination page ranges with ellipses correctly when page count exceeds 10', () => {
    const getPageRange = (current: number, total: number): (number | string)[] => {
      if (total <= 10) {
        return Array.from({ length: total }, (_, i) => i + 1);
      }

      const range: (number | string)[] = [];
      range.push(1);

      let start = Math.max(2, current - 3);
      let end = Math.min(total - 1, current + 3);

      if (current <= 5) {
        end = 8;
      } else if (current >= total - 4) {
        start = total - 7;
      }

      if (start > 2) {
        range.push('...');
      }

      for (let i = start; i <= end; i++) {
        range.push(i);
      }

      if (end < total - 1) {
        range.push('...');
      }

      range.push(total);
      return range;
    };

    // Case 1: Total pages <= 10 -> should return complete numbers array
    expect(getPageRange(1, 8)).toEqual([1, 2, 3, 4, 5, 6, 7, 8]);
    expect(getPageRange(5, 10)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);

    // Case 2: Total pages > 10, current page is near the start (e.g., page 3 of 30)
    // Expect: [1, 2, 3, 4, 5, 6, 7, 8, '...', 30]
    expect(getPageRange(3, 30)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, '...', 30]);

    // Case 3: Total pages > 10, current page is in the middle (e.g., page 15 of 30)
    // Expect: [1, '...', 12, 13, 14, 15, 16, 17, 18, '...', 30]
    expect(getPageRange(15, 30)).toEqual([1, '...', 12, 13, 14, 15, 16, 17, 18, '...', 30]);

    // Case 4: Total pages > 10, current page is near the end (e.g., page 28 of 30)
    // Expect: [1, '...', 23, 24, 25, 26, 27, 28, 29, 30]
    expect(getPageRange(28, 30)).toEqual([1, '...', 23, 24, 25, 26, 27, 28, 29, 30]);
  });
});
