'use client';

import { OrganizationSwitcher, UserButton } from '@clerk/nextjs';
import { Bell, Terminal } from 'lucide-react';

export function DashboardHeader() {
  return (
    <header className="h-14 bg-slate-950/80 backdrop-blur-sm border-b border-slate-800/80 px-5 flex items-center justify-between sticky top-0 z-50">
      {/* Brand */}
      <div className="flex items-center gap-3">
        <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-cyan-500 to-violet-600 flex items-center justify-center shadow-lg shadow-cyan-500/20">
          <Terminal className="w-3.5 h-3.5 text-white" />
        </div>
        <span className="font-bold text-sm tracking-tight text-slate-100">
          Sovereign<span className="text-gradient-cyan"> AI</span>
        </span>
        <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-cyan-500/10 border border-cyan-500/20 text-[10px] font-medium text-cyan-400 uppercase tracking-widest">
          Beta
        </span>
      </div>

      {/* Right side controls */}
      <div className="flex items-center gap-3">
        <div className="[&_.cl-organizationSwitcherTrigger]:bg-slate-800 [&_.cl-organizationSwitcherTrigger]:border-slate-700 [&_.cl-organizationSwitcherTrigger]:text-slate-200 [&_.cl-organizationSwitcherTrigger:hover]:bg-slate-700">
          <OrganizationSwitcher
            hidePersonal
            appearance={{
              elements: {
                organizationSwitcherTrigger:
                  'text-sm text-slate-200 bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 hover:bg-slate-700 transition-colors',
              },
            }}
          />
        </div>
        <button className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors">
          <Bell className="w-4 h-4" />
        </button>
        <UserButton
          afterSignOutUrl="/"
          appearance={{
            elements: {
              avatarBox: 'w-7 h-7',
            },
          }}
        />
      </div>
    </header>
  );
}
