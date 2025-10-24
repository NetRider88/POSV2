# Image Validation Test Examples

## Test Cases for Talabat Image Validation

### 🏷️ Logo Images (Automatically Skipped)

Logo and brand images are **automatically excluded** from dimension validation:

```json
{
  "items": {
    "RESTAURENT_IMAGE": {
      "id": "RESTAURENT_IMAGE",
      "type": "Image",
      "url": "https://example.com/logo.png",
      "alt": {
        "default": "Store Logo"
      }
    }
  }
}
```
- **Status**: ⏭️ Skipped (not validated)
- **Reason**: ID contains `RESTAURANT_IMAGE` and alt contains `Logo`

**Logo Detection Patterns**:
- ID contains: `logo`, `restaurant_image`, `store_image`, `brand`, `icon`
- Alt text contains: `logo`, `restaurant`, `store`, `brand`, `icon`

---

### ✅ Valid Images (Should Pass)

#### 1. Standard Product Image (3000x3000 = 9Mpx²)
```json
{
  "items": {
    "img_1": {
      "type": "Image",
      "url": "https://example.com/product-3000x3000.jpg"
    }
  }
}
```
- **Area**: 9Mpx² (within 16Mpx² limit)
- **Status**: ✅ Pass

#### 2. Wide Banner (6000x2000 = 12Mpx²)
```json
{
  "items": {
    "img_1": {
      "type": "Image",
      "url": "https://example.com/banner-6000x2000.jpg"
    }
  }
}
```
- **Area**: 12Mpx² (within 16Mpx² limit)
- **Status**: ✅ Pass (one dimension > 4000px, but area is OK)

#### 3. Maximum Size (4000x4000 = 16Mpx²)
```json
{
  "items": {
    "img_1": {
      "type": "Image",
      "url": "https://example.com/max-4000x4000.jpg"
    }
  }
}
```
- **Area**: 16Mpx² (exactly at the limit)
- **Status**: ✅ Pass

---

### ❌ Invalid Images (Should Fail)

#### 1. Too Large Area (5000x4000 = 20Mpx²)
```json
{
  "items": {
    "img_1": {
      "type": "Image",
      "url": "https://example.com/large-5000x4000.jpg"
    }
  }
}
```
- **Area**: 20Mpx² (exceeds 16Mpx² limit)
- **Status**: ❌ Fail
- **Error**: `Image area (20.00Mpx² from 5000x4000px) exceeds maximum allowed (16Mpx²)`

#### 2. Both Dimensions > 4000px (6000x3000 = 18Mpx²)
```json
{
  "items": {
    "img_1": {
      "type": "Image",
      "url": "https://example.com/oversized-6000x3000.jpg"
    }
  }
}
```
- **Area**: 18Mpx² (exceeds 16Mpx² limit)
- **Status**: ❌ Fail
- **Error**: `Image area (18.00Mpx² from 6000x3000px) exceeds maximum allowed (16Mpx²)`

#### 3. Too Small for Product (500x500 = 0.25Mpx²)
```json
{
  "items": {
    "product_1": {
      "type": "Product",
      "title": { "default": "Test Product" },
      "price": "10.00",
      "images": {
        "img_1": { "id": "img_1", "type": "Image" }
      }
    },
    "img_1": {
      "type": "Image",
      "url": "https://example.com/small-500x500.jpg"
    }
  }
}
```
- **Area**: 0.25Mpx² (within area limit)
- **Dimensions**: Below recommended 800x800px minimum
- **Status**: ❌ Fail
- **Error**: `Image width (500px) is less than minimum required (800px)`

---

## How to Test

### Using cURL

```bash
# Test with automatic dimension validation (detects image extension)
curl -X POST http://localhost:9002/api/simulator/test-id \
  -H "Content-Type: application/json" \
  -d '{
    "items": {
      "img_1": {
        "type": "Image",
        "url": "https://picsum.photos/5000/4000.jpg"
      }
    }
  }'

# Or explicitly enable validation
curl -X POST http://localhost:9002/api/simulator/test-id?validateDimensions=true \
  -H "Content-Type: application/json" \
  -d '{
    "items": {
      "img_1": {
        "type": "Image",
        "url": "https://picsum.photos/5000/4000"
      }
    }
  }'
```

### Using the API Simulator UI

1. Navigate to the **API Simulator** tab
2. Select **Menu Push** as the request type
3. Use the payload generator or paste a test payload with image URLs
4. **Automatic**: If your image URLs have file extensions (`.jpg`, `.png`, etc.), validation runs automatically
5. **Manual**: Add the query parameter `?validateDimensions=true` to force validation
6. Click **Send Request**
7. Check the validation results in the response

---

## Quick Reference

| Scenario | Width | Height | Area | Result |
|----------|-------|--------|------|--------|
| Small product | 500px | 500px | 0.25Mpx² | ❌ Too small |
| Standard product | 1000px | 1000px | 1Mpx² | ✅ Pass |
| Large product | 3000px | 3000px | 9Mpx² | ✅ Pass |
| Maximum square | 4000px | 4000px | 16Mpx² | ✅ Pass (limit) |
| Wide banner | 6000px | 2000px | 12Mpx² | ✅ Pass |
| Tall banner | 2000px | 6000px | 12Mpx² | ✅ Pass |
| Too large | 5000px | 4000px | 20Mpx² | ❌ Exceeds area |
| Both > 4000px | 6000px | 3000px | 18Mpx² | ❌ Exceeds area |
| Extreme wide | 8000px | 1000px | 8Mpx² | ✅ Pass (area OK) |

---

## Testing with Real Images

You can use these free image services for testing:

- **Lorem Picsum**: `https://picsum.photos/{width}/{height}`
  - Example: `https://picsum.photos/4000/4000` (16Mpx²)
  - Example: `https://picsum.photos/5000/4000` (20Mpx² - should fail)

- **Placeholder.com**: `https://via.placeholder.com/{width}x{height}`
  - Example: `https://via.placeholder.com/3000x3000` (9Mpx²)

**Note**: These services may have their own size limits. For testing very large images, you may need to use actual image URLs from your CDN.
