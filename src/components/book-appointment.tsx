'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { CalendarCheck } from 'lucide-react';
import Link from 'next/link';

export function BookAppointment() {
  return (
    <Card className="max-w-4xl mx-auto mt-8">
      <CardHeader>
        <CardTitle>Ready to Go Live?</CardTitle>
        <CardDescription>
          Once you have successfully tested your integration, you can schedule a meeting with our engineering team to finalize the process and go live.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="text-center p-8 border-2 border-dashed rounded-lg">
            <CalendarCheck className='mx-auto h-12 w-12 text-gray-400' />
            <h3 className='mt-2 text-lg font-medium text-gray-900 dark:text-gray-100'>Book Your Go-Live Session</h3>
            <p className='mt-1 text-sm text-muted-foreground'>Schedule a call with our integration specialists to get your API connection activated in production.</p>
        </div>
      </CardContent>
      <CardFooter className="flex justify-end">
        <Button asChild size="lg">
          <Link href="https://calendly.com/your-booking-link" target="_blank">
            Book Appointment
          </Link>
        </Button>
      </CardFooter>
    </Card>
  );
}
