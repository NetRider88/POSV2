import { z } from 'zod';

// Base schema for menu items, categories, etc. within the 'items' object
const itemSchema = z.object({
  id: z.string(),
  type: z.string(),
  title: z.object({
    default: z.string().nullable(),
  }).optional(),
  // Allow other properties as they vary between item types
}).passthrough();

// Schema for the entire menu payload, focusing on the top-level 'items' key
const menuPushSchema = z.object({
  items: z.record(itemSchema),
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

export type ValidationResult = {
  isValid: boolean;
  requestType: 'Menu Push' | 'Order Payload' | 'Unknown';
  errors: string[] | null;
};

// Function to validate a request body against the schemas
export function validateRequest(body: any): ValidationResult {
  // Try to identify and validate as a Menu Push by checking for the 'items' key
  if (body && body.items) {
    const result = menuPushSchema.safeParse(body);
    if (result.success) {
      return { isValid: true, requestType: 'Menu Push', errors: null };
    }
    return {
      isValid: false,
      requestType: 'Menu Push',
      errors: result.error.errors.map((e) => `[${e.path.join('.')}] ${e.message}`),
    };
  }

  // Try to identify and validate as an Order Payload
  if (body && body.orderId) {
    const result = orderPayloadSchema.safeParse(body);
    if (result.success) {
      return { isValid: true, requestType: 'Order Payload', errors: null };
    }
    return {
      isValid: false,
      requestType: 'Order Payload',
      errors: result.error.errors.map((e) => `[${e.path.join('.')}] ${e.message}`),
    };
  }

  // If neither matches, return an 'Unknown' result
  return {
    isValid: false,
    requestType: 'Unknown',
    errors: ['Could not determine the request type. Ensure the payload has an `items` or `orderId` top-level key.'],
  };
}
