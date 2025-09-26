
'use client';

import { useState } from 'react';
import { Header } from '@/components/header';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Configuration } from '@/components/configuration';
import { ApiRequestGenerator } from '@/components/api-request-generator';
import { ApiSimulator } from '@/components/api-simulator';
import { Monitoring } from '@/components/monitoring';
import { BookAppointment } from '@/components/book-appointment';
import { ValidationProvider, useValidation } from '@/context/ValidationContext';

function AppTabs() {
  const { allTestsPassed } = useValidation();
  const [activeTab, setActiveTab] = useState('configuration');

  const handleTabChange = (value: string) => {
    if (value === 'go-live' && !allTestsPassed) {
      // Prevent switching to Go Live if tests are not passed
      return;
    }
    setActiveTab(value);
  };

  return (
    <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
      <TabsList className="grid w-full grid-cols-1 sm:grid-cols-5 max-w-3xl mx-auto h-auto sm:h-10">
        <TabsTrigger value="configuration">Configuration</TabsTrigger>
        <TabsTrigger value="api-generator">API Request Generator</TabsTrigger>
        <TabsTrigger value="api-simulator">API Simulator</TabsTrigger>
        <TabsTrigger value="monitoring">Monitoring</TabsTrigger>
        <TabsTrigger value="go-live" disabled={!allTestsPassed}>
          Go Live
        </TabsTrigger>
      </TabsList>
      <TabsContent value="configuration">
        <Configuration />
      </TabsContent>
      <TabsContent value="api-generator">
        <ApiRequestGenerator />
      </TabsContent>
      <TabsContent value="api-simulator">
        <ApiSimulator />
      </TabsContent>
      <TabsContent value="monitoring">
        <Monitoring />
      </TabsContent>
      <TabsContent value="go-live">
        {allTestsPassed && <BookAppointment />}
      </TabsContent>
    </Tabs>
  );
}


export default function Home() {
  return (
    <ValidationProvider>
      <div className="flex flex-col min-h-screen bg-background">
        <Header />
        <main className="flex-1 p-4 md:p-8">
          <AppTabs />
        </main>
      </div>
    </ValidationProvider>
  );
}
