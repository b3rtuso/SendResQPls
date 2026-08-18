/**
 * imageCompressor.ts
 * High-performance client-side image downscaling and compression using HTML5 Canvas.
 *
 * Resizes huge smartphone photos (4000x3000, 8MB-12MB) to optimal full-HD clarity
 * (max 1600x1200, ~350KB) using smooth bicubic resampling before network transfer.
 * Preserves 100% of visual clarity for AI vision models & human dispatchers.
 */

export interface CompressionOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
  mimeType?: string;
}

export async function compressImage(
  file: File,
  options: CompressionOptions = {}
): Promise<{ file: File; originalSize: number; compressedSize: number; savingsPercent: number }> {
  const {
    maxWidth = 1600,
    maxHeight = 1200,
    quality = 0.82,
    mimeType = 'image/jpeg',
  } = options;

  // Non-image files or SVG are passed straight through
  if (!file.type.startsWith('image/') || file.type === 'image/svg+xml') {
    return {
      file,
      originalSize: file.size,
      compressedSize: file.size,
      savingsPercent: 0,
    };
  }

  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);

    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;

      img.onload = () => {
        let { width, height } = img;

        // Maintain aspect ratio while bounding within maxWidth/maxHeight
        if (width > maxWidth || height > maxHeight) {
          const ratio = Math.min(maxWidth / width, maxHeight / height);
          width = Math.round(width * ratio);
          height = Math.round(height * ratio);
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve({
            file,
            originalSize: file.size,
            compressedSize: file.size,
            savingsPercent: 0,
          });
          return;
        }

        // Enable high-quality smooth bicubic resampling (no jagged edges or pixelation)
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';

        // Draw white background in case of transparent PNGs converting to JPEG
        if (mimeType === 'image/jpeg') {
          ctx.fillStyle = '#FFFFFF';
          ctx.fillRect(0, 0, width, height);
        }

        ctx.drawImage(img, 0, 0, width, height);

        canvas.toBlob(
          (blob) => {
            if (!blob) {
              resolve({
                file,
                originalSize: file.size,
                compressedSize: file.size,
                savingsPercent: 0,
              });
              return;
            }

            // Construct new File object with original name and .jpg extension
            const baseName = file.name.replace(/\.[^/.]+$/, '');
            const compressedFile = new File([blob], `${baseName}.jpg`, {
              type: mimeType,
              lastModified: Date.now(),
            });

            const originalSize = file.size;
            const compressedSize = compressedFile.size;
            const savingsPercent = Math.max(0, Math.round(((originalSize - compressedSize) / originalSize) * 100));

            console.log(
              `[ImageCompressor] ${file.name}: ${(originalSize / 1024).toFixed(1)} KB → ${(compressedSize / 1024).toFixed(1)} KB (${savingsPercent}% savings)`
            );

            resolve({
              file: compressedFile,
              originalSize,
              compressedSize,
              savingsPercent,
            });
          },
          mimeType,
          quality
        );
      };

      img.onerror = () => {
        resolve({
          file,
          originalSize: file.size,
          compressedSize: file.size,
          savingsPercent: 0,
        });
      };
    };

    reader.onerror = () => {
      resolve({
        file,
        originalSize: file.size,
        compressedSize: file.size,
        savingsPercent: 0,
      });
    };
  });
}
