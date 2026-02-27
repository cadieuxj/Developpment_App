import { auth } from '@clerk/nextjs/server';
import { dal } from '@/lib/db/dal';
import { FolderKanban, ListTodo, DollarSign, Zap, ArrowRight, Activity } from 'lucide-react';
import Link from 'next/link';

export default async function DashboardPage() {
  const { userId, orgId } = await auth();

  if (!userId || !orgId) {
    return <div className="text-red-400">Unauthorized</div>;
  }

  const organization = await dal.organizations.getByClerkOrgId(orgId);

  if (!organization) {
    return <div className="text-red-400">Organization not found</div>;
  }

  const [projects, tasks, aiSummary] = await Promise.all([
    dal.projects.getAllByTenant(organization.id),
    dal.tasks.getAllByTenant(organization.id),
    dal.aiLogs.getTenantCostSummary(organization.id),
  ]);

  const stats = [
    {
      title: 'Total Projects',
      value: projects.length.toString(),
      icon: FolderKanban,
      accent: 'text-blue-400',
      border: 'border-blue-500/20',
      bg: 'bg-blue-500/10',
    },
    {
      title: 'Active Tasks',
      value: tasks.filter((t) => t.status !== 'done').length.toString(),
      icon: ListTodo,
      accent: 'text-emerald-400',
      border: 'border-emerald-500/20',
      bg: 'bg-emerald-500/10',
    },
    {
      title: 'AI Requests',
      value: (aiSummary.totalRequests ?? 0).toLocaleString(),
      icon: Zap,
      accent: 'text-violet-400',
      border: 'border-violet-500/20',
      bg: 'bg-violet-500/10',
    },
    {
      title: 'Total AI Cost',
      value: `$${(aiSummary.totalCost ?? 0).toFixed(4)}`,
      icon: DollarSign,
      accent: 'text-cyan-400',
      border: 'border-cyan-500/20',
      bg: 'bg-cyan-500/10',
    },
  ];

  return (
    <div className="space-y-6 max-w-6xl">
      {/* Page header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-100 tracking-tight">
            Overview
          </h1>
          <p className="text-slate-400 text-sm mt-0.5">
            {organization.name} — AI-native development workspace
          </p>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-slate-500 bg-slate-800/60 border border-slate-700/50 rounded-lg px-3 py-1.5">
          <Activity className="w-3 h-3 text-emerald-400" />
          <span>Live</span>
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <div
              key={stat.title}
              className={`rounded-xl border ${stat.border} ${stat.bg} p-5 transition-all hover:scale-[1.01]`}
            >
              <div className="flex items-center justify-between mb-4">
                <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">
                  {stat.title}
                </p>
                <Icon className={`w-4 h-4 ${stat.accent}`} />
              </div>
              <p className={`text-3xl font-bold font-mono ${stat.accent}`}>{stat.value}</p>
            </div>
          );
        })}
      </div>

      {/* Content grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Recent Projects */}
        <div className="rounded-xl border border-slate-800 bg-slate-900/50">
          <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <FolderKanban className="w-4 h-4 text-blue-400" />
              <h2 className="text-sm font-semibold text-slate-200">Recent Projects</h2>
            </div>
            <Link
              href="/dashboard/projects"
              className="flex items-center gap-1 text-xs text-slate-500 hover:text-cyan-400 transition-colors"
            >
              View all <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          <div className="p-3">
            {projects.length === 0 ? (
              <div className="py-8 text-center">
                <p className="text-slate-500 text-sm">No projects yet</p>
                <Link
                  href="/dashboard/projects"
                  className="mt-2 inline-block text-xs text-cyan-400 hover:underline"
                >
                  Create your first project →
                </Link>
              </div>
            ) : (
              <div className="space-y-1">
                {projects.slice(0, 5).map((project) => (
                  <Link
                    key={project.id}
                    href={`/dashboard/projects`}
                    className="flex items-center justify-between p-3 rounded-lg hover:bg-slate-800/50 transition-colors group"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-7 h-7 rounded-md bg-blue-500/10 border border-blue-500/20 flex items-center justify-center shrink-0">
                        <FolderKanban className="w-3.5 h-3.5 text-blue-400" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-slate-200 truncate">
                          {project.name}
                        </p>
                        {project.description && (
                          <p className="text-xs text-slate-500 truncate">{project.description}</p>
                        )}
                      </div>
                    </div>
                    <ArrowRight className="w-3.5 h-3.5 text-slate-700 group-hover:text-slate-500 shrink-0" />
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Recent Tasks */}
        <div className="rounded-xl border border-slate-800 bg-slate-900/50">
          <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <ListTodo className="w-4 h-4 text-emerald-400" />
              <h2 className="text-sm font-semibold text-slate-200">Recent Tasks</h2>
            </div>
            <Link
              href="/dashboard/tasks"
              className="flex items-center gap-1 text-xs text-slate-500 hover:text-cyan-400 transition-colors"
            >
              View all <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          <div className="p-3">
            {tasks.length === 0 ? (
              <div className="py-8 text-center">
                <p className="text-slate-500 text-sm">No tasks yet</p>
                <Link
                  href="/dashboard/tasks"
                  className="mt-2 inline-block text-xs text-cyan-400 hover:underline"
                >
                  Create your first task →
                </Link>
              </div>
            ) : (
              <div className="space-y-1">
                {tasks.slice(0, 5).map((task) => {
                  const statusColor: Record<string, string> = {
                    todo: 'text-slate-400',
                    in_progress: 'text-cyan-400',
                    review: 'text-yellow-400',
                    done: 'text-emerald-400',
                  };
                  const priorityColor: Record<string, string> = {
                    low: 'bg-slate-700 text-slate-300',
                    medium: 'bg-blue-500/20 text-blue-400',
                    high: 'bg-orange-500/20 text-orange-400',
                    urgent: 'bg-red-500/20 text-red-400',
                  };
                  return (
                    <div
                      key={task.id}
                      className="flex items-center justify-between p-3 rounded-lg hover:bg-slate-800/50 transition-colors"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-2 h-2 rounded-full bg-slate-600 shrink-0" />
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-slate-200 truncate">
                            {task.title}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span
                          className={`text-xs px-2 py-0.5 rounded-md font-medium ${
                            priorityColor[task.priority] ?? 'bg-slate-700 text-slate-300'
                          }`}
                        >
                          {task.priority}
                        </span>
                        <span
                          className={`text-xs font-medium ${
                            statusColor[task.status] ?? 'text-slate-400'
                          }`}
                        >
                          {task.status.replace('_', ' ')}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
