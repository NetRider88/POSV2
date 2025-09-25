// IMPORTANT: This file should not be used in production.
// It is a simple mock server for demonstration purposes.
// In a real-world application, you would use a more robust solution for handling webhooks,
// potentially involving a message queue or a dedicated service.

import { validateRequest, ValidationResult } from '@/lib/talabat-api-schemas';

// A simple in-memory store for clients.
// In a real app, you'd use a database or a pub/sub system.
const clients = new Map<string, Response[]>();

function sendEvent(id: string, data: any) {
  const clientResponses = clients.get(id);
  if (clientResponses) {
    const eventString = `data: ${JSON.stringify(data)}\n\n`;
    clientResponses.forEach((res) => {
      // It's a bit of a hack to access the underlying stream controller,
      // but it's necessary for this simple implementation.
      const controller = (res as any).controller;
      if (controller) {
        try {
          controller.enqueue(new TextEncoder().encode(eventString));
        } catch (e) {
          // Client disconnected
          removeClient(id, res);
        }
      }
    });
  }
}

function addClient(id: string, res: Response) {
  if (!clients.has(id)) {
    clients.set(id, []);
  }
  clients.get(id)?.push(res);
}

function removeClient(id: string, res: Response) {
  const clientResponses = clients.get(id);
  if (clientResponses) {
    const index = clientResponses.indexOf(res);
    if (index !== -1) {
      clientResponses.splice(index, 1);
    }
    if (clientResponses.length === 0) {
      clients.delete(id);
    }
  }
}

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  const { id } = params;

  const stream = new ReadableStream({
    start(controller) {
      const response = new Response(stream, {
        headers: {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          Connection: 'keep-alive',
        },
      });
      // A bit of a hack to attach the controller to the response
      // so we can use it later to send events.
      (response as any).controller = controller;

      addClient(id, response);

      request.signal.addEventListener('abort', () => {
        removeClient(id, response);
        controller.close();
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
  { params }: { params: { id: string } }
) {
  const { id } = params;
  let body: any;
  let validationResult: ValidationResult;

  try {
    body = await request.json();
    validationResult = validateRequest(body);
  } catch (e) {
    body = { error: "Invalid JSON in request body" };
    validationResult = {
      isValid: false,
      requestType: 'Unknown',
      errors: ['Request body is not a valid JSON.'],
    };
  }

  const headers: Record<string, string> = {};
  request.headers.forEach((value, key) => {
    headers[key] = value;
  });

  const requestData = {
    method: request.method,
    headers,
    body,
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
