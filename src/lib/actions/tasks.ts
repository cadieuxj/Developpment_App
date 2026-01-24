'use server';

/**
 * Server Actions for Task/Kanban Management
 *
 * Handles task CRUD operations with Wrike bi-directional sync
 */

import { auth } from '@clerk/nextjs/server';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { dal } from '../db/dal';
import type { NewTask, Task } from '../db/schema';
import { syncTaskToWrike, deleteWrikeTask } from '../integrations/wrike';

// Validation schemas
const createTaskSchema = z.object({
  title: z.string().min(1, 'Title is required').max(500),
  description: z.string().optional(),
  status: z.enum(['todo', 'in_progress', 'review', 'done']).default('todo'),
  priority: z.enum(['low', 'medium', 'high', 'urgent']).default('medium'),
  projectId: z.string().uuid().optional(),
  assignedTo: z.string().optional(),
  dueDate: z.date().optional(),
  aiContext: z.record(z.any()).optional(),
  columnId: z.string().default('todo'),
  position: z.number().default(0),
});

const updateTaskSchema = createTaskSchema.partial().extend({
  id: z.string().uuid(),
});

const moveTaskSchema = z.object({
  taskId: z.string().uuid(),
  columnId: z.string(),
  position: z.number(),
});

export type CreateTaskInput = z.infer<typeof createTaskSchema>;
export type UpdateTaskInput = z.infer<typeof updateTaskSchema>;
export type MoveTaskInput = z.infer<typeof moveTaskSchema>;

/**
 * Create a new task and optionally sync to Wrike
 */
export async function createTask(input: CreateTaskInput & { syncToWrike?: boolean }) {
  const { userId, orgId } = await auth();

  if (!userId || !orgId) {
    throw new Error('Unauthorized');
  }

  const organization = await dal.organizations.getByClerkOrgId(orgId);
  if (!organization) {
    throw new Error('Organization not found');
  }

  // Validate input
  const { syncToWrike, ...taskData } = input;
  const validatedInput = createTaskSchema.parse(taskData);

  // Create task
  const task = await dal.tasks.create({
    ...validatedInput,
    tenantId: organization.id,
    createdBy: userId,
  } as NewTask);

  // Sync to Wrike if requested
  if (syncToWrike) {
    try {
      const wrikeTaskId = await syncTaskToWrike(task, organization.id);

      // Create sync state
      await dal.wrikeSyncState.create({
        tenantId: organization.id,
        taskId: task.id,
        wrikeTaskId,
        lastSyncDirection: 'outgoing',
      });

      // Update task with Wrike ID
      await dal.tasks.update(task.id, organization.id, {
        wrikeTaskId,
        wrikeSyncedAt: new Date(),
      });
    } catch (error) {
      console.error('Failed to sync task to Wrike:', error);
      // Continue - task is created locally
    }
  }

  revalidatePath('/dashboard/tasks');
  revalidatePath('/dashboard');

  return { success: true, task };
}

/**
 * Update an existing task
 */
export async function updateTask(input: UpdateTaskInput & { syncToWrike?: boolean }) {
  const { userId, orgId } = await auth();

  if (!userId || !orgId) {
    throw new Error('Unauthorized');
  }

  const organization = await dal.organizations.getByClerkOrgId(orgId);
  if (!organization) {
    throw new Error('Organization not found');
  }

  const { id, syncToWrike, ...updates } = input;
  const validatedUpdates = updateTaskSchema.omit({ id: true }).parse(updates);

  // Update task
  const task = await dal.tasks.update(id, organization.id, validatedUpdates);

  if (!task) {
    throw new Error('Task not found');
  }

  // Sync to Wrike if requested and task has Wrike ID
  if (syncToWrike && task.wrikeTaskId) {
    try {
      await syncTaskToWrike(task, organization.id);

      // Update sync state
      const syncState = await dal.wrikeSyncState.getByTaskId(task.id, organization.id);
      if (syncState) {
        await dal.wrikeSyncState.update(syncState.id, organization.id, {
          lastSyncDirection: 'outgoing',
        });
      }
    } catch (error) {
      console.error('Failed to sync task to Wrike:', error);
    }
  }

  revalidatePath('/dashboard/tasks');
  revalidatePath('/dashboard');

  return { success: true, task };
}

/**
 * Move task between columns (drag and drop)
 */
export async function moveTask(input: MoveTaskInput & { syncToWrike?: boolean }) {
  const { userId, orgId } = await auth();

  if (!userId || !orgId) {
    throw new Error('Unauthorized');
  }

  const organization = await dal.organizations.getByClerkOrgId(orgId);
  if (!organization) {
    throw new Error('Organization not found');
  }

  const { taskId, columnId, position, syncToWrike } = moveTaskSchema.extend({
    syncToWrike: z.boolean().optional(),
  }).parse(input);

  // Update task position
  const task = await dal.tasks.updatePosition(taskId, organization.id, position, columnId);

  if (!task) {
    throw new Error('Task not found');
  }

  // Update status based on column
  const statusMap: Record<string, Task['status']> = {
    'todo': 'todo',
    'in_progress': 'in_progress',
    'review': 'review',
    'done': 'done',
  };

  const newStatus = statusMap[columnId] || task.status;
  if (newStatus !== task.status) {
    await dal.tasks.update(taskId, organization.id, { status: newStatus });
  }

  // Sync to Wrike
  if (syncToWrike && task.wrikeTaskId) {
    try {
      await syncTaskToWrike({ ...task, status: newStatus }, organization.id);
    } catch (error) {
      console.error('Failed to sync task movement to Wrike:', error);
    }
  }

  revalidatePath('/dashboard/tasks');
  revalidatePath('/dashboard');

  return { success: true };
}

/**
 * Delete a task
 */
export async function deleteTask(taskId: string, syncToWrike = false) {
  const { userId, orgId } = await auth();

  if (!userId || !orgId) {
    throw new Error('Unauthorized');
  }

  const organization = await dal.organizations.getByClerkOrgId(orgId);
  if (!organization) {
    throw new Error('Organization not found');
  }

  // Get task to check Wrike ID
  const task = await dal.tasks.getById(taskId, organization.id);

  if (task && syncToWrike && task.wrikeTaskId) {
    try {
      await deleteWrikeTask(task.wrikeTaskId);
    } catch (error) {
      console.error('Failed to delete task from Wrike:', error);
    }
  }

  // Delete task (will cascade to sync state)
  await dal.tasks.delete(taskId, organization.id);

  revalidatePath('/dashboard/tasks');
  revalidatePath('/dashboard');

  return { success: true };
}

/**
 * Get all tasks for the current organization
 */
export async function getOrganizationTasks(projectId?: string) {
  const { userId, orgId } = await auth();

  if (!userId || !orgId) {
    throw new Error('Unauthorized');
  }

  const organization = await dal.organizations.getByClerkOrgId(orgId);
  if (!organization) {
    return { tasks: [] };
  }

  const tasks = projectId
    ? await dal.tasks.getAllByProject(projectId, organization.id)
    : await dal.tasks.getAllByTenant(organization.id);

  return { tasks };
}

/**
 * Get tasks grouped by status for Kanban board
 */
export async function getKanbanTasks(projectId?: string) {
  const { tasks } = await getOrganizationTasks(projectId);

  const grouped = {
    todo: tasks.filter(t => t.status === 'todo'),
    in_progress: tasks.filter(t => t.status === 'in_progress'),
    review: tasks.filter(t => t.status === 'review'),
    done: tasks.filter(t => t.status === 'done'),
  };

  return { grouped };
}
