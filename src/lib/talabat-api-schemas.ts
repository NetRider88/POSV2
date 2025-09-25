import { z } from 'zod';

// Schema for a single menu item
const menuItemSchema = z.object({
  id: z.string().min(1, 'Item ID cannot be empty.'),
  name: z.string().min(1, 'Item name cannot be empty.'),
  description: z.string().optional(),
  price: z.number().positive('Price must be a positive number.'),
  imageUrl: z.string().url('Image URL must be a valid URL.').optional(),
});

// Schema for a menu category
const categorySchema = z.object({
  id: z.string().min(1, 'Category ID cannot be empty.'),
  name: z.string().min(1, 'Category name cannot be empty.'),
  items: z.array(menuItemSchema).min(1, 'Category must have at least one item.'),
});

// Schema for the entire menu payload
const menuPushSchema = z.object({
  menu: z.object({
    id: z.string().min(1, 'Menu ID cannot be empty.'),
    name: z.string().min(1, 'Menu name cannot be empty.'),
    categories: z.array(categorySchema).min(1, 'Menu must have at least one category.'),
  }),
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
  // Try to identify and validate as a Menu Push
  if (body && body.menu) {
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
    errors: ['Could not determine the request type. Ensure the payload has a `menu` or `orderId` top-level key.'],
  };
}
