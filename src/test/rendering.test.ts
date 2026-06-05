import { describe, it, expect } from 'vitest';
import { JSDOM } from 'jsdom';
import fs from 'fs';
import path from 'path';

function loadPageDOM(relativeFilePath: string) {
  const filePath = path.resolve(__dirname, '../../dist', relativeFilePath);
  const html = fs.readFileSync(filePath, 'utf8');
  return new JSDOM(html);
}

describe('Static HTML Page Rendering Tests', () => {
  const pages = [
    { name: 'Home', path: 'index.html', heading: 'Lucie Galvin' },
    { name: 'About', path: 'about/index.html', heading: 'Lucie Galvin' },
    { name: 'Admin', path: 'admin/index.html', heading: 'Admin Dashboard' },
    { name: 'Artworks', path: 'artworks/index.html', heading: 'Artworks' },
    { name: 'Exhibitions', path: 'exhibitions/index.html', heading: 'Exhibitions' },
    { name: 'Contact', path: 'contact/index.html', heading: 'Get in Touch' }
  ];

  pages.forEach(page => {
    it(`should load the ${page.name} page and contain the header and footer`, () => {
      const dom = loadPageDOM(page.path);
      const document = dom.window.document;

      // Verify Header
      const header = document.querySelector('.site-header');
      expect(header).not.toBeNull();
      const logoText = header?.querySelector('.logo-text')?.textContent;
      expect(logoText).toContain('Lucie Galvin');

      // Verify mobile menu toggle and ARIA controls match
      const menuToggle = header?.querySelector('#menu-toggle');
      expect(menuToggle).not.toBeNull();
      expect(menuToggle?.getAttribute('aria-controls')).toBe('nav-links');
      const navLinks = header?.querySelector('#nav-links');
      expect(navLinks).not.toBeNull();

      // Verify header navigation links
      const links = Array.from(navLinks?.querySelectorAll('a') || []).map(a => a.getAttribute('href'));
      expect(links).toContain('/');
      expect(links).toContain('/artworks');
      expect(links).toContain('/exhibitions');
      expect(links).toContain('/about');
      expect(links).toContain('/contact');

      // Verify Footer
      const footer = document.querySelector('.site-footer');
      expect(footer).not.toBeNull();
      
      const copyright = footer?.querySelector('.copyright')?.textContent;
      expect(copyright).toContain('Lucie Galvin');

      // Verify Social/Pinterest/Instagram/Store Links
      const instaLink = footer?.querySelector('a.instagram');
      expect(instaLink?.getAttribute('href')).toBe('https://www.instagram.com/luciegalvin.art');

      const pinterestLink = footer?.querySelector('a.pinterest');
      expect(pinterestLink?.getAttribute('href')).toBe('https://www.pinterest.com/luciegalvinart/');

      const linkedinLink = footer?.querySelector('a.linkedin');
      expect(linkedinLink?.getAttribute('href')).toBe('https://www.linkedin.com/in/luciegalvin/');

      const storeLink = footer?.querySelector('a.store');
      expect(storeLink?.getAttribute('href')).toBe('https://www.saatchiart.com/luciegalvin');
    });
  });

  it('should render correct page headings or key elements', () => {
    // 1. Home
    const homeDom = loadPageDOM('index.html');
    expect(homeDom.window.document.querySelector('#hero-slideshow')).not.toBeNull();

    // 2. About
    const aboutDom = loadPageDOM('about/index.html');
    const aboutHeader = aboutDom.window.document.querySelector('.section-title');
    expect(aboutHeader?.textContent).toContain('Lucie Galvin');

    // 3. Contact
    const contactDom = loadPageDOM('contact/index.html');
    const contactTitle = contactDom.window.document.querySelector('.contact-title');
    expect(contactTitle?.textContent).toBe('Get in Touch');

    // 4. Exhibitions
    const exhibitionsDom = loadPageDOM('exhibitions/index.html');
    const exhibitionsTitle = exhibitionsDom.window.document.querySelector('#exh-title-container');
    expect(exhibitionsTitle?.textContent).toBe('Loading...');

    // 5. Artworks
    const artworksDom = loadPageDOM('artworks/index.html');
    const artworksContainer = artworksDom.window.document.querySelector('.artworks-container');
    expect(artworksContainer).not.toBeNull();
  });
});
