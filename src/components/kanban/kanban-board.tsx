'use client';

/**
 * Kanban Board Component
 *
 * Drag-and-drop task board using dnd-kit
 */

import { useState } from 'react';
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import type { Task } from '@/lib/db/schema';
import { KanbanColumn } from './kanban-column';
import { TaskCard } from './task-card';
import { moveTask } from '@/lib/actions/tasks';

interface KanbanBoardProps {
  tasks: {
    todo: Task[];
    in_progress: Task[];
    review: Task[];
    done: Task[];
  };
  projectId?: string;
}

export function KanbanBoard({ tasks, projectId }: KanbanBoardProps) {
  const [activeTask, setActiveTask] = useState<Task | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  function handleDragStart(event: DragStartEvent) {
    const taskId = event.active.id as string;
    // Find task in any column
    const allTasks = [...tasks.todo, ...tasks.in_progress, ...tasks.review, ...tasks.done];
    const task = allTasks.find(t => t.id === taskId);
    setActiveTask(task || null);
  }

  async function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;

    if (!over) {
      setActiveTask(null);
      return;
    }

    const taskId = active.id as string;
    const targetColumnId = over.id as string;

    // Calculate position in new column
    const targetColumn = tasks[targetColumnId as keyof typeof tasks] || [];
    const position = targetColumn.length;

    // Move task
    await moveTask({
      taskId,
      columnId: targetColumnId,
      position,
      syncToWrike: true,
    });

    setActiveTask(null);
  }

  const columns = [
    { id: 'todo', title: 'To Do', tasks: tasks.todo },
    { id: 'in_progress', title: 'In Progress', tasks: tasks.in_progress },
    { id: 'review', title: 'Review', tasks: tasks.review },
    { id: 'done', title: 'Done', tasks: tasks.done },
  ];

  return (
    <DndContext
      sensors={sensors}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {columns.map(column => (
          <SortableContext
            key={column.id}
            id={column.id}
            items={column.tasks.map(t => t.id)}
            strategy={verticalListSortingStrategy}
          >
            <KanbanColumn
              id={column.id}
              title={column.title}
              tasks={column.tasks}
              projectId={projectId}
            />
          </SortableContext>
        ))}
      </div>

      <DragOverlay>
        {activeTask ? <TaskCard task={activeTask} isDragging /> : null}
      </DragOverlay>
    </DndContext>
  );
}
