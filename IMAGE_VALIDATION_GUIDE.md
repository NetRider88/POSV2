# Image Dimension Validation Guide

## Overview

The POS integration system now supports validating image dimensions and file sizes for images in menu push payloads. This ensures that all images meet Talabat's quality standards before being accepted.

## Features

- ✅ **Dimension Validation**: Check minimum/maximum width and height
- ✅ **Aspect Ratio Validation**: Ensure images have the correct aspect ratio
- ✅ **File Size Validation**: Limit maximum file size
- ✅ **Async Validation**: Non-blocking validation that fetches and analyzes images
- ✅ **Detailed Error Messages**: Get specific feedback on what's wrong with each image

## How It Works

### 1. Basic Usage

Image dimension validation is **automatically enabled** when your payload contains image URLs with image extensions (`.jpg`, `.jpeg`, `.png`, `.gif`, `.webp`, `.svg`, `.bmp`, `.tiff`, `.heic`, `.heif`).

```
POST /api/simulator/{id}
```

You can also explicitly enable it with a query parameter:

```
POST /api/simulator/{id}?validateDimensions=true
```

**Automatic Detection**: The system scans your payload for any `Image` type items with URLs that have image file extensions. If found, dimension validation runs automatically.

**Logo Exclusion**: Logos and brand images are automatically excluded from dimension validation. The system identifies logos by checking:
- Image ID contains: `logo`, `restaurant_image`, `store_image`, `brand`, or `icon`
- Alt text contains: `logo`, `restaurant`, `store`, `brand`, or `icon`

**Without image URLs**: If your payload doesn't contain product/menu image URLs with extensions, only schema validation is performed (URL format, required fields, etc.).

### 2. Talabat Official Image Quality Guidelines

All images must meet these requirements:

#### Universal Requirements
- **Maximum File Size**: 20MB
- **Maximum Area**: 16Mpx² (16 Mega pixels square)
- **Supported Formats**: GIF, JPEG, Lottie, PNG, SVG, Tiff, WebP

#### Area Validation Rules
The maximum area constraint provides flexible upper bounds:

- ✅ **If image has less than 4000px in both dimensions** → Always accepted
- ⚠️ **If image has more than 4000px in one dimension** → Might be accepted (if total area ≤ 16Mpx²)
- ❌ **If image has more than 4000px in both dimensions** → Will be rejected

#### Examples
| Dimensions | Area | Status |
|------------|------|--------|
| 4000x4000px | 16Mpx² | ✅ Accepted (at the limit) |
| 3000x3000px | 9Mpx² | ✅ Accepted |
| 6000x2000px | 12Mpx² | ✅ Accepted |
| 5000x4000px | 20Mpx² | ❌ Rejected (exceeds 16Mpx²) |
| 6000x3000px | 18Mpx² | ❌ Rejected (exceeds 16Mpx²) |

#### Recommended Minimum Dimensions
- **Product Images**: At least 800x800px
- **Menu/Banner Images**: At least 1200x400px
- **Thumbnail Images**: At least 200x200px

### 3. Example Payloads

#### Product Image (Will be Validated)
```json
{
  "items": {
    "product_1": {
      "type": "Product",
      "title": { "default": "Burger" },
      "price": "25.00",
      "images": {
        "img_1": { "id": "img_1", "type": "Image" }
      }
    },
    "img_1": {
      "type": "Image",
      "url": "https://example.com/burger.jpg"
    }
  }
}
```
✅ This image **will be validated** because it's a product image.

#### Logo Image (Will be Skipped)
```json
{
  "items": {
    "RESTAURENT_IMAGE": {
      "id": "RESTAURENT_IMAGE",
      "type": "Image",
      "url": "https://images.deliveryhero.io/image/menu-import-gateway-prd/regions/ME/chains/tlbt-tmbill/d40f9af99a6368db081627a44acbecf8.png",
      "alt": {
        "default": "Store Logo",
        "ar": "شعار المتجر"
      }
    }
  }
}
```
⏭️ This image **will be skipped** because:
- ID contains `RESTAURANT_IMAGE`
- Alt text contains `Logo`

### 4. Validation Response

If validation fails, you'll receive detailed error information:

```json
{
  "validation": {
    "isValid": false,
    "requestType": "Menu Push",
    "errors": [
      "[items.img_1.url] Image area (20.00Mpx² from 5000x4000px) exceeds maximum allowed (16Mpx²)"
    ],
    "errorCodes": ["INVALID_IMAGE_DIMENSIONS"],
    "detailedErrors": [
      {
        "path": "items.img_1.url",
        "message": "Image area (20.00Mpx² from 5000x4000px) exceeds maximum allowed (16Mpx²)",
        "errorCode": "INVALID_IMAGE_DIMENSIONS",
        "received": "5000x4000",
        "expected": "at least 800px wide, at least 800px tall, max area 16Mpx², max 20MB",
        "fixSuggestion": "Ensure the image meets the required dimensions: at least 800px wide, at least 800px tall, max area 16Mpx², max 20MB"
      }
    ]
  }
}
```

## Programmatic Usage

### Using the Validation Utility Directly

You can also use the image validation utility in your own code:

```typescript
import { validateImageUrl, TALABAT_IMAGE_CRITERIA } from '@/lib/image-validator';

// Validate a single image
const result = await validateImageUrl(
  'https://example.com/image.jpg',
  TALABAT_IMAGE_CRITERIA.product
);

if (!result.isValid) {
  console.error('Validation errors:', result.errors);
  console.log('Dimensions:', result.dimensions); // { width: 500, height: 300 }
}
```

### Custom Validation Criteria

```typescript
import { validateImageUrl } from '@/lib/image-validator';

const customCriteria = {
  minWidth: 1000,
  minHeight: 500,
  maxArea: 10, // 10 Megapixels squared
  aspectRatio: 2, // 2:1 ratio
  aspectRatioTolerance: 0.05,
  maxFileSize: 10 * 1024 * 1024, // 10MB
};

const result = await validateImageUrl(imageUrl, customCriteria);
```

### Batch Validation

```typescript
import { validateImageUrls, TALABAT_IMAGE_CRITERIA } from '@/lib/image-validator';

const urls = [
  'https://example.com/image1.jpg',
  'https://example.com/image2.jpg',
  'https://example.com/image3.jpg',
];

const results = await validateImageUrls(urls, TALABAT_IMAGE_CRITERIA.product);

for (const [url, result] of results.entries()) {
  if (!result.isValid) {
    console.error(`${url}: ${result.errors.join(', ')}`);
  }
}
```

## Integration with Schema Validation

The image dimension validation is performed **after** schema validation:

1. **Schema Validation**: Checks structure, required fields, data types
2. **Automatic Detection**: Scans payload for image URLs with file extensions
3. **Dimension Validation** (if detected or enabled): Fetches and analyzes actual images

This multi-step approach ensures:
- Fast feedback for basic errors (no network calls needed)
- Automatic validation when images are present
- Comprehensive validation without manual configuration
- Smart detection based on actual content

## Performance Considerations

- Image validation requires fetching the actual image files
- Validation is performed in parallel for multiple images
- Each image fetch may take 100ms-2s depending on image size and network
- Consider using dimension validation only in testing/staging environments
- For production, validate images before sending to the API

## Error Codes

| Error Code | Description |
|------------|-------------|
| `INVALID_IMAGE_DIMENSIONS` | Image doesn't meet size/aspect ratio requirements |
| `IMAGE_VALIDATION_ERROR` | Failed to fetch or analyze the image |
| `INVALID_IMAGE_URL` | URL format is invalid or incomplete |

## Best Practices

1. **Pre-validate Images**: Check dimensions before uploading to your CDN
2. **Use Appropriate Sizes**: Follow Talabat's recommended image sizes
3. **Optimize File Sizes**: Compress images to reduce file size while maintaining quality
4. **Automatic Validation**: The system automatically validates images with proper file extensions
5. **Test Thoroughly**: Use the simulator during development - validation runs automatically
6. **Handle Errors**: Provide clear feedback to users when images don't meet requirements
7. **Use Proper Extensions**: Ensure image URLs have correct file extensions for automatic detection

## Technical Details

### Supported Environments

- ✅ **Browser**: Uses native `Image` element for dimension detection
- ✅ **Node.js**: Uses `image-size` library for server-side validation
- ✅ **Next.js API Routes**: Works seamlessly in API routes

### Supported Image Formats

- JPEG (.jpg, .jpeg)
- PNG (.png)
- WebP (.webp)
- GIF (.gif)
- SVG (.svg)
- BMP (.bmp)
- TIFF (.tiff)
- ICO (.ico)
- HEIC/HEIF (.heic, .heif)

## Troubleshooting

### "Failed to fetch image"
- Ensure the URL is publicly accessible
- Check CORS settings if fetching from a different domain
- Verify the image URL is complete and valid

### "Neither image-size nor sharp library is available"
- Run `npm install` to ensure dependencies are installed
- The `image-size` package should be in your `package.json`

### Validation is slow
- Image validation requires downloading images
- Consider validating only in development/testing
- Use smaller images or optimize your CDN response times

## Examples

See the API Simulator in the application for live examples of image validation in action.
