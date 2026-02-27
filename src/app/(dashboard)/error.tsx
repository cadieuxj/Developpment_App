'use client';

import { useEffect } from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';
import Link from 'next/link';

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('[DashboardError]', error);
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] p-6 text-center">
      <div className="w-12 h-12 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center mb-4">
        <AlertTriangle className="w-5 h-5 text-red-400" />
      </div>
      <h2 className="text-lg font-semibold text-slate-100 mb-1">Page error</h2>
      <p className="text-slate-400 text-sm mb-5 max-w-sm">
        This page encountered an error. Your data is safe — try refreshing or return to the
        dashboard.
      </p>
      {error.digest && (
        <p className="text-slate-600 text-xs font-mono mb-4">ref: {error.digest}</p>
      )}
      <div className="flex items-center gap-3">
        <button
          onClick={reset}
          className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-sm text-slate-300 hover:text-slate-100 hover:bg-slate-700 transition-colors"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Retry
        </button>
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-cyan-500/10 border border-cyan-500/20 text-sm text-cyan-400 hover:bg-cyan-500/20 transition-colors"
        >
          <Home className="w-3.5 h-3.5" />
          Dashboard
        </Link>
      </div>
    </div>
  );
}
