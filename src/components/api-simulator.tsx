'use client';

import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Copy, Check, Trash2, Server } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Badge } from './ui/badge';

interface RequestLog {
  id: string;
  method: string;
  headers: Record<string, string>;
  body: any;
  timestamp: string;
}

export function ApiSimulator() {
  const [simulatorId, setSimulatorId] = useState<string | null>(null);
  const [requestLogs, setRequestLogs] = useState<RequestLog[]>([]);
  const [isCopied, setIsCopied] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    // Generate a unique ID for the simulator session on component mount
    setSimulatorId(Math.random().toString(36).substring(2, 15));
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
      const newRequest: Omit<RequestLog, 'id'> = JSON.parse(event.data);
      const newLog: RequestLog = {
        ...newRequest,
        id: new Date().getTime().toString(),
      };
      setRequestLogs((prevLogs) => [newLog, ...prevLogs]);
      toast({
        title: 'New API Request Received',
        description: `Method: ${newLog.method}`,
      })
    };

    eventSource.onerror = (error) => {
      console.error('EventSource failed:', error);
      eventSource.close();
    };

    return () => {
      eventSource.close();
    };
  }, [simulatorId, toast]);

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
    toast({
      title: 'Logs Cleared',
      description: 'All incoming API request logs have been cleared.',
    });
  };

  return (
    <Card className="max-w-4xl mx-auto mt-8">
      <CardHeader>
        <CardTitle>API Simulator</CardTitle>
        <CardDescription>
          Use the unique endpoint below to send test requests from your integration. Incoming requests will appear here in real-time.
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
            <p className="text-xs text-muted-foreground mt-2">
              This endpoint only accepts <Badge variant="secondary">POST</Badge> requests. The endpoint is valid for your current session.
            </p>
          </div>

          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold">Incoming Requests</h3>
              <Button variant="outline" size="sm" onClick={clearLogs} disabled={requestLogs.length === 0}>
                <Trash2 className="mr-2 h-4 w-4" />
                Clear Logs
              </Button>
            </div>
            <div className="border rounded-md p-4 h-[400px] overflow-y-auto bg-muted/20">
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
                        <div className="flex items-center gap-4 text-sm">
                          <Badge variant={log.method === 'POST' ? 'default' : 'secondary'}>{log.method}</Badge>
                          <span className="font-code">{new Date(log.timestamp).toLocaleTimeString()}</span>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent>
                        <div className="space-y-4 font-code text-xs">
                          <div>
                            <h4 className="font-bold mb-2">Headers</h4>
                            <pre className="p-2 bg-muted rounded-md whitespace-pre-wrap break-all">
                              {JSON.stringify(log.headers, null, 2)}
                            </pre>
                          </div>
                          <div>
                            <h4 className="font-bold mb-2">Body</h4>
                            <pre className="p-2 bg-muted rounded-md whitespace-pre-wrap break-all">
                              {JSON.stringify(log.body, null, 2)}
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
