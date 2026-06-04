import { describe, it, expect, vi, beforeAll, afterAll } from 'vitest';
import { JSDOM } from 'jsdom';
import { compressImage } from '../lib/image';

describe('Image Compression Utility tests', () => {
  let dom: JSDOM;

  beforeAll(() => {
    dom = new JSDOM('<!DOCTYPE html><html><body></body></html>', {
      url: 'http://localhost'
    });
    global.window = dom.window as any;
    global.document = dom.window.document as any;
    global.FileReader = dom.window.FileReader as any;
    global.Image = dom.window.Image as any;
  });

  afterAll(() => {
    delete (global as any).window;
    delete (global as any).document;
    delete (global as any).FileReader;
    delete (global as any).Image;
  });

  it('should resolve with the original file if file is not an image type', async () => {
    const textFile = new dom.window.File(['hello world'], 'test.txt', { type: 'text/plain' });
    const result = await compressImage(textFile);
    expect(result).toBe(textFile);
  });

  it('should attempt to read the file using FileReader if it is an image type', async () => {
    const mockFile = new dom.window.File(['image-binary-data'], 'test.png', { type: 'image/png' });
    
    const readAsDataURLSpy = vi.spyOn(dom.window.FileReader.prototype, 'readAsDataURL');
    
    compressImage(mockFile).catch(() => {});

    expect(readAsDataURLSpy).toHaveBeenCalledWith(mockFile);
    readAsDataURLSpy.mockRestore();
  });
});
