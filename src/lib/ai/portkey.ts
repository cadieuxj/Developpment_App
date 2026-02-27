/**
 * Portkey AI Gateway Integration
 *
 * Unified API for AI providers with caching, cost tracking, and analytics
 */

import { dal } from '../db/dal';

const PORTKEY_API_BASE = 'https://api.portkey.ai/v1';

interface ChatCompletionRequest {
  model: string;
  messages: Array<{
    role: 'system' | 'user' | 'assistant';
    content: string;
  }>;
  temperature?: number;
  max_tokens?: number;
  stream?: boolean;
}

interface ChatCompletionResponse {
  id: string;
  model: string;
  choices: Array<{
    message: {
      role: string;
      content: string;
    };
    finish_reason: string;
  }>;
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

interface AIRequestMetadata {
  tenantId: string;
  projectId?: string;
  taskId?: string;
  userId: string;
  operation?: string;
}

/**
 * Send a chat completion request through Portkey
 */
export async function chatCompletion(
  request: ChatCompletionRequest,
  metadata: AIRequestMetadata
): Promise<ChatCompletionResponse> {
  const apiKey = process.env.PORTKEY_API_KEY;
  const virtualKey = process.env.PORTKEY_VIRTUAL_KEY;

  if (!apiKey || !virtualKey) {
    throw new Error('Portkey credentials not configured');
  }

  const response = await fetch(`${PORTKEY_API_BASE}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-portkey-api-key': apiKey,
      'x-portkey-virtual-key': virtualKey,
      // Metadata for tracking and analytics
      'x-portkey-metadata': JSON.stringify({
        tenant_id: metadata.tenantId,
        project_id: metadata.projectId,
        task_id: metadata.taskId,
        user_id: metadata.userId,
        operation: metadata.operation,
      }),
      // Enable caching for identical requests
      'x-portkey-cache': 'semantic',
      'x-portkey-cache-force-refresh': 'false',
    },
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Portkey API error: ${error}`);
  }

  const data: ChatCompletionResponse = await response.json();

  // Log usage to database (including prompt + completion text)
  await logAIUsage(data, metadata, request.model, request);

  return data;
}

/**
 * Log AI usage to database for cost tracking, including prompt/completion text
 */
async function logAIUsage(
  response: ChatCompletionResponse,
  metadata: AIRequestMetadata,
  model: string,
  request: ChatCompletionRequest
) {
  const { usage } = response;

  // Calculate cost based on model pricing
  const cost = calculateCost(model, usage.prompt_tokens, usage.completion_tokens);

  // Serialize prompt messages and extract completion text
  const promptText = JSON.stringify(request.messages);
  const completionText = response.choices[0]?.message?.content ?? '';

  await dal.aiLogs.create({
    tenantId: metadata.tenantId,
    projectId: metadata.projectId,
    taskId: metadata.taskId,
    userId: metadata.userId,
    model,
    provider: getProviderFromModel(model),
    promptTokens: usage.prompt_tokens,
    completionTokens: usage.completion_tokens,
    totalTokens: usage.total_tokens,
    cost,
    prompt: promptText,
    completion: completionText,
    operation: metadata.operation,
    metadata: {
      request_id: response.id,
    },
    traceId: response.id,
  });
}

/**
 * Calculate cost in USD based on model and token usage
 */
function calculateCost(model: string, promptTokens: number, completionTokens: number): number {
  // Pricing as of Jan 2026 (per 1M tokens)
  const pricing: Record<string, { prompt: number; completion: number }> = {
    'gpt-4o': { prompt: 2.5, completion: 10 },
    'gpt-4o-mini': { prompt: 0.15, completion: 0.6 },
    'gpt-4-turbo': { prompt: 10, completion: 30 },
    'claude-3-5-sonnet': { prompt: 3, completion: 15 },
    'claude-3-5-haiku': { prompt: 0.8, completion: 4 },
    'claude-3-opus': { prompt: 15, completion: 75 },
  };

  const modelPricing = pricing[model] || { prompt: 1, completion: 5 };

  const promptCost = (promptTokens / 1_000_000) * modelPricing.prompt;
  const completionCost = (completionTokens / 1_000_000) * modelPricing.completion;

  return promptCost + completionCost;
}

/**
 * Get provider name from model string
 */
function getProviderFromModel(model: string): string {
  if (model.startsWith('gpt-')) return 'openai';
  if (model.startsWith('claude-')) return 'anthropic';
  if (model.startsWith('gemini-')) return 'google';
  return 'unknown';
}

/**
 * Stream chat completion through Portkey
 */
export async function streamChatCompletion(
  request: ChatCompletionRequest,
  metadata: AIRequestMetadata
): Promise<ReadableStream> {
  const apiKey = process.env.PORTKEY_API_KEY;
  const virtualKey = process.env.PORTKEY_VIRTUAL_KEY;

  if (!apiKey || !virtualKey) {
    throw new Error('Portkey credentials not configured');
  }

  const response = await fetch(`${PORTKEY_API_BASE}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-portkey-api-key': apiKey,
      'x-portkey-virtual-key': virtualKey,
      'x-portkey-metadata': JSON.stringify({
        tenant_id: metadata.tenantId,
        project_id: metadata.projectId,
        user_id: metadata.userId,
      }),
    },
    body: JSON.stringify({
      ...request,
      stream: true,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Portkey API error: ${error}`);
  }

  return response.body!;
}

/**
 * Get AI usage analytics for a project
 */
export async function getProjectAnalytics(projectId: string, tenantId: string) {
  return await dal.aiLogs.getCostSummary(projectId, tenantId);
}

/**
 * Get AI usage analytics for entire tenant
 */
export async function getTenantAnalytics(tenantId: string) {
  const [summary, byModel] = await Promise.all([
    dal.aiLogs.getTenantCostSummary(tenantId),
    dal.aiLogs.getCostByModel(tenantId),
  ]);

  return {
    summary,
    byModel,
  };
}
