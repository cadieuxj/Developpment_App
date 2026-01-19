/**
 * Wrike Webhook Processor
 *
 * Handles incoming webhook events from Wrike to sync updates to our platform
 */

import { dal } from '../db/schema';
import { getWrikeTask, mapWrikeStatusToOurs, mapWrikeImportanceToOurs } from './wrike';
import { revalidatePath } from 'next/cache';

interface WrikeWebhookPayload {
  type: 'TaskCreated' | 'TaskUpdated' | 'TaskDeleted';
  taskId: string;
  eventAuthorId?: string;
  webhookId: string;
}

/**
 * Process incoming webhook from Wrike
 */
export async function processWrikeWebhook(payload: WrikeWebhookPayload) {
  const { type, taskId } = payload;

  console.log(`Processing Wrike webhook: ${type} for task ${taskId}`);

  try {
    // Find the sync state for this Wrike task
    const syncStates = await dal.wrikeSyncState.getByWrikeTaskId(taskId, '*'); // We need tenant ID

    if (!syncStates || syncStates.length === 0) {
      console.log(`No sync state found for Wrike task ${taskId}, skipping`);
      return;
    }

    const syncState = syncStates[0];

    switch (type) {
      case 'TaskUpdated':
        await handleTaskUpdated(syncState.taskId, syncState.tenantId, taskId);
        break;

      case 'TaskDeleted':
        await handleTaskDeleted(syncState.taskId, syncState.tenantId);
        break;

      case 'TaskCreated':
        // For now, we only handle updates to existing tasks
        // New tasks created in Wrike won't auto-create in our system
        console.log('TaskCreated event - not implemented');
        break;
    }

    // Update sync state
    await dal.wrikeSyncState.update(syncState.id, syncState.tenantId, {
      lastSyncDirection: 'incoming',
      lastSyncedAt: new Date(),
    });

    revalidatePath('/tasks');
    revalidatePath('/dashboard');

  } catch (error) {
    console.error('Error processing Wrike webhook:', error);
    throw error;
  }
}

/**
 * Handle TaskUpdated event from Wrike
 */
async function handleTaskUpdated(taskId: string, tenantId: string, wrikeTaskId: string) {
  // Fetch latest task data from Wrike
  const wrikeTask = await getWrikeTask(wrikeTaskId);

  // Update our task with Wrike data
  await dal.tasks.update(taskId, tenantId, {
    title: wrikeTask.title,
    description: wrikeTask.description,
    status: mapWrikeStatusToOurs(wrikeTask.status),
    priority: mapWrikeImportanceToOurs(wrikeTask.importance),
    dueDate: wrikeTask.dates?.due ? new Date(wrikeTask.dates.due) : undefined,
    wrikeSyncedAt: new Date(),
  });

  console.log(`Updated task ${taskId} from Wrike`);
}

/**
 * Handle TaskDeleted event from Wrike
 */
async function handleTaskDeleted(taskId: string, tenantId: string) {
  // Delete our task (or mark as archived)
  await dal.tasks.delete(taskId, tenantId);

  console.log(`Deleted task ${taskId} (deleted in Wrike)`);
}
