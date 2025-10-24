import { Rocket, LayoutDashboard } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export function Header() {
  return (
    <header className="bg-card border-b shadow-sm sticky top-0 z-40">
      <div className="container mx-auto flex items-center justify-between gap-2 sm:gap-3 h-16 px-4">
        <div className="flex items-center gap-2 sm:gap-3">
          <Rocket className="w-6 h-6 sm:w-8 sm:h-8 text-primary flex-shrink-0" />
          <h1 className="text-lg sm:text-2xl font-bold tracking-tight text-foreground">
            Talabat Test Pilot
          </h1>
        </div>
        <Link href="/dashboard" className="flex-shrink-0">
          <Button variant="default" size="sm" className="whitespace-nowrap bg-primary hover:bg-primary/90">
            <LayoutDashboard className="mr-1 sm:mr-2 h-4 w-4" />
            <span className="hidden sm:inline">Dashboard</span>
            <span className="sm:hidden">Tests</span>
          </Button>
        </Link>
      </div>
    </header>
  );
}
