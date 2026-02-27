export default function AnalyticsLoading() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="h-8 w-56 bg-slate-800 rounded-lg" />
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-28 rounded-xl bg-slate-800/60 border border-slate-800" />
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="h-64 rounded-xl bg-slate-800/40 border border-slate-800" />
        <div className="h-64 rounded-xl bg-slate-800/40 border border-slate-800" />
      </div>
      <div className="h-48 rounded-xl bg-slate-800/40 border border-slate-800" />
    </div>
  );
}
