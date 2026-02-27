import { auth } from '@clerk/nextjs/server';
import { dal } from '@/lib/db/dal';
import { AILogsTable } from '@/components/analytics/ai-logs-table';
import { Zap, MessageSquare, DollarSign, Activity } from 'lucide-react';

export const metadata = {
  title: 'AI Logs — Sovereign AI',
  description: 'View all AI agent interactions, prompts, and completions',
};

export default async function AILogsPage() {
  const { userId, orgId } = await auth();

  if (!userId || !orgId) {
    return <div className="text-red-400">Unauthorized</div>;
  }

  const organization = await dal.organizations.getByClerkOrgId(orgId);

  if (!organization) {
    return <div className="text-red-400">Organization not found</div>;
  }

  const [logs, summary] = await Promise.all([
    dal.aiLogs.getAllByTenant(organization.id),
    dal.aiLogs.getTenantCostSummary(organization.id),
  ]);

  const statCards = [
    {
      label: 'Total Requests',
      value: (summary.totalRequests ?? 0).toLocaleString(),
      icon: Activity,
      accent: 'text-cyan-400',
      bg: 'bg-cyan-500/10 border-cyan-500/20',
    },
    {
      label: 'Total Tokens',
      value: (summary.totalTokens ?? 0).toLocaleString(),
      icon: Zap,
      accent: 'text-violet-400',
      bg: 'bg-violet-500/10 border-violet-500/20',
    },
    {
      label: 'Total Cost',
      value: `$${(summary.totalCost ?? 0).toFixed(4)}`,
      icon: DollarSign,
      accent: 'text-emerald-400',
      bg: 'bg-emerald-500/10 border-emerald-500/20',
    },
    {
      label: 'Log Entries',
      value: logs.length.toLocaleString(),
      icon: MessageSquare,
      accent: 'text-blue-400',
      bg: 'bg-blue-500/10 border-blue-500/20',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 mb-1">
          <div className="w-8 h-8 rounded-lg bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center">
            <MessageSquare className="w-4 h-4 text-cyan-400" />
          </div>
          <h1 className="text-2xl font-bold text-slate-100 tracking-tight">AI Logs</h1>
        </div>
        <p className="text-slate-400 text-sm ml-10">
          Full audit trail of all agent prompts, completions, and token usage
        </p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((card) => {
          const Icon = card.icon;
          return (
            <div
              key={card.label}
              className={`rounded-xl border p-4 ${card.bg}`}
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">
                  {card.label}
                </span>
                <Icon className={`w-4 h-4 ${card.accent}`} />
              </div>
              <p className={`text-2xl font-bold font-mono ${card.accent}`}>{card.value}</p>
            </div>
          );
        })}
      </div>

      {/* Table */}
      <div className="rounded-xl border border-slate-800 bg-slate-900/50 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-slate-200">Interaction History</h2>
          <span className="text-xs text-slate-500">Showing last {logs.length} entries</span>
        </div>
        <AILogsTable logs={logs} />
      </div>
    </div>
  );
}
