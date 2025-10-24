/**
 * Image validation utility for checking dimensions and other criteria
 */

export interface ImageDimensions {
  width: number;
  height: number;
}

export interface ImageValidationCriteria {
  minWidth?: number;
  maxWidth?: number;
  minHeight?: number;
  maxHeight?: number;
  maxArea?: number; // Maximum area in megapixels (e.g., 16 for 16Mpx²)
  aspectRatio?: number; // e.g., 16/9 = 1.777...
  aspectRatioTolerance?: number; // tolerance for aspect ratio (default: 0.01)
  maxFileSize?: number; // in bytes
}

export interface ImageValidationResult {
  isValid: boolean;
  dimensions?: ImageDimensions;
  fileSize?: number;
  errors: string[];
}

/**
 * Validates an image URL by fetching it and checking its dimensions
 * This works in both browser and Node.js environments
 */
export async function validateImageUrl(
  url: string,
  criteria: ImageValidationCriteria = {}
): Promise<ImageValidationResult> {
  const errors: string[] = [];

  try {
    // Fetch the image
    const response = await fetch(url);
    
    if (!response.ok) {
      errors.push(`Failed to fetch image: ${response.status} ${response.statusText}`);
      return { isValid: false, errors };
    }

    // Check content type
    const contentType = response.headers.get('content-type');
    if (!contentType?.startsWith('image/')) {
      errors.push(`URL does not point to an image. Content-Type: ${contentType}`);
      return { isValid: false, errors };
    }

    // Get file size
    const contentLength = response.headers.get('content-length');
    const fileSize = contentLength ? parseInt(contentLength, 10) : undefined;

    // Check file size if specified
    if (criteria.maxFileSize && fileSize && fileSize > criteria.maxFileSize) {
      errors.push(
        `Image file size (${(fileSize / 1024 / 1024).toFixed(2)}MB) exceeds maximum allowed (${(criteria.maxFileSize / 1024 / 1024).toFixed(2)}MB)`
      );
    }

    // Get image blob
    const blob = await response.blob();

    // Get image dimensions
    const dimensions = await getImageDimensions(blob);

    // Validate dimensions
    if (criteria.minWidth && dimensions.width < criteria.minWidth) {
      errors.push(`Image width (${dimensions.width}px) is less than minimum required (${criteria.minWidth}px)`);
    }

    if (criteria.maxWidth && dimensions.width > criteria.maxWidth) {
      errors.push(`Image width (${dimensions.width}px) exceeds maximum allowed (${criteria.maxWidth}px)`);
    }

    if (criteria.minHeight && dimensions.height < criteria.minHeight) {
      errors.push(`Image height (${dimensions.height}px) is less than minimum required (${criteria.minHeight}px)`);
    }

    if (criteria.maxHeight && dimensions.height > criteria.maxHeight) {
      errors.push(`Image height (${dimensions.height}px) exceeds maximum allowed (${criteria.maxHeight}px)`);
    }

    // Validate maximum area (in megapixels)
    if (criteria.maxArea) {
      const areaMpx = (dimensions.width * dimensions.height) / 1_000_000; // Convert to megapixels
      if (areaMpx > criteria.maxArea) {
        errors.push(
          `Image area (${areaMpx.toFixed(2)}Mpx² from ${dimensions.width}x${dimensions.height}px) exceeds maximum allowed (${criteria.maxArea}Mpx²)`
        );
      }
    }

    // Validate aspect ratio if specified
    if (criteria.aspectRatio) {
      const actualRatio = dimensions.width / dimensions.height;
      const tolerance = criteria.aspectRatioTolerance || 0.01;
      const ratioDiff = Math.abs(actualRatio - criteria.aspectRatio);

      if (ratioDiff > tolerance) {
        errors.push(
          `Image aspect ratio (${actualRatio.toFixed(2)}) does not match required ratio (${criteria.aspectRatio.toFixed(2)})`
        );
      }
    }

    return {
      isValid: errors.length === 0,
      dimensions,
      fileSize,
      errors,
    };
  } catch (error) {
    errors.push(`Error validating image: ${error instanceof Error ? error.message : String(error)}`);
    return { isValid: false, errors };
  }
}

/**
 * Gets image dimensions from a blob
 * Works in both browser and Node.js (with appropriate polyfills)
 */
async function getImageDimensions(blob: Blob): Promise<ImageDimensions> {
  // Check if we're in a browser environment
  if (typeof window !== 'undefined' && typeof Image !== 'undefined') {
    return getBrowserImageDimensions(blob);
  } else {
    // Node.js environment - use sharp or image-size
    return getNodeImageDimensions(blob);
  }
}

/**
 * Get image dimensions in browser using Image element
 */
function getBrowserImageDimensions(blob: Blob): Promise<ImageDimensions> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(blob);

    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve({
        width: img.naturalWidth,
        height: img.naturalHeight,
      });
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Failed to load image'));
    };

    img.src = url;
  });
}

/**
 * Get image dimensions in Node.js using image-size library
 */
async function getNodeImageDimensions(blob: Blob): Promise<ImageDimensions> {
  try {
    // Convert blob to buffer
    const arrayBuffer = await blob.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Try to use image-size if available
    try {
      const sizeOf = require('image-size');
      const dimensions = sizeOf(buffer);
      return {
        width: dimensions.width || 0,
        height: dimensions.height || 0,
      };
    } catch (e) {
      // If image-size is not available, try sharp
      try {
        const sharp = require('sharp');
        const metadata = await sharp(buffer).metadata();
        return {
          width: metadata.width || 0,
          height: metadata.height || 0,
        };
      } catch (sharpError) {
        throw new Error('Neither image-size nor sharp library is available. Please install one of them for image dimension validation in Node.js.');
      }
    }
  } catch (error) {
    throw new Error(`Failed to get image dimensions: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * Batch validate multiple image URLs
 */
export async function validateImageUrls(
  urls: string[],
  criteria: ImageValidationCriteria = {}
): Promise<Map<string, ImageValidationResult>> {
  const results = new Map<string, ImageValidationResult>();

  // Validate images in parallel
  const validationPromises = urls.map(async (url) => {
    const result = await validateImageUrl(url, criteria);
    results.set(url, result);
  });

  await Promise.all(validationPromises);

  return results;
}

/**
 * Talabat official image quality guidelines
 * 
 * Maximum file size: 20MB
 * Maximum area: 16Mpx² (16 Mega pixels square)
 * File formats: GIF, JPEG, Lottie, PNG, SVG, Tiff, WebP
 * 
 * Area rules:
 * - If image has less than 4000px in both dimensions, it is accepted
 * - If image has more than 4000px in one dimension, it might be accepted (if area ≤ 16Mpx²)
 * - If image has more than 4000px in both dimensions, it will be rejected
 * 
 * Examples:
 * - 4000x4000 = 16Mpx² ✓ (at the limit)
 * - 3000x3000 = 9Mpx² ✓
 * - 6000x2000 = 12Mpx² ✓
 * - 5000x4000 = 20Mpx² ✗ (exceeds 16Mpx²)
 * - 6000x3000 = 18Mpx² ✗ (exceeds 16Mpx²)
 */
export const TALABAT_IMAGE_CRITERIA = {
  // Standard Talabat image validation (applies to all image types)
  standard: {
    maxArea: 16, // 16 Megapixels squared (e.g., 4000x4000px)
    maxFileSize: 20 * 1024 * 1024, // 20MB
  },
  // Product images (with recommended minimum dimensions)
  product: {
    minWidth: 800,
    minHeight: 800,
    maxArea: 16, // 16Mpx²
    maxFileSize: 20 * 1024 * 1024, // 20MB
  },
  // Menu/Category banner images
  menu: {
    minWidth: 1200,
    minHeight: 400,
    maxArea: 16, // 16Mpx²
    maxFileSize: 20 * 1024 * 1024, // 20MB
  },
  // Thumbnail images
  thumbnail: {
    minWidth: 200,
    minHeight: 200,
    maxArea: 16, // 16Mpx²
    maxFileSize: 20 * 1024 * 1024, // 20MB
  },
} as const;
