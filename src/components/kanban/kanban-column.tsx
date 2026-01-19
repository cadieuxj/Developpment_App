'use client';

import { useDroppable } from '@dnd-kit/core';
import type { Task } from '@/lib/db/schema';
import { TaskCard } from './task-card';

interface KanbanColumnProps {
  id: string;
  title: string;
  tasks: Task[];
  projectId?: string;
}

export function KanbanColumn({ id, title, tasks }: KanbanColumnProps) {
  const { setNodeRef, isOver } = useDroppable({
    id,
  });

  return (
    <div
      ref={setNodeRef}
      className={`flex flex-col gap-2 p-4 bg-gray-50 dark:bg-gray-900 rounded-lg min-h-[500px] ${
        isOver ? 'bg-gray-100 dark:bg-gray-800' : ''
      }`}
    >
      <h3 className="font-semibold text-lg mb-2">{title}</h3>
      <div className="flex flex-col gap-2">
        {tasks.map((task) => (
          <TaskCard key={task.id} task={task} />
        ))}
      </div>
    </div>
  );
}
