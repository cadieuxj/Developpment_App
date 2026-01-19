'use client';

import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { Task } from '@/lib/db/schema';

interface TaskCardProps {
  task: Task;
  isDragging?: boolean;
}

export function TaskCard({ task, isDragging }: TaskCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({ id: task.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const priorityColors = {
    low: 'border-gray-300',
    medium: 'border-blue-400',
    high: 'border-orange-400',
    urgent: 'border-red-500',
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={`p-3 bg-white dark:bg-gray-800 rounded-md shadow-sm border-l-4 cursor-grab active:cursor-grabbing ${
        priorityColors[task.priority]
      }`}
    >
      <h4 className="font-medium text-sm mb-1">{task.title}</h4>
      {task.description && (
        <p className="text-xs text-gray-600 dark:text-gray-400 line-clamp-2">
          {task.description}
        </p>
      )}
      <div className="flex items-center gap-2 mt-2">
        <span className="text-xs px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded">
          {task.priority}
        </span>
        {task.wrikeTaskId && (
          <span className="text-xs text-purple-600 dark:text-purple-400">
            🔗 Wrike
          </span>
        )}
      </div>
    </div>
  );
}
