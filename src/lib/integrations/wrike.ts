/**
 * Wrike API Integration
 *
 * Handles bi-directional sync between our tasks and Wrike tasks
 */

import type { Task } from '../db/schema';

const WRIKE_API_BASE = 'https://www.wrike.com/api/v4';

interface WrikeTask {
  id: string;
  title: string;
  description?: string;
  status: string;
  importance: string;
  dates?: {
    start?: string;
    due?: string;
  };
  customFields?: Array<{
    id: string;
    value: any;
  }>;
}

/**
 * Sync a task to Wrike (create or update)
 */
export async function syncTaskToWrike(task: Task, tenantId: string): Promise<string> {
  const apiToken = process.env.WRIKE_API_TOKEN;

  if (!apiToken) {
    throw new Error('WRIKE_API_TOKEN not configured');
  }

  // Map our task to Wrike format
  const wrikeTask: Partial<WrikeTask> = {
    title: task.title,
    description: task.description || undefined,
    status: mapStatusToWrike(task.status),
    importance: mapPriorityToWrike(task.priority),
  };

  if (task.dueDate) {
    wrikeTask.dates = {
      due: task.dueDate.toISOString(),
    };
  }

  // If task has Wrike ID, update it; otherwise create new
  if (task.wrikeTaskId) {
    await updateWrikeTask(task.wrikeTaskId, wrikeTask);
    return task.wrikeTaskId;
  } else {
    return await createWrikeTask(wrikeTask);
  }
}

/**
 * Create a new task in Wrike
 */
async function createWrikeTask(taskData: Partial<WrikeTask>): Promise<string> {
  const apiToken = process.env.WRIKE_API_TOKEN;

  const response = await fetch(`${WRIKE_API_BASE}/folders/IEAAAAAAI4AB7N5A/tasks`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(taskData),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to create Wrike task: ${error}`);
  }

  const data = await response.json();
  return data.data[0].id;
}

/**
 * Update an existing task in Wrike
 */
async function updateWrikeTask(taskId: string, taskData: Partial<WrikeTask>): Promise<void> {
  const apiToken = process.env.WRIKE_API_TOKEN;

  const response = await fetch(`${WRIKE_API_BASE}/tasks/${taskId}`, {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${apiToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(taskData),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to update Wrike task: ${error}`);
  }
}

/**
 * Delete a task from Wrike
 */
export async function deleteWrikeTask(taskId: string): Promise<void> {
  const apiToken = process.env.WRIKE_API_TOKEN;

  const response = await fetch(`${WRIKE_API_BASE}/tasks/${taskId}`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${apiToken}`,
    },
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to delete Wrike task: ${error}`);
  }
}

/**
 * Get task from Wrike by ID
 */
export async function getWrikeTask(taskId: string): Promise<WrikeTask> {
  const apiToken = process.env.WRIKE_API_TOKEN;

  const response = await fetch(`${WRIKE_API_BASE}/tasks/${taskId}`, {
    headers: {
      'Authorization': `Bearer ${apiToken}`,
    },
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to get Wrike task: ${error}`);
  }

  const data = await response.json();
  return data.data[0];
}

/**
 * Map our task status to Wrike status
 */
function mapStatusToWrike(status: Task['status']): string {
  const statusMap: Record<Task['status'], string> = {
    'todo': 'Active',
    'in_progress': 'Active',
    'review': 'Active',
    'done': 'Completed',
  };

  return statusMap[status] || 'Active';
}

/**
 * Map our priority to Wrike importance
 */
function mapPriorityToWrike(priority: Task['priority']): string {
  const priorityMap: Record<Task['priority'], string> = {
    'low': 'Low',
    'medium': 'Normal',
    'high': 'High',
    'urgent': 'High',
  };

  return priorityMap[priority] || 'Normal';
}

/**
 * Map Wrike status to our task status
 */
export function mapWrikeStatusToOurs(wrikeStatus: string): Task['status'] {
  const statusMap: Record<string, Task['status']> = {
    'Active': 'in_progress',
    'Completed': 'done',
    'Deferred': 'todo',
    'Cancelled': 'todo',
  };

  return statusMap[wrikeStatus] || 'todo';
}

/**
 * Map Wrike importance to our priority
 */
export function mapWrikeImportanceToOurs(importance: string): Task['priority'] {
  const importanceMap: Record<string, Task['priority']> = {
    'High': 'high',
    'Normal': 'medium',
    'Low': 'low',
  };

  return importanceMap[importance] || 'medium';
}
