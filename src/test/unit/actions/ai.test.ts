import { describe, it, expect, vi, beforeEach } from 'vitest';

// ---- Mocks ------------------------------------------------------------------

const mockAuth = vi.fn().mockResolvedValue({ userId: 'user_1', orgId: 'org_1' });
vi.mock('@clerk/nextjs/server', () => ({ auth: mockAuth }));

const mockGetByClerkOrgId = vi.fn().mockResolvedValue({ id: 'tenant_1' });
vi.mock('@/lib/db/dal', () => ({
  dal: {
    organizations: { getByClerkOrgId: mockGetByClerkOrgId },
  },
}));

const mockChatCompletion = vi.fn().mockResolvedValue({
  choices: [{ message: { role: 'assistant', content: 'AI response here' } }],
  usage: { prompt_tokens: 5, completion_tokens: 10, total_tokens: 15 },
  model: 'gpt-4o-mini',
});
vi.mock('@/lib/ai/portkey', () => ({ chatCompletion: mockChatCompletion }));

vi.mock('next/cache', () => ({ revalidatePath: vi.fn() }));

// ---- Tests ------------------------------------------------------------------

describe('sendAIMessage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAuth.mockResolvedValue({ userId: 'user_1', orgId: 'org_1' });
    mockGetByClerkOrgId.mockResolvedValue({ id: 'tenant_1' });
    mockChatCompletion.mockResolvedValue({
      choices: [{ message: { role: 'assistant', content: 'AI response here' } }],
      usage: { prompt_tokens: 5, completion_tokens: 10, total_tokens: 15 },
      model: 'gpt-4o-mini',
    });
  });

  it('returns completion content on success', async () => {
    const { sendAIMessage } = await import('@/lib/actions/ai');
    const result = await sendAIMessage({ message: 'Hello AI', model: 'gpt-4o-mini' });
    expect(result.success).toBe(true);
    expect(result.content).toBe('AI response here');
  });

  it('throws when user is not authenticated', async () => {
    mockAuth.mockResolvedValueOnce({ userId: null, orgId: null });
    const { sendAIMessage } = await import('@/lib/actions/ai');
    await expect(sendAIMessage({ message: 'hi', model: 'gpt-4o-mini' })).rejects.toThrow(
      'Unauthorized'
    );
  });

  it('throws when organization not found', async () => {
    mockGetByClerkOrgId.mockResolvedValueOnce(undefined);
    const { sendAIMessage } = await import('@/lib/actions/ai');
    await expect(sendAIMessage({ message: 'hi', model: 'gpt-4o-mini' })).rejects.toThrow(
      'Organization not found'
    );
  });

  it('throws for empty message (Zod validation)', async () => {
    const { sendAIMessage } = await import('@/lib/actions/ai');
    await expect(sendAIMessage({ message: '', model: 'gpt-4o-mini' })).rejects.toThrow();
  });

  it('passes systemPrompt as system message when provided', async () => {
    const { sendAIMessage } = await import('@/lib/actions/ai');
    await sendAIMessage({
      message: 'User question',
      systemPrompt: 'You are a helpful assistant.',
      model: 'gpt-4o-mini',
    });

    const callArg = mockChatCompletion.mock.calls[0][0];
    expect(callArg.messages[0].role).toBe('system');
    expect(callArg.messages[0].content).toBe('You are a helpful assistant.');
    expect(callArg.messages[1].role).toBe('user');
    expect(callArg.messages[1].content).toBe('User question');
  });

  it('passes projectId metadata to chatCompletion', async () => {
    const { sendAIMessage } = await import('@/lib/actions/ai');
    await sendAIMessage({
      message: 'question',
      projectId: '550e8400-e29b-41d4-a716-446655440001',
      model: 'gpt-4o-mini',
    });

    const metaArg = mockChatCompletion.mock.calls[0][1];
    expect(metaArg.projectId).toBe('550e8400-e29b-41d4-a716-446655440001');
    expect(metaArg.tenantId).toBe('tenant_1');
  });

  it('returns usage stats in response', async () => {
    const { sendAIMessage } = await import('@/lib/actions/ai');
    const result = await sendAIMessage({ message: 'Count tokens', model: 'gpt-4o-mini' });
    expect(result.usage.total_tokens).toBe(15);
  });
});
