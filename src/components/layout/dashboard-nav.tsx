'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  FolderKanban,
  ListTodo,
  BarChart3,
  Rocket,
  Code,
  Layers,
  MessageSquare,
} from 'lucide-react';

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/dashboard/projects', label: 'Projects', icon: FolderKanban },
  { href: '/dashboard/tasks', label: 'Tasks', icon: ListTodo },
  { href: '/dashboard/editor', label: 'IDE', icon: Code },
  { href: '/dashboard/deployments', label: 'Deployments', icon: Rocket },
  { href: '/dashboard/analytics', label: 'Analytics', icon: BarChart3 },
  { href: '/dashboard/ai-logs', label: 'AI Logs', icon: MessageSquare },
  { href: '/dashboard/integrations', label: 'Integrations', icon: Layers },
];

export function DashboardNav() {
  const pathname = usePathname();

  return (
    <nav className="w-56 bg-slate-950/60 border-r border-slate-800/80 min-h-full pt-4 pb-6 flex flex-col shrink-0">
      <div className="px-3 mb-2">
        <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-widest px-2 mb-1">
          Navigation
        </p>
      </div>

      <div className="flex-1 px-3 space-y-0.5">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive =
            item.href === '/dashboard'
              ? pathname === '/dashboard'
              : pathname === item.href || pathname.startsWith(`${item.href}/`);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={[
                'flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-150 border',
                isActive
                  ? 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 border-transparent',
              ].join(' ')}
            >
              <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-cyan-400' : ''}`} />
              <span>{item.label}</span>
              {isActive && (
                <span className="ml-auto w-1.5 h-1.5 rounded-full bg-cyan-400 shadow-[0_0_4px_rgb(34_211_238/0.8)]" />
              )}
            </Link>
          );
        })}
      </div>

      <div className="px-5 mt-4">
        <div className="flex items-center gap-2 text-xs text-slate-600">
          <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-400" />
          <span>All systems operational</span>
        </div>
      </div>
    </nav>
  );
}
