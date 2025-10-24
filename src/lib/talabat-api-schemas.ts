import { z } from 'zod';
import { validateImageUrl, TALABAT_IMAGE_CRITERIA, type ImageValidationCriteria } from './image-validator';

// Shared schema for localized strings (e.g., title, description)
const localizedStringSchema = z.object({
  default: z.string().min(1, { message: 'Default translation is required.' }),
}).catchall(z.string());

// Schema for a reference to another item (e.g., Product in a Menu)
const itemReferenceSchema = z.object({
  id: z.string(),
  type: z.string(),
});

// Schema for a Menu item
const menuSchema = z.object({
  type: z.literal('Menu'),
  title: localizedStringSchema,
  menuType: z.enum(['DELIVERY', 'DINE_IN', 'PICK_UP'], {
    errorMap: () => ({ message: 'Invalid menuType. Must be one of: DELIVERY, DINE_IN, PICK_UP' })
  }),
  products: z.record(itemReferenceSchema).refine((products: Record<string, any>) => Object.keys(products).length > 0, { message: "Menu must contain at least one product." }),
  schedule: z.record(itemReferenceSchema).optional(),
  active: z.boolean().optional().default(true),
  images: z.record(itemReferenceSchema).optional(),
}).passthrough();

// Schema for a Product item
const productSchema = z.object({
  type: z.literal('Product'),
  title: localizedStringSchema,
  price: z.string().min(1, { message: "Product must have a price." }),
  description: localizedStringSchema.optional(),
  images: z.record(itemReferenceSchema).optional(),
  active: z.boolean().optional().default(true),
  toppings: z.record(itemReferenceSchema).optional(),
}).passthrough();

// Schemas for other item types (can be expanded later)
const categorySchema = z.object({ type: z.literal('Category') }).passthrough();
const toppingSchema = z.object({ type: z.literal('Topping') }).passthrough();
const imageSchema = z.object({
  type: z.literal('Image'),
  url: z.string()
    .url({ message: "Image URL must be a valid URL." })
    .refine(
      (url) => {
        // Check if URL has a proper file extension or is from a known image CDN pattern
        const hasImageExtension = /\.(jpg|jpeg|png|gif|webp|svg|bmp|ico|tiff|heic|heif)(\?.*)?$/i.test(url);
        const isDeliveryHeroPattern = /deliveryhero\.io\/image\/.*\/.+\..+$/i.test(url);
        const hasMinimumLength = url.length > 30; // Suspiciously short URLs are likely incomplete
        
        return hasImageExtension || (isDeliveryHeroPattern && hasMinimumLength);
      },
      { message: "Image URL appears to be incomplete or missing a file extension. Expected formats: .jpg, .jpeg, .png, .gif, .webp, .svg" }
    )
}).passthrough();
const scheduleEntrySchema = z.object({ type: z.literal('ScheduleEntry') }).passthrough();

// A discriminated union to validate any given item based on its 'type' field
const anyItemSchema = z.discriminatedUnion('type', [
  menuSchema,
  productSchema,
  categorySchema,
  toppingSchema,
  imageSchema,
  scheduleEntrySchema,
]);

// Schema for the entire menu payload, focusing on the top-level 'items' key
const menuPushSchema = z.object({
  items: z.record(anyItemSchema),
});

// Schema for an order item
const orderItemSchema = z.object({
  id: z.string().min(1, 'Item ID cannot be empty.'),
  quantity: z.number().int().positive('Quantity must be a positive integer.'),
  price: z.number().positive('Price must be a positive number.'),
  specialInstructions: z.string().optional(),
});

// Schema for the order payload
const orderPayloadSchema = z.object({
  orderId: z.string().min(1, 'Order ID cannot be empty.'),
  customerDetails: z.object({
    name: z.string().min(1, 'Customer name cannot be empty.'),
    phone: z.string().min(1, 'Customer phone cannot be empty.'),
  }),
  items: z.array(orderItemSchema).min(1, 'Order must have at least one item.'),
  totalAmount: z.number().positive('Total amount must be a positive number.'),
  currency: z.string().length(3, 'Currency must be a 3-letter code (e.g., AED).'),
});

// Error code mapping
const ERROR_MAPPING = {
  'Menu Push': {
    'items': 'MISSING_ITEMS',
    'title.default': 'MISSING_TITLE',
    'menuType': 'INVALID_MENU_TYPE',
    'products': 'MISSING_PRODUCTS',
    'active': 'INVALID_ACTIVE_STATUS',
    'images.url': 'INVALID_IMAGE_URL',
    'url': 'INVALID_IMAGE_URL'
  },
  'Order Payload': {
    'orderId': 'MISSING_ORDER_ID',
    'customerDetails.name': 'MISSING_CUSTOMER_NAME',
    'customerDetails.phone': 'MISSING_CUSTOMER_PHONE',
    'items': 'MISSING_ORDER_ITEMS',
    'items.*.id': 'INVALID_ITEM_ID',
    'items.*.quantity': 'INVALID_ITEM_QUANTITY',
    'items.*.price': 'INVALID_ITEM_PRICE',
    'totalAmount': 'INVALID_TOTAL_AMOUNT',
    'currency': 'INVALID_CURRENCY_CODE'
  }
};

export type ValidationError = {
  path: string;
  message: string;
  errorCode: string;
  received?: any;
  expected?: string;
  fixSuggestion?: string;
};

export type ValidationResult = {
  isValid: boolean;
  requestType: 'Menu Push' | 'Order Payload' | 'Unknown';
  errors: string[] | null;
  errorCodes?: string[];
  detailedErrors?: ValidationError[]; // Detailed errors with fix suggestions
};

// Function to get error code from mapping
const getErrorCode = (requestType: string, path: string) => {
  const mapping = ERROR_MAPPING[requestType as keyof typeof ERROR_MAPPING];
  
  // Try exact match first
  if (mapping[path as keyof typeof mapping]) {
    return mapping[path as keyof typeof mapping];
  }
  
  // Try to match patterns for nested paths
  const pathParts = path.split('.');
  const lastPart = pathParts[pathParts.length - 1];
  
  // Check if the last part of the path matches any key
  if (mapping[lastPart as keyof typeof mapping]) {
    return mapping[lastPart as keyof typeof mapping];
  }
  
  // Check for wildcard patterns
  for (const key in mapping) {
    if (key.includes('*') && path.includes(key.replace('.*', ''))) {
      return mapping[key as keyof typeof mapping];
    }
  }
  
  return 'UNKNOWN_ERROR';
};

// Function to generate fix suggestions based on error type
const generateFixSuggestion = (error: any, requestType: string): string => {
  const path = error.path.join('.');
  const message = error.message.toLowerCase();
  
  // Type mismatch errors
  if (message.includes('expected string, received object')) {
    if (path.includes('images')) {
      return `Change the value to an object with 'id' and 'type' fields. Example: {"id": "image_123", "type": "Image"}`;
    }
    return `Expected a string value, but received an object. Convert the object to a string or check the field type.`;
  }
  
  if (message.includes('expected object, received string')) {
    return `Expected an object, but received a string. Ensure the value is a properly structured object.`;
  }
  
  // Missing required fields
  if (message.includes('required')) {
    return `This field is required. Add the missing field to your payload.`;
  }
  
  // Invalid URL
  if (message.includes('invalid url') || message.includes('incomplete') || message.includes('file extension')) {
    return `Provide a complete, valid image URL with a proper file extension (e.g., .jpg, .png, .webp). The URL appears to be incomplete or corrupted.`;
  }
  
  // Menu type errors
  if (path.includes('menuType')) {
    return `Use one of the valid menu types: 'DELIVERY', 'DINE_IN', or 'PICK_UP'`;
  }
  
  // Empty arrays/objects
  if (message.includes('at least one')) {
    return `This collection must contain at least one item. Add the required items.`;
  }
  
  // Number validation
  if (message.includes('positive')) {
    return `Provide a positive number greater than 0.`;
  }
  
  // Currency code
  if (path.includes('currency')) {
    return `Use a 3-letter ISO currency code (e.g., 'AED', 'USD', 'EUR').`;
  }
  
  return `Review the API documentation for the correct format of this field.`;
};

// Function to get expected type/format description
const getExpectedFormat = (error: any): string => {
  const path = error.path.join('.');
  const message = error.message.toLowerCase();
  
  if (message.includes('expected string')) return 'string';
  if (message.includes('expected object')) return 'object';
  if (message.includes('expected number')) return 'number';
  if (message.includes('expected boolean')) return 'boolean';
  if (message.includes('expected array')) return 'array';
  
  if (path.includes('images') && !path.includes('url')) return 'object with {id: string, type: string}';
  if (path.includes('url')) return 'complete URL with file extension (.jpg, .png, etc.)';
  if (path.includes('menuType')) return 'one of: DELIVERY, DINE_IN, PICK_UP';
  if (path.includes('currency')) return '3-letter currency code';
  if (path.includes('url')) return 'complete URL with image file extension';
  
  return 'see documentation';
};

// Function to validate a request body against the schemas
export function validateRequest(body: any): ValidationResult {
  // Try to identify and validate as a Menu Push by checking for the 'items' key
  if (body && body.items && typeof body.items === 'object' && !body.orderId) {
    const result = menuPushSchema.safeParse(body);
    if (result.success) {
      return { isValid: true, requestType: 'Menu Push', errors: null };
    }

    // Map errors to codes and create detailed errors
    const errorCodes = result.error.errors.map((e) => {
      const path = e.path.join('.');
      return getErrorCode('Menu Push', path);
    });
    
    const detailedErrors: ValidationError[] = result.error.errors.map((e) => {
      const path = e.path.join('.');
      return {
        path,
        message: e.message,
        errorCode: getErrorCode('Menu Push', path),
        received: (e as any).received,
        expected: getExpectedFormat(e),
        fixSuggestion: generateFixSuggestion(e, 'Menu Push')
      };
    });

    return {
      isValid: false,
      requestType: 'Menu Push',
      errors: result.error.errors.map((e) => `[${e.path.join('.')}] ${e.message}`),
      errorCodes,
      detailedErrors
    };
  }

  // Try to identify and validate as an Order Payload
  if (body && body.orderId) {
    const result = orderPayloadSchema.safeParse(body);
    if (result.success) {
      return { isValid: true, requestType: 'Order Payload', errors: null };
    }

    // Map errors to codes and create detailed errors
    const errorCodes = result.error.errors.map((e) => {
      const path = e.path.join('.');
      return getErrorCode('Order Payload', path);
    });
    
    const detailedErrors: ValidationError[] = result.error.errors.map((e) => {
      const path = e.path.join('.');
      return {
        path,
        message: e.message,
        errorCode: getErrorCode('Order Payload', path),
        received: (e as any).received,
        expected: getExpectedFormat(e),
        fixSuggestion: generateFixSuggestion(e, 'Order Payload')
      };
    });

    return {
      isValid: false,
      requestType: 'Order Payload',
      errors: result.error.errors.map((e) => `[${e.path.join('.')}] ${e.message}`),
      errorCodes,
      detailedErrors
    };
  }

  // If neither matches, return an 'Unknown' result
  return {
    isValid: false,
    requestType: 'Unknown',
    errors: ['Could not determine the request type. Ensure the payload has an `items` or `orderId` top-level key.'],
    errorCodes: ['UNKNOWN_REQUEST_TYPE']
  };
}

/**
 * Validates image dimensions for all images in a menu push payload
 * This is an async validation that should be called after schema validation
 */
export async function validateImageDimensions(
  body: any,
  criteria: ImageValidationCriteria = TALABAT_IMAGE_CRITERIA.product
): Promise<ValidationResult> {
  const errors: string[] = [];
  const errorCodes: string[] = [];
  const detailedErrors: ValidationError[] = [];

  // Only validate Menu Push payloads
  if (!body || !body.items || typeof body.items !== 'object') {
    return {
      isValid: true,
      requestType: 'Unknown',
      errors: null,
    };
  }

  // Extract all image URLs from the payload (excluding logos)
  const imageUrls: Array<{ url: string; path: string }> = [];

  // Patterns to identify logo images (case-insensitive)
  const logoPatterns = [
    /logo/i,
    /restaurant.*image/i,
    /store.*image/i,
    /brand/i,
    /icon/i,
  ];

  for (const [itemId, item] of Object.entries(body.items)) {
    if (item && typeof item === 'object' && 'type' in item) {
      // Check if this is an Image type
      if (item.type === 'Image' && 'url' in item && typeof item.url === 'string') {
        // Check if this is a logo image
        const isLogo = logoPatterns.some(pattern => {
          // Check item ID
          if (pattern.test(itemId)) return true;
          
          // Check alt text if available
          const itemWithAlt = item as any;
          if (itemWithAlt.alt && typeof itemWithAlt.alt === 'object') {
            const altValues = Object.values(itemWithAlt.alt);
            return altValues.some(altText => 
              typeof altText === 'string' && pattern.test(altText)
            );
          }
          
          return false;
        });

        // Only validate non-logo images
        if (!isLogo) {
          imageUrls.push({
            url: item.url,
            path: `items.${itemId}.url`,
          });
        }
      }
    }
  }

  // If no images found, return valid
  if (imageUrls.length === 0) {
    return {
      isValid: true,
      requestType: 'Menu Push',
      errors: null,
    };
  }

  // Validate each image
  const validationPromises = imageUrls.map(async ({ url, path }) => {
    try {
      const result = await validateImageUrl(url, criteria);
      
      if (!result.isValid) {
        result.errors.forEach((error) => {
          errors.push(`[${path}] ${error}`);
          errorCodes.push('INVALID_IMAGE_DIMENSIONS');
          detailedErrors.push({
            path,
            message: error,
            errorCode: 'INVALID_IMAGE_DIMENSIONS',
            received: result.dimensions ? `${result.dimensions.width}x${result.dimensions.height}` : 'unknown',
            expected: formatCriteriaExpectation(criteria),
            fixSuggestion: `Ensure the image meets the required dimensions: ${formatCriteriaExpectation(criteria)}`,
          });
        });
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      errors.push(`[${path}] Failed to validate image: ${errorMessage}`);
      errorCodes.push('IMAGE_VALIDATION_ERROR');
      detailedErrors.push({
        path,
        message: `Failed to validate image: ${errorMessage}`,
        errorCode: 'IMAGE_VALIDATION_ERROR',
        fixSuggestion: 'Ensure the image URL is accessible and points to a valid image file.',
      });
    }
  });

  await Promise.all(validationPromises);

  return {
    isValid: errors.length === 0,
    requestType: 'Menu Push',
    errors: errors.length > 0 ? errors : null,
    errorCodes,
    detailedErrors: detailedErrors.length > 0 ? detailedErrors : undefined,
  };
}

/**
 * Helper function to format criteria into a readable expectation string
 */
function formatCriteriaExpectation(criteria: ImageValidationCriteria): string {
  const parts: string[] = [];

  if (criteria.minWidth || criteria.maxWidth) {
    const widthRange = criteria.minWidth && criteria.maxWidth
      ? `${criteria.minWidth}-${criteria.maxWidth}px wide`
      : criteria.minWidth
      ? `at least ${criteria.minWidth}px wide`
      : `at most ${criteria.maxWidth}px wide`;
    parts.push(widthRange);
  }

  if (criteria.minHeight || criteria.maxHeight) {
    const heightRange = criteria.minHeight && criteria.maxHeight
      ? `${criteria.minHeight}-${criteria.maxHeight}px tall`
      : criteria.minHeight
      ? `at least ${criteria.minHeight}px tall`
      : `at most ${criteria.maxHeight}px tall`;
    parts.push(heightRange);
  }

  if (criteria.maxArea) {
    parts.push(`max area ${criteria.maxArea}Mpx²`);
  }

  if (criteria.aspectRatio) {
    parts.push(`aspect ratio ${criteria.aspectRatio.toFixed(2)}`);
  }

  if (criteria.maxFileSize) {
    parts.push(`max ${(criteria.maxFileSize / 1024 / 1024).toFixed(0)}MB`);
  }

  return parts.join(', ');
}
