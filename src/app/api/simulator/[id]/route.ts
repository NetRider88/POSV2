// IMPORTANT: This file should not be used in production.
// It is a simple mock server for demonstration purposes.
// In a real-world application, you would use a more robust solution for handling webhooks,
// potentially involving a message queue or a dedicated service.

import { validateRequest, validateImageDimensions, ValidationResult } from '@/lib/talabat-api-schemas';
import { TALABAT_IMAGE_CRITERIA } from '@/lib/image-validator';

type Client = {
  controller: ReadableStreamDefaultController<any>;
  heartbeat: NodeJS.Timeout;
};

// A simple in-memory store for clients.
// In a real app, you'd use a database or a pub/sub system.
const clients = new Map<string, Client[]>();

// In-memory storage for test results
export const testResults: any[] = [];

/**
 * Check if the payload contains any product/menu image URLs with image extensions
 * Excludes logos and brand images
 */
function checkForImageUrls(body: any): boolean {
  if (!body || !body.items || typeof body.items !== 'object') {
    return false;
  }

  // Image extensions to check for
  const imageExtensions = /\.(jpg|jpeg|png|gif|webp|svg|bmp|ico|tiff|heic|heif)(\?.*)?$/i;
  
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
      // Check if this is an Image type with a URL
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

        // Only count non-logo images
        if (!isLogo && imageExtensions.test(item.url)) {
          return true;
        }
      }
    }
  }

  return false;
}

function sendEvent(id: string, data: any) {
  const clientConnections = clients.get(id);
  if (clientConnections) {
    const eventString = `data: ${JSON.stringify(data)}\n\n`;
    const encoder = new TextEncoder();
    const encodedEvent = encoder.encode(eventString);

    clientConnections.forEach((client) => {
      try {
        client.controller.enqueue(encodedEvent);
      } catch (e) {
        // Client disconnected
        removeClient(id, client);
      }
    });
  }
}

function addClient(id: string, client: Client) {
  if (!clients.has(id)) {
    clients.set(id, []);
  }
  clients.get(id)?.push(client);
}

function removeClient(id: string, clientToRemove: Client) {
  const clientConnections = clients.get(id);
  if (clientConnections) {
    clearInterval(clientToRemove.heartbeat); // Stop the heartbeat
    const index = clientConnections.findIndex(client => client.controller === clientToRemove.controller);
    if (index !== -1) {
      clientConnections.splice(index, 1);
    }
    if (clientConnections.length === 0) {
      clients.delete(id);
    }
  }
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  
  const stream = new ReadableStream({
    async start(controller) {
       // Send a comment to keep the connection alive
      const heartbeat = setInterval(() => {
        const comment = new TextEncoder().encode(': heartbeat\n\n');
        try {
          controller.enqueue(comment);
        } catch (e) {
          // If we can't send a heartbeat, the client is gone.
          clearInterval(heartbeat);
          try { controller.close(); } catch {}
        }
      }, 5000); // every 5 seconds

      const client = { controller, heartbeat };
      addClient(id, client);

      request.signal.addEventListener('abort', () => {
        removeClient(id, client);
        try {
          controller.close();
        } catch (e) {
          // Ignore errors from closing an already closed stream
        }
      });
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
    },
  });
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
): Promise<Response> {
  const { id } = await params;
  let rawBody: any;
  let validationResult: ValidationResult;

  // Check if image dimension validation is requested via query param
  const url = new URL(request.url);
  const explicitValidation = url.searchParams.get('validateDimensions') === 'true';

  try {
    rawBody = await request.json();
    let bodyToValidate = rawBody;

    // If the body is a string, it might be stringified JSON.
    // This happens with the AI generator. Let's try parsing it.
    if (typeof rawBody === 'string') {
        try {
            bodyToValidate = JSON.parse(rawBody);
        } catch(e) {
            // It wasn't a valid JSON string, proceed with the raw string
        }
    }
    
    // First, validate the schema
    validationResult = validateRequest(bodyToValidate);

    // Check if payload contains image URLs with image extensions
    const hasImageUrls = checkForImageUrls(bodyToValidate);
    
    // Enable dimension validation if:
    // 1. Explicitly requested via query param, OR
    // 2. Payload contains image URLs with image extensions
    const shouldValidateDimensions = explicitValidation || hasImageUrls;

    // If schema validation passed and dimension validation should run, validate dimensions
    if (validationResult.isValid && shouldValidateDimensions && validationResult.requestType === 'Menu Push') {
      const dimensionValidation = await validateImageDimensions(bodyToValidate, TALABAT_IMAGE_CRITERIA.product);
      
      // Merge dimension validation results
      if (!dimensionValidation.isValid) {
        validationResult = {
          ...validationResult,
          isValid: false,
          errors: dimensionValidation.errors,
          errorCodes: dimensionValidation.errorCodes,
          detailedErrors: dimensionValidation.detailedErrors,
        };
      }
    }
  } catch (e) {
    rawBody = { error: "Invalid JSON in request body" };
    validationResult = {
      isValid: false,
      requestType: 'Unknown',
      errors: ['Request body is not a valid JSON.'],
    };
  }

  const bodyToValidate = rawBody;

  const testResult = {
    timestamp: new Date().toISOString(),
    requestType: validationResult.requestType,
    passed: validationResult.isValid,
    errorCodes: validationResult.errorCodes || [],
    payloadSample: bodyToValidate
  };
  testResults.push(testResult);

  const headers: Record<string, string> = {};
  request.headers.forEach((value, key) => {
    headers[key] = value;
  });

  const requestData = {
    method: request.method,
    headers,
    body: rawBody, // Log the original raw body
    timestamp: new Date().toISOString(),
    validation: validationResult,
  };

  sendEvent(id, requestData);

  return new Response(
    JSON.stringify({ success: true, message: 'Request received' }),
    {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    }
  );
}
