import { z } from 'zod';

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
    products: z.record(itemReferenceSchema).refine((products) => Object.keys(products).length > 0, {message: "Menu must contain at least one product."}),
    schedule: z.record(itemReferenceSchema).optional(),
}).passthrough();


// Schema for a Product item
const productSchema = z.object({
    type: z.literal('Product'),
    title: localizedStringSchema,
    price: z.string().min(1, {message: "Product must have a price."}),
    description: localizedStringSchema.optional(),
    images: z.record(itemReferenceSchema).optional(),
    active: z.boolean().optional().default(true),
    toppings: z.record(itemReferenceSchema).optional(),
}).passthrough();

// Schemas for other item types (can be expanded later)
const categorySchema = z.object({ type: z.literal('Category') }).passthrough();
const toppingSchema = z.object({ type: z.literal('Topping') }).passthrough();
const imageSchema = z.object({ type: z.literal('Image') }).passthrough();
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

export type ValidationResult = {
  isValid: boolean;
  requestType: 'Menu Push' | 'Order Payload' | 'Unknown';
  errors: string[] | null;
};

// Function to validate a request body against the schemas
export function validateRequest(body: any): ValidationResult {
  // Try to identify and validate as a Menu Push by checking for the 'items' key
  if (body && body.items && typeof body.items === 'object' && !body.orderId) {
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
