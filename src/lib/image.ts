/**
 * Compresses an image file client-side using HTML5 Canvas.
 * Resizes the image if its dimensions exceed maxWidthOrHeight (default: 1600).
 * Outputs WebP format at the specified quality (default: 0.8), falling back to JPEG if needed.
 */
export function compressImage(
  file: File,
  maxWidthOrHeight: number = 1600,
  quality: number = 0.8
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    // If the file is not an image, resolve with the original file
    if (!file.type.startsWith('image/')) {
      return resolve(file);
    }

    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        let width = img.width;
        let height = img.height;

        // Calculate new dimensions preserving aspect ratio
        if (width > maxWidthOrHeight || height > maxWidthOrHeight) {
          if (width > height) {
            height = Math.round((height * maxWidthOrHeight) / width);
            width = maxWidthOrHeight;
          } else {
            width = Math.round((width * maxWidthOrHeight) / height);
            height = maxWidthOrHeight;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          return resolve(file); // Fallback to original if canvas context fails
        }

        // Draw image onto canvas
        ctx.drawImage(img, 0, 0, width, height);

        // Feature detect if WebP canvas writing is supported
        let isWebPSupported = false;
        try {
          isWebPSupported = canvas.toDataURL('image/webp').startsWith('data:image/webp');
        } catch (e) {
          isWebPSupported = false;
        }

        const format = isWebPSupported ? 'image/webp' : 'image/jpeg';

        // Convert canvas to Blob
        // Prefer image/webp, fallback to image/jpeg if webp isn't supported for writing (e.g. older Safari)
        canvas.toBlob(
          (blob) => {
            if (blob) {
              resolve(blob);
            } else {
              resolve(file);
            }
          },
          format,
          quality
        );
      };
      img.onerror = (err) => {
        reject(err);
      };
    };
    reader.onerror = (err) => {
      reject(err);
    };
  });
}
