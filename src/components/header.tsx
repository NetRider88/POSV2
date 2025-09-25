import { Rocket } from 'lucide-react';

export function Header() {
  return (
    <header className="bg-card border-b shadow-sm sticky top-0 z-40">
      <div className="container mx-auto flex items-center gap-3 h-16">
        <Rocket className="w-8 h-8 text-primary" />
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          Talabat Test Pilot
        </h1>
      </div>
    </header>
  );
}
