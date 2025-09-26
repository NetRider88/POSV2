// IMPORTANT: This file should not be used in production.
// It is a simple mock server for demonstration purposes.
// In a real-world application, you would use a more robust solution for handling webhooks,
// potentially involving a message queue or a dedicated service.

import { validateRequest, ValidationResult } from '@/lib/talabat-api-schemas';

type Client = {
  controller: ReadableStreamDefaultController<any>;
  heartbeat: NodeJS.Timeout;
};

// A simple in-memory store for clients.
// In a real app, you'd use a database or a pub/sub system.
const clients = new Map<string, Client[]>();

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
  { params }: { params: { id: string } }
) {
  const { id } = params;

  const stream = new ReadableStream({
    start(controller) {
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
