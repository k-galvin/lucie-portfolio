import { vi, describe, it, expect, beforeEach } from 'vitest';
import { JSDOM } from 'jsdom';
import { validateEmail, shouldBlockSubmit } from '../lib/utils';

// Mock Firebase Firestore
const mockAddDoc = vi.fn();
const mockCollection = vi.fn();
const mockServerTimestamp = vi.fn(() => 'mock-timestamp');

vi.mock('firebase/firestore', () => ({
  collection: (...args: any[]) => mockCollection(...args),
  addDoc: (...args: any[]) => mockAddDoc(...args),
  serverTimestamp: () => mockServerTimestamp()
}));

vi.mock('../lib/firebase', () => ({
  db: { type: 'firestore-instance' }
}));

describe('Contact Form Validation and Honeypot Prevention', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubGlobal('fetch', vi.fn());
  });

  it('should validate emails correctly with validateEmail', () => {
    expect(validateEmail('test@example.com')).toBe(true);
    expect(validateEmail('user.name+tag@sub.domain.co')).toBe(true);
    expect(validateEmail('invalid-email')).toBe(false);
    expect(validateEmail('@missingname.com')).toBe(false);
    expect(validateEmail('missingdomain@')).toBe(false);
    expect(validateEmail('')).toBe(false);
  });

  it('should identify spam submissions via honeypot with shouldBlockSubmit', () => {
    expect(shouldBlockSubmit('spam-bot-value')).toBe(true);
    expect(shouldBlockSubmit('  ')).toBe(false); // empty or spaces only
    expect(shouldBlockSubmit('')).toBe(false);
  });

  it('should handle spam bot submission by dropping it silently and simulating success', async () => {
    const dom = new JSDOM(`
      <form id="contact-form">
        <input type="text" name="_honey" value="spambot" />
        <input type="text" id="contact-name" value="Spammy Bot" />
        <input type="email" id="contact-email" value="spam@bot.com" />
        <textarea id="contact-message">Buy generic goods!</textarea>
        <button type="submit" id="submit-btn">
          <span class="submit-text-normal">Send Message</span>
          <span class="submit-text-loading hidden">Sending...</span>
        </button>
        <div id="status-success" class="status-message success hidden"></div>
        <div id="status-error" class="status-message error hidden"></div>
      </form>
    `);

    const document = dom.window.document;
    const form = document.getElementById('contact-form') as HTMLFormElement;
    const statusSuccess = document.getElementById('status-success') as HTMLElement;
    const statusError = document.getElementById('status-error') as HTMLElement;
    const btnSubmit = document.getElementById('submit-btn') as HTMLButtonElement;

    // Contact form submit logic from contact.astro adapted to tests
    const submitHandler = async (e: Event) => {
      e.preventDefault();
      statusSuccess.classList.add('hidden');
      statusError.classList.add('hidden');

      btnSubmit.disabled = true;

      const nameVal = (document.getElementById('contact-name') as HTMLInputElement).value;
      const emailVal = (document.getElementById('contact-email') as HTMLInputElement).value;
      const messageVal = (document.getElementById('contact-message') as HTMLTextAreaElement).value;
      const honeyVal = (form.querySelector('input[name="_honey"]') as HTMLInputElement).value;

      if (!validateEmail(emailVal)) {
        btnSubmit.disabled = false;
        return;
      }

      if (shouldBlockSubmit(honeyVal)) {
        statusSuccess.classList.remove('hidden');
        form.reset();
        btnSubmit.disabled = false;
        return;
      }

      // Normal submission mock
      await mockAddDoc({}, { name: nameVal, email: emailVal, message: messageVal });
      btnSubmit.disabled = false;
    };

    form.addEventListener('submit', submitHandler);

    // Trigger form submit
    form.dispatchEvent(new dom.window.Event('submit', { bubbles: true, cancelable: true }));

    // Assert honey values were checked and submission was dropped without calling Firestore
    expect(mockAddDoc).not.toHaveBeenCalled();
    expect(statusSuccess.classList.contains('hidden')).toBe(false);
    expect(statusError.classList.contains('hidden')).toBe(true);
  });

  it('should perform valid submission and trigger database/FormSubmit calls', async () => {
    const dom = new JSDOM(`
      <form id="contact-form">
        <input type="text" name="_honey" value="" />
        <input type="text" id="contact-name" value="John Doe" />
        <input type="email" id="contact-email" value="john@example.com" />
        <textarea id="contact-message">Hello Lucie, I love your paintings!</textarea>
        <button type="submit" id="submit-btn">
          <span class="submit-text-normal">Send Message</span>
          <span class="submit-text-loading hidden">Sending...</span>
        </button>
        <div id="status-success" class="status-message success hidden"></div>
        <div id="status-error" class="status-message error hidden"></div>
      </form>
    `);

    const document = dom.window.document;
    const form = document.getElementById('contact-form') as HTMLFormElement;
    const statusSuccess = document.getElementById('status-success') as HTMLElement;
    const statusError = document.getElementById('status-error') as HTMLElement;
    const btnSubmit = document.getElementById('submit-btn') as HTMLButtonElement;
    const txtNormal = btnSubmit.querySelector('.submit-text-normal') as HTMLElement;
    const txtLoading = btnSubmit.querySelector('.submit-text-loading') as HTMLElement;

    // Mock fetch for formsubmit
    const mockFetch = vi.fn().mockResolvedValue({ ok: true });
    vi.stubGlobal('fetch', mockFetch);

    // Setup submit logic
    const submitHandler = async (e: Event) => {
      e.preventDefault();
      statusSuccess.classList.add('hidden');
      statusError.classList.add('hidden');

      btnSubmit.disabled = true;
      txtNormal.classList.add('hidden');
      txtLoading.classList.remove('hidden');

      const nameVal = (document.getElementById('contact-name') as HTMLInputElement).value;
      const emailVal = (document.getElementById('contact-email') as HTMLInputElement).value;
      const messageVal = (document.getElementById('contact-message') as HTMLTextAreaElement).value;
      const honeyVal = (form.querySelector('input[name="_honey"]') as HTMLInputElement).value;

      if (!validateEmail(emailVal)) {
        btnSubmit.disabled = false;
        txtNormal.classList.remove('hidden');
        txtLoading.classList.add('hidden');
        return;
      }

      if (shouldBlockSubmit(honeyVal)) {
        statusSuccess.classList.remove('hidden');
        form.reset();
        btnSubmit.disabled = false;
        txtNormal.classList.remove('hidden');
        txtLoading.classList.add('hidden');
        return;
      }

      try {
        await mockAddDoc(mockCollection({}, 'messages'), {
          name: nameVal,
          email: emailVal,
          message: messageVal,
          submittedAt: mockServerTimestamp()
        });

        const response = await fetch("https://formsubmit.co/ajax/studio@luciegalvin.com", {
          method: "POST",
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: nameVal, email: emailVal, message: messageVal })
        });

        if (response.ok) {
          statusSuccess.classList.remove('hidden');
          form.reset();
        } else {
          statusError.classList.remove('hidden');
        }
      } catch (err) {
        statusError.classList.remove('hidden');
      } finally {
        btnSubmit.disabled = false;
        txtNormal.classList.remove('hidden');
        txtLoading.classList.add('hidden');
      }
    };

    form.addEventListener('submit', submitHandler);

    // Trigger form submit
    form.dispatchEvent(new dom.window.Event('submit', { bubbles: true, cancelable: true }));
    
    // Check loading state immediately
    expect(btnSubmit.disabled).toBe(true);
    expect(txtNormal.classList.contains('hidden')).toBe(true);
    expect(txtLoading.classList.contains('hidden')).toBe(false);

    // Wait for the async macro/microtasks to complete
    await new Promise(resolve => setTimeout(resolve, 20));

    // Check post-submit results
    expect(mockAddDoc).toHaveBeenCalledTimes(1);
    expect(mockFetch).toHaveBeenCalledTimes(1);
    expect(statusSuccess.classList.contains('hidden')).toBe(false);
    expect(statusError.classList.contains('hidden')).toBe(true);

    // Check loading state has reverted
    expect(btnSubmit.disabled).toBe(false);
    expect(txtNormal.classList.contains('hidden')).toBe(false);
    expect(txtLoading.classList.contains('hidden')).toBe(true);
  });
});
