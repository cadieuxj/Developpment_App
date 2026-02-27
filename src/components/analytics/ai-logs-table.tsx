'use client';

import { useState } from 'react';
import type { AILog } from '@/lib/db/schema';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ChevronRight, Zap, DollarSign, Clock } from 'lucide-react';

interface AILogsTableProps {
  logs: AILog[];
}

const MODEL_COLORS: Record<string, string> = {
  'gpt-4o': 'bg-green-500/10 text-green-400 border-green-500/20',
  'gpt-4o-mini': 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  'claude-3-5-sonnet': 'bg-orange-500/10 text-orange-400 border-orange-500/20',
  'claude-3-5-haiku': 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
  'claude-3-opus': 'bg-red-500/10 text-red-400 border-red-500/20',
  'e2b-sandbox': 'bg-purple-500/10 text-purple-400 border-purple-500/20',
};

const OPERATION_COLORS: Record<string, string> = {
  chat: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  code_generation: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20',
  code_execution: 'bg-violet-500/10 text-violet-400 border-violet-500/20',
  explanation: 'bg-slate-500/10 text-slate-400 border-slate-500/20',
};

function truncate(text: string | null | undefined, maxLen: number): string {
  if (!text) return '—';
  if (text.length <= maxLen) return text;
  return text.slice(0, maxLen) + '…';
}

function formatMessages(raw: string | null | undefined): string {
  if (!raw) return '—';
  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      return parsed
        .map((m: { role: string; content: string }) => `[${m.role.toUpperCase()}] ${m.content}`)
        .join('\n\n');
    }
  } catch {
    // not JSON, return as-is
  }
  return raw;
}

export function AILogsTable({ logs }: AILogsTableProps) {
  const [selected, setSelected] = useState<AILog | null>(null);

  if (logs.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="w-14 h-14 rounded-2xl bg-slate-800 border border-slate-700 flex items-center justify-center mb-4">
          <Zap className="w-6 h-6 text-slate-500" />
        </div>
        <p className="text-slate-300 font-medium">No AI interactions yet</p>
        <p className="text-slate-500 text-sm mt-1">
          Interactions will appear here once you use the AI features
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-800">
              <th className="text-left py-3 px-4 text-xs font-medium text-slate-400 uppercase tracking-wider">
                Time
              </th>
              <th className="text-left py-3 px-4 text-xs font-medium text-slate-400 uppercase tracking-wider">
                Model
              </th>
              <th className="text-left py-3 px-4 text-xs font-medium text-slate-400 uppercase tracking-wider">
                Operation
              </th>
              <th className="text-left py-3 px-4 text-xs font-medium text-slate-400 uppercase tracking-wider">
                Prompt
              </th>
              <th className="text-left py-3 px-4 text-xs font-medium text-slate-400 uppercase tracking-wider">
                Completion
              </th>
              <th className="text-right py-3 px-4 text-xs font-medium text-slate-400 uppercase tracking-wider">
                Tokens
              </th>
              <th className="text-right py-3 px-4 text-xs font-medium text-slate-400 uppercase tracking-wider">
                Cost
              </th>
              <th className="py-3 px-4" />
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/50">
            {logs.map((log) => (
              <tr
                key={log.id}
                className="hover:bg-slate-800/30 transition-colors cursor-pointer group"
                onClick={() => setSelected(log)}
              >
                <td className="py-3 px-4 text-slate-400 whitespace-nowrap font-mono text-xs">
                  <div className="flex items-center gap-1.5">
                    <Clock className="w-3 h-3" />
                    {new Date(log.createdAt).toLocaleString(undefined, {
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </div>
                </td>
                <td className="py-3 px-4">
                  <span
                    className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-mono border ${
                      MODEL_COLORS[log.model] ?? 'bg-slate-700 text-slate-300 border-slate-600'
                    }`}
                  >
                    {log.model}
                  </span>
                </td>
                <td className="py-3 px-4">
                  {log.operation ? (
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs border ${
                        OPERATION_COLORS[log.operation] ??
                        'bg-slate-700 text-slate-300 border-slate-600'
                      }`}
                    >
                      {log.operation}
                    </span>
                  ) : (
                    <span className="text-slate-600">—</span>
                  )}
                </td>
                <td className="py-3 px-4 max-w-[200px]">
                  <span className="text-slate-400 text-xs font-mono truncate block">
                    {truncate(formatMessages(log.prompt), 80)}
                  </span>
                </td>
                <td className="py-3 px-4 max-w-[200px]">
                  <span className="text-slate-300 text-xs font-mono truncate block">
                    {truncate(log.completion, 80)}
                  </span>
                </td>
                <td className="py-3 px-4 text-right font-mono text-xs text-slate-400 whitespace-nowrap">
                  <span className="text-cyan-400">{log.promptTokens.toLocaleString()}</span>
                  <span className="text-slate-600 mx-1">+</span>
                  <span className="text-violet-400">{log.completionTokens.toLocaleString()}</span>
                </td>
                <td className="py-3 px-4 text-right">
                  <span className="font-mono text-xs text-emerald-400">
                    ${log.cost.toFixed(6)}
                  </span>
                </td>
                <td className="py-3 px-4">
                  <ChevronRight className="w-4 h-4 text-slate-600 group-hover:text-slate-400 transition-colors" />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Dialog open={!!selected} onOpenChange={(open) => !open && setSelected(null)}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto bg-slate-900 border-slate-700">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-slate-100">
              <Zap className="w-4 h-4 text-cyan-400" />
              AI Interaction Detail
            </DialogTitle>
          </DialogHeader>

          {selected && (
            <div className="space-y-5 mt-2">
              {/* Meta row */}
              <div className="flex flex-wrap gap-2">
                <Badge
                  variant="outline"
                  className={`font-mono text-xs ${
                    MODEL_COLORS[selected.model] ?? 'bg-slate-700 text-slate-300 border-slate-600'
                  }`}
                >
                  {selected.model}
                </Badge>
                {selected.operation && (
                  <Badge
                    variant="outline"
                    className={`text-xs ${
                      OPERATION_COLORS[selected.operation] ??
                      'bg-slate-700 text-slate-300 border-slate-600'
                    }`}
                  >
                    {selected.operation}
                  </Badge>
                )}
                <span className="flex items-center gap-1 text-xs text-slate-400">
                  <Zap className="w-3 h-3 text-cyan-400" />
                  {selected.totalTokens.toLocaleString()} tokens
                </span>
                <span className="flex items-center gap-1 text-xs text-slate-400">
                  <DollarSign className="w-3 h-3 text-emerald-400" />
                  {selected.cost.toFixed(6)} USD
                </span>
                <span className="text-xs text-slate-500 ml-auto">
                  {new Date(selected.createdAt).toLocaleString()}
                </span>
              </div>

              {/* Prompt */}
              <div>
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                  Prompt
                </p>
                <pre className="bg-slate-950 border border-slate-800 rounded-lg p-4 text-xs text-slate-300 font-mono whitespace-pre-wrap break-words leading-relaxed">
                  {formatMessages(selected.prompt)}
                </pre>
              </div>

              {/* Completion */}
              <div>
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                  Completion
                </p>
                <pre className="bg-slate-950 border border-slate-800 rounded-lg p-4 text-xs text-slate-300 font-mono whitespace-pre-wrap break-words leading-relaxed">
                  {selected.completion ?? '—'}
                </pre>
              </div>

              {/* Token breakdown */}
              <div className="grid grid-cols-3 gap-3">
                {[
                  { label: 'Prompt Tokens', value: selected.promptTokens, color: 'text-cyan-400' },
                  {
                    label: 'Completion Tokens',
                    value: selected.completionTokens,
                    color: 'text-violet-400',
                  },
                  { label: 'Total Tokens', value: selected.totalTokens, color: 'text-slate-300' },
                ].map((item) => (
                  <div
                    key={item.label}
                    className="bg-slate-800 border border-slate-700 rounded-lg p-3"
                  >
                    <p className="text-xs text-slate-400">{item.label}</p>
                    <p className={`text-lg font-mono font-semibold mt-0.5 ${item.color}`}>
                      {item.value.toLocaleString()}
                    </p>
                  </div>
                ))}
              </div>

              {selected.traceId && (
                <p className="text-xs text-slate-500 font-mono">
                  Trace ID: {selected.traceId}
                </p>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
