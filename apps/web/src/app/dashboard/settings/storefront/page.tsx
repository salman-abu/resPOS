'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function StorefrontConfigPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/dashboard/settings');
  }, [router]);

  return (
    <div className="p-6 text-center text-content-muted">
      Redirecting to Settings...
    </div>
  );
}
