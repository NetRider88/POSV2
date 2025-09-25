import { Header } from '@/components/header';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Configuration } from '@/components/configuration';
import { ApiRequestGenerator } from '@/components/api-request-generator';
import { Monitoring } from '@/components/monitoring';
import { Card, CardContent } from '@/components/ui/card';

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen bg-background">
      <Header />
      <main className="flex-1 p-4 md:p-8">
        <Tabs defaultValue="api-generator" className="w-full">
          <TabsList className="grid w-full grid-cols-1 sm:grid-cols-3 max-w-2xl mx-auto h-auto sm:h-10">
            <TabsTrigger value="configuration">Configuration</TabsTrigger>
            <TabsTrigger value="api-generator">API Request Generator</TabsTrigger>
            <TabsTrigger value="monitoring">Monitoring</TabsTrigger>
          </TabsList>
          <TabsContent value="configuration">
            <Configuration />
          </TabsContent>
          <TabsContent value="api-generator">
            <ApiRequestGenerator />
          </TabsContent>
          <TabsContent value="monitoring">
            <Monitoring />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
