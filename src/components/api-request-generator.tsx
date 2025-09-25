'use client';

import { useState, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { generateApiRequest, GenerateApiRequestInput } from '@/ai/flows/generate-api-request';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, Copy, Check } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const formSchema = z.object({
  scenarioDescription: z.string().min(10, {
    message: 'Please describe the scenario in at least 10 characters.',
  }),
});

export function ApiRequestGenerator() {
  const [isLoading, setIsLoading] = useState(false);
  const [generatedRequest, setGeneratedRequest] = useState<string | null>(null);
  const [isCopied, setIsCopied] = useState(false);
  const { toast } = useToast();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      scenarioDescription: '',
    },
  });

  const formattedRequest = useMemo(() => {
    if (!generatedRequest) return null;
    try {
      return JSON.stringify(JSON.parse(generatedRequest), null, 2);
    } catch (e) {
      return generatedRequest;
    }
  }, [generatedRequest]);

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true);
    setGeneratedRequest(null);
    try {
      const input: GenerateApiRequestInput = {
        scenarioDescription: values.scenarioDescription,
      };
      const result = await generateApiRequest(input);
      setGeneratedRequest(result.api_request);
    } catch (error) {
      console.error('Error generating API request:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to generate API request. Please try again.',
      });
    } finally {
      setIsLoading(false);
    }
  }

  const copyToClipboard = () => {
    if (formattedRequest) {
      navigator.clipboard.writeText(formattedRequest);
      setIsCopied(true);
      setTimeout(() => {
        setIsCopied(false);
      }, 2000);
    }
  };

  return (
      <Card className="max-w-4xl mx-auto mt-8">
        <CardHeader>
          <CardTitle>API Request Generator</CardTitle>
          <CardDescription>
            Describe a scenario, and our AI will generate a valid API request to test it against Talabat POSMW endpoints.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
              <FormField
                control={form.control}
                name="scenarioDescription"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Scenario Description</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="e.g., 'Test a new order creation for a restaurant in Dubai with 2 items, one with a special instruction.'"
                        className="resize-none min-h-[120px]"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Generating...
                  </>
                ) : (
                  'Generate Request'
                )}
              </Button>
            </form>
          </Form>

          {(isLoading || formattedRequest) && (
            <div className="mt-8">
              <h3 className="text-lg font-semibold mb-2">Generated API Request</h3>
              <div className="relative rounded-md bg-muted p-4 font-code text-sm">
                {isLoading ? (
                  <div className="flex items-center space-x-2 text-muted-foreground">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Generating API request...</span>
                  </div>
                ) : (
                  <>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="absolute top-2 right-2 h-7 w-7"
                      onClick={copyToClipboard}
                      aria-label="Copy to clipboard"
                    >
                      {isCopied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                    </Button>
                    <pre className="whitespace-pre-wrap break-all text-foreground">{formattedRequest}</pre>
                  </>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
  );
}
