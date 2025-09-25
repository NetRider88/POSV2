import type { Metadata } from 'next';
import './globals.css';
import { Toaster } from '@/components/ui/toaster';
import { cn } from '@/lib/utils';
import ClientOnly from '@/components/body';

export const metadata: Metadata = {
  title: 'Talabat Test Pilot',
  description: 'Enterprise-grade testing environment for Talabat POS integrations',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head />
      <body className={cn('font-body antialiased')} suppressHydrationWarning>
        <ClientOnly>
          {children}
          <Toaster />
        </ClientOnly>
      </body>
    </html>
  );
}
