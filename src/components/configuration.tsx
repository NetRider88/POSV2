'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Download, Upload, Loader2, Check } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const configurationSchema = z.object({
  integrationName: z.string().min(1, 'Integration name is required.'),
  integrationCode: z.string().min(1, 'Integration code is required.'),
  baseUrl: z.string().url('Please enter a valid URL.'),
  pluginCredentials: z.string().min(1, 'Plugin credentials are required.'),
});

type ConfigurationFormValues = z.infer<typeof configurationSchema>;

export function Configuration() {
  const [isSaving, setIsSaving] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const { toast } = useToast();

  const form = useForm<ConfigurationFormValues>({
    resolver: zodResolver(configurationSchema),
    defaultValues: {
      integrationName: '',
      integrationCode: '',
      baseUrl: '',
      pluginCredentials: '',
    },
  });

  const onSubmit = (data: ConfigurationFormValues) => {
    setIsSaving(true);
    setIsSaved(false);

    // Simulate saving to a backend
    setTimeout(() => {
      console.log('Saved configuration:', data);
      setIsSaving(false);
      setIsSaved(true);
      toast({
        title: 'Success!',
        description: 'Your configuration has been saved.',
      });

      // Revert button state after a short delay
      setTimeout(() => {
        setIsSaved(false);
      }, 2000);
    }, 1500);
  };

  return (
    <Card className="max-w-4xl mx-auto mt-8">
      <CardHeader>
        <CardTitle>Integration Configuration</CardTitle>
        <CardDescription>
          Manage your Talabat POS integration details. Securely store and manage your credentials.
        </CardDescription>
      </CardHeader>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <CardContent>
            <div className="grid gap-6">
              <FormField
                control={form.control}
                name="integrationName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Integration Name</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., 'Perfect POS UAE'" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="integrationCode"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Integration Code</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., 'perfect-pos-ae'" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="baseUrl"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Base URL</FormLabel>
                      <FormControl>
                        <Input placeholder="Your POS API endpoint" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <FormField
                control={form.control}
                name="pluginCredentials"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Plugin Credentials</FormLabel>
                    <FormControl>
                      <Input type="password" placeholder="Credentials provided by Talabat" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </CardContent>
          <CardFooter className="flex justify-between flex-wrap gap-2">
            <div className="flex gap-2">
              <Button variant="outline" type="button">
                <Upload className="mr-2 h-4 w-4" />
                Import
              </Button>
              <Button variant="outline" type="button">
                <Download className="mr-2 h-4 w-4" />
                Export
              </Button>
            </div>
            <Button
              type="submit"
              disabled={isSaving || isSaved}
              className={isSaved ? 'bg-green-600 hover:bg-green-700' : ''}
            >
              {isSaving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : isSaved ? (
                <>
                  <Check className="mr-2 h-4 w-4" />
                  Saved!
                </>
              ) : (
                'Save Configuration'
              )}
            </Button>
          </CardFooter>
        </form>
      </Form>
    </Card>
  );
}
