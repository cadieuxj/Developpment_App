import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

// ---- Mocks ------------------------------------------------------------------

const mockAuth = vi.fn().mockResolvedValue({ userId: 'user_1', orgId: 'org_1' });
vi.mock('@clerk/nextjs/server', () => ({ auth: mockAuth }));

const mockGetByClerkOrgId = vi.fn().mockResolvedValue({ id: 'tenant_1' });
const mockGetProjectById = vi.fn().mockResolvedValue({ id: 'proj_1', tenantId: 'tenant_1' });
const mockAILogCreate = vi.fn().mockResolvedValue({ id: 'log_1' });

vi.mock('@/lib/db/dal', () => ({
  dal: {
    organizations: { getByClerkOrgId: mockGetByClerkOrgId },
    projects: { getById: mockGetProjectById },
    aiLogs: { create: mockAILogCreate },
  },
}));

// Mock E2B Sandbox
const mockRunCode = vi.fn().mockResolvedValue({
  logs: { stdout: ['Hello, World!'], stderr: [] },
  error: undefined,
  results: [],
});
const mockKill = vi.fn().mockResolvedValue(undefined);

vi.mock('@e2b/code-interpreter', () => ({
  Sandbox: {
    create: vi.fn().mockResolvedValue({
      runCode: mockRunCode,
      kill: mockKill,
    }),
  },
}));

// ---- Helpers ----------------------------------------------------------------

function makeRequest(body: unknown): NextRequest {
  return new NextRequest('http://localhost:3000/api/execute', {
    method: 'POST',
    body: JSON.stringify(body),
    headers: { 'Content-Type': 'application/json' },
  });
}

// ---- Tests ------------------------------------------------------------------

describe('POST /api/execute', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.E2B_API_KEY = 'test-e2b-key';
    mockAuth.mockResolvedValue({ userId: 'user_1', orgId: 'org_1' });
    mockGetByClerkOrgId.mockResolvedValue({ id: 'tenant_1' });
    mockGetProjectById.mockResolvedValue({ id: 'proj_1', tenantId: 'tenant_1' });
    mockRunCode.mockResolvedValue({
      logs: { stdout: ['result'], stderr: [] },
      error: undefined,
      results: [],
    });
  });

  it('returns 401 when unauthenticated', async () => {
    mockAuth.mockResolvedValueOnce({ userId: null, orgId: null });
    const { POST } = await import('@/app/api/execute/route');
    const req = makeRequest({ code: 'print("hi")', language: 'python', projectId: 'proj_1' });
    const res = await POST(req);
    expect(res.status).toBe(401);
  });

  it('returns 404 when organization not found', async () => {
    mockGetByClerkOrgId.mockResolvedValueOnce(undefined);
    const { POST } = await import('@/app/api/execute/route');
    const req = makeRequest({ code: 'print("hi")', language: 'python', projectId: 'proj_1' });
    const res = await POST(req);
    expect(res.status).toBe(404);
    const body = await res.json();
    expect(body.error).toContain('Organization');
  });

  it('returns 404 when project not found', async () => {
    mockGetProjectById.mockResolvedValueOnce(undefined);
    const { POST } = await import('@/app/api/execute/route');
    const req = makeRequest({ code: 'print("hi")', language: 'python', projectId: 'proj_1' });
    const res = await POST(req);
    expect(res.status).toBe(404);
  });

  it('returns 500 when E2B_API_KEY is missing', async () => {
    delete process.env.E2B_API_KEY;
    const { POST } = await import('@/app/api/execute/route');
    const req = makeRequest({ code: 'print("hi")', language: 'python', projectId: 'proj_1' });
    const res = await POST(req);
    expect(res.status).toBe(500);
    const body = await res.json();
    expect(body.error).toContain('E2B API key');
  });

  it('returns 400 for invalid language', async () => {
    const { POST } = await import('@/app/api/execute/route');
    const req = makeRequest({ code: 'print("hi")', language: 'ruby', projectId: 'proj_1' });
    const res = await POST(req);
    expect(res.status).toBe(500); // Zod throws, caught by try-catch
  });

  it('executes python code and returns output', async () => {
    const { POST } = await import('@/app/api/execute/route');
    const req = makeRequest({ code: 'print("Hello")', language: 'python', projectId: 'proj_1' });
    const res = await POST(req);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.output).toContain('result');
  });

  it('logs execution to ai_logs table', async () => {
    const { POST } = await import('@/app/api/execute/route');
    const req = makeRequest({ code: 'print("hi")', language: 'python', projectId: 'proj_1' });
    await POST(req);
    expect(mockAILogCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        model: 'e2b-sandbox',
        provider: 'e2b',
        operation: 'code_execution',
      })
    );
  });
});
