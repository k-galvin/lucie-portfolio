import { describe, it, expect } from 'vitest';
import { JSDOM } from 'jsdom';
import { checkPrintLinkRequired } from '../lib/utils';

describe('Admin Panel Dashboards and Verification logic', () => {
  it('should verify checkPrintLinkRequired validation rules', () => {
    // If not print, link can be empty or anything
    expect(checkPrintLinkRequired(false, '')).toBe(true);
    expect(checkPrintLinkRequired(false, 'https://someplace.com')).toBe(true);

    // If print, link must be a non-empty string
    expect(checkPrintLinkRequired(true, '')).toBe(false);
    expect(checkPrintLinkRequired(true, '   ')).toBe(false);
    expect(checkPrintLinkRequired(true, 'https://saatchi.com/print/1')).toBe(true);
  });

  it('should toggle panels based on mock authentication states', () => {
    const dom = new JSDOM(`
      <div>
        <div id="loading-panel">Loading...</div>
        <div id="login-panel" class="hidden">Login</div>
        <div id="admin-panel" class="hidden">Dashboard Workspace</div>
      </div>
    `);

    const document = dom.window.document;
    const loadingPanel = document.getElementById('loading-panel');
    const loginPanel = document.getElementById('login-panel');
    const adminPanel = document.getElementById('admin-panel');

    const handleAuthStateChange = (user: any) => {
      loadingPanel?.classList.add('hidden');
      if (user) {
        loginPanel?.classList.add('hidden');
        adminPanel?.classList.remove('hidden');
      } else {
        adminPanel?.classList.add('hidden');
        loginPanel?.classList.remove('hidden');
      }
    };

    // Scenario A: Unauthenticated User
    handleAuthStateChange(null);
    expect(loadingPanel?.classList.contains('hidden')).toBe(true);
    expect(loginPanel?.classList.contains('hidden')).toBe(false);
    expect(adminPanel?.classList.contains('hidden')).toBe(true);

    // Scenario B: Authenticated User
    handleAuthStateChange({ email: 'studio@luciegalvin.com', uid: 'testuid' });
    expect(loadingPanel?.classList.contains('hidden')).toBe(true);
    expect(loginPanel?.classList.contains('hidden')).toBe(true);
    expect(adminPanel?.classList.contains('hidden')).toBe(false);
  });

  it('should toggle print link requirements when Available as Print checkbox is clicked', () => {
    const dom = new JSDOM(`
      <div>
        <input type="checkbox" id="art-is-print" />
        <div id="art-print-link-group" class="hidden">
          <input type="url" id="art-print-link" />
        </div>
      </div>
    `);

    const document = dom.window.document;
    const artIsPrint = document.getElementById('art-is-print') as HTMLInputElement;
    const artPrintLinkGroup = document.getElementById('art-print-link-group');
    const artPrintLink = document.getElementById('art-print-link') as HTMLInputElement;

    const handlePrintChange = () => {
      if (artIsPrint.checked) {
        artPrintLinkGroup?.classList.remove('hidden');
        artPrintLink.required = true;
      } else {
        artPrintLinkGroup?.classList.add('hidden');
        artPrintLink.required = false;
        artPrintLink.value = '';
      }
    };

    artIsPrint.addEventListener('change', handlePrintChange);

    // Initial state: not checked
    expect(artIsPrint.checked).toBe(false);
    expect(artPrintLinkGroup?.classList.contains('hidden')).toBe(true);
    expect(artPrintLink.required).toBe(false);

    // Check it
    artIsPrint.checked = true;
    artIsPrint.dispatchEvent(new dom.window.Event('change'));
    expect(artPrintLinkGroup?.classList.contains('hidden')).toBe(false);
    expect(artPrintLink.required).toBe(true);

    // Uncheck it
    artIsPrint.checked = false;
    artIsPrint.dispatchEvent(new dom.window.Event('change'));
    expect(artPrintLinkGroup?.classList.contains('hidden')).toBe(true);
    expect(artPrintLink.required).toBe(false);
    expect(artPrintLink.value).toBe('');
  });

  it('should pre-fill inputs and set multi-subject checkboxes on edit', () => {
    const dom = new JSDOM(`
      <div>
        <h3 id="form-panel-title">Add New Artwork</h3>
        <input type="hidden" id="art-id" />
        <input type="text" id="art-title" />
        <input type="number" id="art-year" />
        
        <input type="checkbox" class="art-subject-cb" value="gardens" />
        <input type="checkbox" class="art-subject-cb" value="water" />
        <input type="checkbox" class="art-subject-cb" value="boats" />
        <input type="checkbox" class="art-subject-cb" value="people" />

        <input type="checkbox" id="art-is-print" />
        <div id="art-print-link-group" class="hidden">
          <input type="url" id="art-print-link" />
        </div>
      </div>
    `);

    const document = dom.window.document;
    const formPanelTitle = document.getElementById('form-panel-title');
    const artInputId = document.getElementById('art-id') as HTMLInputElement;
    const artInputTitle = document.getElementById('art-title') as HTMLInputElement;
    const artInputYear = document.getElementById('art-year') as HTMLInputElement;
    const artSubjectCheckboxes = document.querySelectorAll('.art-subject-cb') as NodeListOf<HTMLInputElement>;
    const artIsPrint = document.getElementById('art-is-print') as HTMLInputElement;
    const artPrintLinkGroup = document.getElementById('art-print-link-group');
    const artPrintLink = document.getElementById('art-print-link') as HTMLInputElement;

    const editArtwork = (art: any) => {
      if (formPanelTitle) formPanelTitle.textContent = 'Edit Artwork';
      artInputId.value = art.id;
      artInputTitle.value = art.title;
      artInputYear.value = art.year.toString();

      const artworkSubjects = art.subject || [];
      artSubjectCheckboxes.forEach(cb => {
        cb.checked = artworkSubjects.includes(cb.value);
      });

      artIsPrint.checked = art.isPrint || false;
      if (art.isPrint) {
        artPrintLinkGroup?.classList.remove('hidden');
        artPrintLink.required = true;
        artPrintLink.value = art.printLink || '';
      } else {
        artPrintLinkGroup?.classList.add('hidden');
        artPrintLink.required = false;
        artPrintLink.value = '';
      }
    };

    const mockArtworkToEdit = {
      id: 'artwork-id-123',
      title: 'Water Gardens and Boats',
      year: 2025,
      subject: ['water', 'boats'],
      isPrint: true,
      printLink: 'https://saatchiart.com/luciegalvin/print-boats'
    };

    // Execute Edit Setup
    editArtwork(mockArtworkToEdit);

    // Verify Title and fields
    expect(formPanelTitle?.textContent).toBe('Edit Artwork');
    expect(artInputId.value).toBe('artwork-id-123');
    expect(artInputTitle.value).toBe('Water Gardens and Boats');
    expect(artInputYear.value).toBe('2025');

    // Verify correct subject checkboxes are checked
    const checkedSubjects = Array.from(artSubjectCheckboxes).filter(cb => cb.checked).map(cb => cb.value);
    expect(checkedSubjects).toEqual(['water', 'boats']);

    // Verify print setups
    expect(artIsPrint.checked).toBe(true);
    expect(artPrintLinkGroup?.classList.contains('hidden')).toBe(false);
    expect(artPrintLink.required).toBe(true);
    expect(artPrintLink.value).toBe('https://saatchiart.com/luciegalvin/print-boats');
  });

  it('should filter artworks by title in-memory and disable reorder buttons during active search', () => {
    // 1. Prepare dummy DOM container for the table body, search input, and sort select
    const dom = new JSDOM(`
      <div>
        <input type="text" id="art-search-input" value="" />
        <select id="art-sort-select">
          <option value="custom" selected>Custom Order</option>
          <option value="title-asc">Title (A-Z)</option>
        </select>
        <table>
          <tbody id="artwork-list-tbody"></tbody>
        </table>
      </div>
    `);

    const document = dom.window.document;
    const artworkTbody = document.getElementById('artwork-list-tbody');

    // 2. Mock state variables
    let currentArtworks = [
      { id: '1', title: 'Summer Breeze', year: 2024, status: '', isPrint: false, order: 0, imageUrl: 'thumb1.jpg' },
      { id: '2', title: 'Winter Morning', year: 2024, status: '', isPrint: true, order: 10, imageUrl: 'thumb2.jpg' },
      { id: '3', title: 'Summer Garden', year: 2025, status: '', isPrint: false, order: 20, imageUrl: 'thumb3.jpg' }
    ];
    let currentSortBy = 'custom';
    let currentArtSearchQuery = '';

    // 3. Duplicate renderArtworks function from admin.astro
    const renderArtworks = () => {
      if (!artworkTbody) return;
      artworkTbody.innerHTML = '';

      if (currentArtworks.length === 0) {
        artworkTbody.innerHTML = '<tr><td colspan="6" style="text-align:center;">No artworks in database.</td></tr>';
        return;
      }

      let displayArtworks = currentArtworks;
      const isSearchActive = currentArtSearchQuery.trim() !== '';
      if (isSearchActive) {
        const query = currentArtSearchQuery.toLowerCase().trim();
        displayArtworks = currentArtworks.filter(art => 
          art.title && art.title.toLowerCase().includes(query)
        );
      }

      if (displayArtworks.length === 0) {
        artworkTbody.innerHTML = '<tr><td colspan="6" style="text-align:center;">No artworks found matching your search.</td></tr>';
        return;
      }

      displayArtworks.forEach((artwork, index) => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
          <td><img src="${artwork.imageUrl}" class="table-thumb" alt="thumb"/></td>
          <td><strong>${artwork.title}</strong></td>
          <td>${artwork.year}</td>
          <td>${artwork.status || '—'}</td>
          <td>${artwork.isPrint ? 'Yes' : 'No'}</td>
          <td>
            <div class="btn-row">
              <button class="sm-btn move-up-btn" title="Move Up" ${currentSortBy !== 'custom' || isSearchActive || index === 0 ? 'disabled' : ''}>↑</button>
              <button class="sm-btn move-down-btn" title="Move Down" ${currentSortBy !== 'custom' || isSearchActive || index === displayArtworks.length - 1 ? 'disabled' : ''}>↓</button>
              <button class="sm-btn edit-btn">Edit</button>
              <button class="sm-btn delete-btn">Delete</button>
            </div>
          </td>
        `;
        artworkTbody.appendChild(tr);
      });
    };

    // --- Scenario A: No search active ---
    currentArtSearchQuery = '';
    renderArtworks();

    let rows = artworkTbody?.querySelectorAll('tr') || [];
    expect(rows.length).toBe(3);
    
    // First row: Up button should be disabled, Down button enabled
    let row1Up = rows[0].querySelector('.move-up-btn') as HTMLButtonElement;
    let row1Down = rows[0].querySelector('.move-down-btn') as HTMLButtonElement;
    expect(row1Up.disabled).toBe(true);
    expect(row1Down.disabled).toBe(false);

    // Second row: Both enabled
    let row2Up = rows[1].querySelector('.move-up-btn') as HTMLButtonElement;
    let row2Down = rows[1].querySelector('.move-down-btn') as HTMLButtonElement;
    expect(row2Up.disabled).toBe(false);
    expect(row2Down.disabled).toBe(false);

    // Third row: Up enabled, Down disabled
    let row3Up = rows[2].querySelector('.move-up-btn') as HTMLButtonElement;
    let row3Down = rows[2].querySelector('.move-down-btn') as HTMLButtonElement;
    expect(row3Up.disabled).toBe(false);
    expect(row3Down.disabled).toBe(true);


    // --- Scenario B: Search "summer" (case-insensitive) ---
    currentArtSearchQuery = 'summer';
    renderArtworks();

    rows = artworkTbody?.querySelectorAll('tr') || [];
    expect(rows.length).toBe(2);
    expect(rows[0].textContent).toContain('Summer Breeze');
    expect(rows[1].textContent).toContain('Summer Garden');

    // Reorder buttons should be disabled for all filtered rows
    rows.forEach(row => {
      const upBtn = row.querySelector('.move-up-btn') as HTMLButtonElement;
      const downBtn = row.querySelector('.move-down-btn') as HTMLButtonElement;
      expect(upBtn.disabled).toBe(true);
      expect(downBtn.disabled).toBe(true);
    });


    // --- Scenario C: Search with no matches ---
    currentArtSearchQuery = 'nonexistent';
    renderArtworks();

    rows = artworkTbody?.querySelectorAll('tr') || [];
    expect(rows.length).toBe(1);
    expect(rows[0].textContent).toContain('No artworks found matching your search.');
  });
});
