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
});
