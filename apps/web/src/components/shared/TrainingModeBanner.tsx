'use client';

import { AlertTriangle } from 'lucide-react';

export function TrainingModeBanner() {
  return (
    <div className="fixed top-0 left-0 right-0 z-[100] bg-amber-500 text-amber-950 px-4 py-2 text-center text-sm font-bold shadow-md flex items-center justify-center gap-2">
      <AlertTriangle className="h-4 w-4" />
      TRAINING MODE — No real data saved
    </div>
  );
}
