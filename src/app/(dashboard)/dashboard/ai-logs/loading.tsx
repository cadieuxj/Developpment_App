export default function AILogsLoading() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="h-8 w-36 bg-slate-800 rounded-lg" />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-24 rounded-xl bg-slate-800/60 border border-slate-800" />
        ))}
      </div>
      <div className="rounded-xl border border-slate-800 bg-slate-900/50 overflow-hidden">
        <div className="h-12 bg-slate-800/60 border-b border-slate-800" />
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="h-12 border-b border-slate-800/50 flex items-center px-4 gap-4">
            <div className="h-3 w-24 bg-slate-800 rounded" />
            <div className="h-3 w-20 bg-slate-800 rounded" />
            <div className="h-3 w-16 bg-slate-800 rounded" />
            <div className="h-3 flex-1 bg-slate-800 rounded" />
          </div>
        ))}
      </div>
    </div>
  );
}
