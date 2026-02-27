'use server';

import { auth } from '@clerk/nextjs/server';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { dal } from '../db/dal';
import { chatCompletion } from '../ai/portkey';

const sendMessageSchema = z.object({
  message: z.string().min(1, 'Message cannot be empty').max(32000),
  projectId: z.string().uuid().optional(),
  taskId: z.string().uuid().optional(),
  systemPrompt: z.string().max(8000).optional(),
  model: z.string().optional().default('gpt-4o-mini'),
});

export type SendMessageInput = z.infer<typeof sendMessageSchema>;

export async function sendAIMessage(input: SendMessageInput) {
  const { userId, orgId } = await auth();

  if (!userId || !orgId) {
    throw new Error('Unauthorized: User must be signed in to an organization');
  }

  const validated = sendMessageSchema.parse(input);

  const organization = await dal.organizations.getByClerkOrgId(orgId);
  if (!organization) {
    throw new Error('Organization not found');
  }

  const messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }> = [];

  if (validated.systemPrompt) {
    messages.push({ role: 'system', content: validated.systemPrompt });
  }

  messages.push({ role: 'user', content: validated.message });

  const response = await chatCompletion(
    {
      model: validated.model,
      messages,
      temperature: 0.7,
      max_tokens: 4096,
    },
    {
      tenantId: organization.id,
      projectId: validated.projectId,
      taskId: validated.taskId,
      userId,
      operation: 'chat',
    }
  );

  revalidatePath('/dashboard/ai-logs');

  return {
    success: true,
    content: response.choices[0]?.message?.content ?? '',
    usage: response.usage,
    model: response.model,
  };
}
