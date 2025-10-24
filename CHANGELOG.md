# Changelog

## [Latest] - 2025-10-24 (Updated)

### 🐛 Bug Fix: Logo Exclusion

#### Problem
Dimension validation was being applied to all images, including logos and brand images, which should not be subject to product image dimension requirements.

#### Solution
- **Automatic Logo Detection**: System now identifies and excludes logo images from dimension validation
- **Detection Patterns**: Checks both image ID and alt text for logo indicators
- **Patterns Used**: `logo`, `restaurant_image`, `store_image`, `brand`, `icon` (case-insensitive)

#### Example
```json
{
  "RESTAURENT_IMAGE": {
    "id": "RESTAURENT_IMAGE",
    "type": "Image",
    "url": "https://example.com/logo.png",
    "alt": {
      "default": "Store Logo"
    }
  }
}
```
⏭️ This image is now **automatically skipped** from dimension validation.

#### Files Updated
- `/src/lib/talabat-api-schemas.ts`: Added logo detection in `validateImageDimensions()`
- `/src/app/api/simulator/[id]/route.ts`: Added logo detection in `checkForImageUrls()`
- Documentation updated with logo exclusion examples

---

## [Earlier Today] - 2025-10-24

### ✨ New Features

#### Automatic Image Dimension Validation
- **Automatic Detection**: Image dimension validation now runs automatically when the payload contains image URLs with file extensions
- **Smart Detection**: System scans for image URLs with extensions: `.jpg`, `.jpeg`, `.png`, `.gif`, `.webp`, `.svg`, `.bmp`, `.tiff`, `.heic`, `.heif`
- **No Configuration Needed**: Validation happens automatically without requiring query parameters
- **Manual Override**: Can still explicitly enable with `?validateDimensions=true` query parameter

#### Dashboard Visibility
- **Header Navigation**: Added Dashboard button to the header for easy access
- **Always Visible**: Dashboard is now accessible from any page via the header
- **Icon**: Uses LayoutDashboard icon for clear visual identification

### 🔧 Improvements

#### Image Validation Criteria
- **Updated to Official Guidelines**: Implemented Talabat's official image quality requirements
- **Maximum File Size**: Increased from 5MB to 20MB
- **Area-Based Validation**: Added 16Mpx² maximum area constraint
- **Flexible Dimensions**: Allows images > 4000px in one dimension if total area ≤ 16Mpx²

#### Validation Logic
- **Area Calculation**: `Area (Mpx²) = (Width × Height) / 1,000,000`
- **Smart Rules**:
  - ✅ < 4000px in both dimensions → Always accepted
  - ⚠️ > 4000px in one dimension → Accepted if area ≤ 16Mpx²
  - ❌ > 4000px in both dimensions → Rejected

### 🐛 Bug Fixes

- **Dashboard Navigation**: Fixed issue where dashboard was not accessible from main page
- **Next.js 15 Compatibility**: Fixed async params warnings in API routes
- **Validation Trigger**: Removed requirement for manual query parameter

### 📝 Documentation Updates

- **IMAGE_VALIDATION_GUIDE.md**: Updated with automatic validation behavior
- **test-image-validation.md**: Added examples for automatic detection
- **CHANGELOG.md**: Created to track changes

### 🔍 Technical Details

#### Files Modified
1. `/src/app/api/simulator/[id]/route.ts`
   - Added `checkForImageUrls()` helper function
   - Implemented automatic validation trigger
   - Fixed async params for Next.js 15

2. `/src/components/header.tsx`
   - Added Dashboard navigation button
   - Improved layout with justify-between

3. `/src/lib/image-validator.ts`
   - Added `maxArea` validation criteria
   - Updated `TALABAT_IMAGE_CRITERIA` presets
   - Implemented area calculation logic

4. `/src/lib/talabat-api-schemas.ts`
   - Updated `formatCriteriaExpectation()` to include area
   - Enhanced error messages with area information

#### Validation Flow
```
1. Request received
2. Parse JSON body
3. Run schema validation
4. Check for image URLs with extensions
5. If found → Run dimension validation automatically
6. Return combined validation results
```

### 📊 Examples

#### Accepted Images
- 4000×4000 = 16Mpx² ✅ (at limit)
- 3000×3000 = 9Mpx² ✅
- 6000×2000 = 12Mpx² ✅ (one dimension > 4000px, but area OK)

#### Rejected Images
- 5000×4000 = 20Mpx² ❌ (exceeds 16Mpx²)
- 6000×3000 = 18Mpx² ❌ (exceeds 16Mpx²)

### 🚀 Usage

#### Before (Manual)
```bash
POST /api/simulator/{id}?validateDimensions=true
```

#### After (Automatic)
```bash
POST /api/simulator/{id}
# Validation runs automatically if payload contains image URLs with extensions
```

### 🎯 Benefits

1. **Zero Configuration**: No need to remember query parameters
2. **Smart Detection**: Only validates when images are present
3. **Better UX**: Automatic validation provides immediate feedback
4. **Flexible**: Can still manually override if needed
5. **Performance**: Only fetches images when necessary

---

## Previous Changes

### Dashboard Navigation Fix
- Removed Dashboard tab from main page tabs
- Dashboard remains accessible via separate `/dashboard` route
- Fixed tab system to work correctly with 4 tabs

### Image Validation Implementation
- Created image validation utility
- Added support for dimension, area, and file size validation
- Implemented Talabat-specific validation criteria
- Added comprehensive documentation
