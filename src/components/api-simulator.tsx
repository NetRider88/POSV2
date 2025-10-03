
'use client';

import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Copy, Check, Trash2, Server, CircleCheck, CircleAlert, CircleX } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Badge } from './ui/badge';
import type { ValidationResult } from '@/lib/talabat-api-schemas';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useValidation } from '@/context/ValidationContext';


interface RequestLog {
  id: string;
  method: string;
  headers: Record<string, string>;
  body: any;
  timestamp: string;
  validation: ValidationResult;
}

const ValidationStatus = ({ result }: { result: ValidationResult }) => {
  if (result.isValid) {
    return (
      <div className="flex items-center gap-2 text-green-600">
        <CircleCheck className="h-4 w-4" />
        <span className="font-semibold">Validation Successful</span>
      </div>
    );
  }

  if (result.requestType === 'Unknown') {
    return (
      <div className="flex items-center gap-2 text-yellow-600">
        <CircleAlert className="h-4 w-4" />
        <span className="font-semibold">Unknown Request Type</span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2 text-red-600">
      <CircleX className="h-4 w-4" />
      <span className="font-semibold">Validation Failed</span>
    </div>
  );
};


export function ApiSimulator() {
  const [simulatorId, setSimulatorId] = useState<string | null>(null);
  const [requestLogs, setRequestLogs] = useState<RequestLog[]>([]);
  const [isCopied, setIsCopied] = useState(false);
  const { toast } = useToast();
  const { setMenuPushPassed, setOrderPayloadPassed } = useValidation();


  useEffect(() => {
    // This check ensures we only generate the ID on the client-side
    if (typeof window !== 'undefined') {
      // Use a more robust way to get or set the ID from session storage
      let id = sessionStorage.getItem('simulatorId');
      if (!id) {
        id = Math.random().toString(36).substring(2, 15);
        sessionStorage.setItem('simulatorId', id);
      }
      setSimulatorId(id);
    }
  }, []);

  const endpointUrl = useMemo(() => {
    if (typeof window !== 'undefined' && simulatorId) {
      return `${window.location.origin}/api/simulator/${simulatorId}`;
    }
    return '';
  }, [simulatorId]);

  useEffect(() => {
    if (!simulatorId) return;

    const eventSource = new EventSource(`/api/simulator/${simulatorId}`);

    eventSource.onmessage = (event) => {
      // Ignore heartbeat messages
      if (event.data.startsWith(':')) {
        return;
      }
      try {
        const newRequest: Omit<RequestLog, 'id'> = JSON.parse(event.data);
        const newLog: RequestLog = {
          ...newRequest,
          id: new Date().getTime().toString(),
        };

        if (newLog.validation.isValid) {
            if (newLog.validation.requestType === 'Menu Push') {
                setMenuPushPassed(true);
            } else if (newLog.validation.requestType === 'Order Payload') {
                setOrderPayloadPassed(true);
            }
        }

        setRequestLogs((prevLogs) => [newLog, ...prevLogs]);
        toast({
          title: `New ${newLog.validation.requestType} Request Received`,
          description: `Validation: ${newLog.validation.isValid ? 'Success' : 'Failed'}`,
        });
      } catch (e) {
        console.error('Failed to parse incoming event:', e);
      }
    };

    eventSource.onerror = (error) => {
      console.error('EventSource failed:', error);
      // Don't close the connection here, as EventSource will attempt to reconnect automatically.
    };

    return () => {
      eventSource.close();
    };
  }, [simulatorId, toast, setMenuPushPassed, setOrderPayloadPassed]);

  const copyToClipboard = () => {
    if (endpointUrl) {
      navigator.clipboard.writeText(endpointUrl);
      setIsCopied(true);
      toast({
        title: 'Copied to clipboard!',
        description: 'The endpoint URL has been copied.',
      });
      setTimeout(() => {
        setIsCopied(false);
      }, 2000);
    }
  };

  const clearLogs = () => {
    setRequestLogs([]);
    setMenuPushPassed(false);
    setOrderPayloadPassed(false);
    toast({
      title: 'Logs Cleared',
      description: 'All incoming API request logs and test statuses have been cleared.',
    });
  };
  
  const getBodyForDisplay = (body: any) => {
    if (typeof body === 'string') {
      try {
        // It's a JSON string, so parse and re-stringify for pretty printing
        return JSON.stringify(JSON.parse(body), null, 2);
      } catch (e) {
        // It's just a regular string, return as is
        return body;
      }
    }
    // It's already a JSON object
    return JSON.stringify(body, null, 2);
  };


  return (
    <Card className="max-w-4xl mx-auto mt-8">
      <CardHeader>
        <CardTitle>API Simulator & Validator</CardTitle>
        <CardDescription>
          Use this endpoint to test your integration. Payloads are validated against the API documentation in real-time.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          <div>
            <label htmlFor="endpoint-url" className="block text-sm font-medium text-gray-700 mb-1">
              Your Unique API Endpoint
            </label>
            <div className="relative">
              <Input
                id="endpoint-url"
                type="text"
                readOnly
                value={endpointUrl}
                className="pr-10 font-code"
              />
              <Button
                variant="ghost"
                size="icon"
                className="absolute top-1/2 right-1 -translate-y-1/2 h-7 w-7"
                onClick={copyToClipboard}
                aria-label="Copy endpoint URL"
              >
                {isCopied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
              </Button>
            </div>
            <div className="text-xs text-muted-foreground mt-2">
              <Badge variant="secondary">POST</Badge> requests to this endpoint will appear below. The endpoint is unique to your browser session.
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold">Incoming Requests</h3>
              <Button variant="outline" size="sm" onClick={clearLogs} disabled={requestLogs.length === 0}>
                <Trash2 className="mr-2 h-4 w-4" />
                Clear Logs
              </Button>
            </div>
            <div className="border rounded-md p-4 h-[500px] overflow-y-auto bg-muted/20">
              {requestLogs.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                  <Server className="h-10 w-10 mb-4" />
                  <p className="font-semibold">Waiting for requests...</p>
                  <p className="text-sm text-center">Send a POST request to your endpoint to see it appear here.</p>
                </div>
              ) : (
                <Accordion type="single" collapsible className="w-full">
                  {requestLogs.map((log) => (
                    <AccordionItem value={log.id} key={log.id}>
                      <AccordionTrigger>
                        <div className="flex flex-col md:flex-row md:items-center gap-2 md:gap-4 text-sm w-full">
                          <div className='flex items-center gap-4'>
                            <Badge variant={log.method === 'POST' ? 'default' : 'secondary'}>{log.method}</Badge>
                            <span className="font-code">{new Date(log.timestamp).toLocaleTimeString()}</span>
                          </div>
                          <div className='flex-1 text-left'>
                            <ValidationStatus result={log.validation} />
                          </div>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent>
                        <div className="space-y-4 font-code text-xs">
                           <div>
                            <h4 className="font-bold mb-2 text-sm">Validation Result</h4>
                              {!log.validation.isValid && log.validation.errors ? (
                                <Alert variant="destructive">
                                  <CircleAlert className="h-4 w-4" />
                                  <AlertTitle>Request Type: {log.validation.requestType}</AlertTitle>
                                  <AlertDescription>
                                    <ul className="list-disc pl-5 mt-2 space-y-1">
                                      {log.validation.errors.map((error, index) => (
                                        <li key={index}>{error}</li>
                                      ))}
                                    </ul>
                                  </AlertDescription>
                                </Alert>
                              ) : log.validation.requestType === 'Unknown' ? (
                                <Alert variant="default" className='bg-yellow-50 border-yellow-200 text-yellow-800'>
                                   <CircleAlert className="h-4 w-4 !text-yellow-800" />
                                   <AlertTitle>Could not determine request type.</AlertTitle>
                                   <AlertDescription>
                                    Ensure your payload contains identifying fields like `orderId` for orders or `menu` for menu pushes.
                                   </AlertDescription>
                                </Alert>
                              ) : (
                                <Alert variant="default" className='bg-green-50 border-green-200 text-green-800'>
                                  <CircleCheck className="h-4 w-4 !text-green-800" />
                                  <AlertTitle>Request Valid</AlertTitle>
                                  <AlertDescription>
                                    The payload for this <span className='font-bold'>{log.validation.requestType}</span> request is correctly structured.
                                  </AlertDescription>
                                </Alert>
                              )}
                          </div>
                          <div>
                            <h4 className="font-bold mb-2 text-sm">Headers</h4>
                            <pre className="p-2 bg-muted rounded-md whitespace-pre-wrap break-all">
                              {JSON.stringify(log.headers, null, 2)}
                            </pre>
                          </div>
                          <div>
                            <h4 className="font-bold mb-2 text-sm">Body</h4>
                            <pre className="p-2 bg-muted rounded-md whitespace-pre-wrap break-all">
                              {getBodyForDisplay(log.body)}
                            </pre>
                          </div>
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
