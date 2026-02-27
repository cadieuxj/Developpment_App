'use client';

import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { Task } from '@/lib/db/schema';
import { Brain, ExternalLink } from 'lucide-react';

interface TaskCardProps {
  task: Task;
  isDragging?: boolean;
}

const PRIORITY_LEFT_BORDER: Record<string, string> = {
  low: 'border-l-slate-600',
  medium: 'border-l-blue-500',
  high: 'border-l-orange-500',
  urgent: 'border-l-red-500',
};

const PRIORITY_BADGE: Record<string, string> = {
  low: 'bg-slate-700/60 text-slate-400',
  medium: 'bg-blue-500/20 text-blue-400',
  high: 'bg-orange-500/20 text-orange-400',
  urgent: 'bg-red-500/20 text-red-400',
};

export function TaskCard({ task, isDragging }: TaskCardProps) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({
    id: task.id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  };

  const hasAIContext =
    task.aiContext && Object.keys(task.aiContext).some((k) => task.aiContext![k]);

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={[
        'group p-3 rounded-lg border border-slate-800 bg-slate-900 border-l-4',
        'hover:border-slate-700 hover:bg-slate-800/80',
        'cursor-grab active:cursor-grabbing transition-all duration-150 shadow-sm',
        PRIORITY_LEFT_BORDER[task.priority] ?? 'border-l-slate-600',
      ].join(' ')}
    >
      <h4 className="text-sm font-medium text-slate-200 leading-tight mb-1.5">{task.title}</h4>

      {task.description && (
        <p className="text-xs text-slate-500 line-clamp-2 mb-2 leading-relaxed">
          {task.description}
        </p>
      )}

      {hasAIContext && (
        <div className="flex items-center gap-1.5 text-[10px] text-violet-400 mb-2">
          <Brain className="w-3 h-3" />
          <span>AI context attached</span>
          {task.aiContext?.estimatedComplexity && (
            <span className="px-1.5 py-0.5 rounded bg-violet-500/10 border border-violet-500/20 capitalize">
              {task.aiContext.estimatedComplexity}
            </span>
          )}
        </div>
      )}

      <div className="flex items-center gap-1.5 mt-1">
        <span
          className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${
            PRIORITY_BADGE[task.priority] ?? 'bg-slate-700 text-slate-400'
          }`}
        >
          {task.priority}
        </span>
        {task.wrikeTaskId && (
          <span className="flex items-center gap-1 text-[10px] text-purple-400 px-1.5 py-0.5 rounded bg-purple-500/10 border border-purple-500/20">
            <ExternalLink className="w-2.5 h-2.5" />
            Wrike
          </span>
        )}
        {task.dueDate && (
          <span className="ml-auto text-[10px] text-slate-500">
            {new Date(task.dueDate).toLocaleDateString(undefined, {
              month: 'short',
              day: 'numeric',
            })}
          </span>
        )}
      </div>
    </div>
  );
}
