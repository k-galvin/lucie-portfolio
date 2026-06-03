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
        <select id="filter-subject">
          <option value="all">All</option>
          <option value="water">Water</option>
        </select>
        <input id="filter-search" value="" />

        <div id="artworks-grid">
          <div class="artwork-card" data-year="2023" data-show="Library Show" data-subject="boats,water">
            <span class="overlay-title">Boats in the Harbor</span>
          </div>
          <div class="artwork-card" data-year="2024" data-show="Summer Exhibition" data-subject="water,gardens">
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
      const subjectVal = (document.getElementById('filter-subject') as HTMLSelectElement).value;
      const searchVal = (document.getElementById('filter-search') as HTMLInputElement).value;

      cards.forEach(card => {
        const matches = filterArtworks(
          {
            year: card.dataset.year || '',
            show: card.dataset.show || '',
            subjects: card.dataset.subject ? card.dataset.subject.split(',') : [],
            title: card.querySelector('.overlay-title')?.textContent || ''
          },
          { yearVal, showVal, subjectVal, searchVal }
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

    // Filter by subject = water (both have water, but page 1 is filtered out due to year 2023)
    (document.getElementById('filter-subject') as HTMLSelectElement).value = 'water';
    applyFiltersSimulated();
    expect(cards[0]!.classList.contains('filtered-out')).toBe(false);
    expect(cards[1]!.classList.contains('filtered-out')).toBe(true);

    // Set year back to all
    (document.getElementById('filter-year') as HTMLSelectElement).value = 'all';
    applyFiltersSimulated();
    expect(cards[0]!.classList.contains('filtered-out')).toBe(false);
    expect(cards[1]!.classList.contains('filtered-out')).toBe(false);
  });
});
