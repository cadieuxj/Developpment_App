import { auth } from '@clerk/nextjs/server';
import { dal } from '@/lib/db/dal';
import { KanbanBoard } from '@/components/kanban/kanban-board';
import { CreateTaskButton } from '@/components/tasks/create-task-button';
import { Button } from '@/components/ui/button';
import { Filter } from 'lucide-react';

export default async function TasksPage() {
  const { userId, orgId } = await auth();

  if (!userId || !orgId) {
    return <div>Unauthorized</div>;
  }

  // Get organization
  const organization = await dal.organizations.getByClerkOrgId(orgId);

  if (!organization) {
    return <div>Organization not found</div>;
  }

  // Get all tasks for the organization
  const tasks = await dal.tasks.getAllByTenant(organization.id);

  // Group tasks by status for Kanban board
  const tasksByStatus = {
    todo: tasks.filter((t) => t.status === 'todo'),
    in_progress: tasks.filter((t) => t.status === 'in_progress'),
    review: tasks.filter((t) => t.status === 'review'),
    done: tasks.filter((t) => t.status === 'done'),
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Tasks</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Manage your tasks with AI-powered context tracking
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <Filter className="w-4 h-4 mr-2" />
            Filter
          </Button>
          <CreateTaskButton />
        </div>
      </div>

      {/* Task Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
          <p className="text-sm text-gray-600 dark:text-gray-400">To Do</p>
          <p className="text-2xl font-bold mt-1">{tasksByStatus.todo.length}</p>
        </div>
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
          <p className="text-sm text-gray-600 dark:text-gray-400">In Progress</p>
          <p className="text-2xl font-bold mt-1">{tasksByStatus.in_progress.length}</p>
        </div>
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
          <p className="text-sm text-gray-600 dark:text-gray-400">Review</p>
          <p className="text-2xl font-bold mt-1">{tasksByStatus.review.length}</p>
        </div>
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
          <p className="text-sm text-gray-600 dark:text-gray-400">Done</p>
          <p className="text-2xl font-bold mt-1">{tasksByStatus.done.length}</p>
        </div>
      </div>

      {/* Kanban Board */}
      <KanbanBoard initialTasks={tasks} />
    </div>
  );
}
