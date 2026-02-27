export default function DashboardLoading() {
  return (
    <div className="space-y-6 max-w-6xl animate-pulse">
      <div className="h-8 w-48 bg-slate-800 rounded-lg" />
      <div className="h-4 w-72 bg-slate-800/60 rounded-md" />
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-28 rounded-xl bg-slate-800/60 border border-slate-800" />
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <div className="h-64 rounded-xl bg-slate-800/40 border border-slate-800" />
        <div className="h-64 rounded-xl bg-slate-800/40 border border-slate-800" />
      </div>
    </div>
  );
}
