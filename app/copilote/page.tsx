'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function CopiloteRedirect() {
  const router = useRouter();
  
  useEffect(() => {
    router.replace('/app/copilote');
  }, [router]);
  
  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center">
      <div className="text-center">
        <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-slate-400">Redirection...</p>
      </div>
    </div>
  );
}
