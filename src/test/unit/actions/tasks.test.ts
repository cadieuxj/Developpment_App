import { describe, it, expect, vi, beforeEach } from 'vitest';

// ---- Mocks ------------------------------------------------------------------

const mockAuth = vi.fn().mockResolvedValue({ userId: 'user_1', orgId: 'org_1' });
vi.mock('@clerk/nextjs/server', () => ({ auth: mockAuth }));

const mockTaskCreate = vi.fn().mockResolvedValue({ id: 'task_1', title: 'Test Task' });
const mockTaskGetAll = vi.fn().mockResolvedValue([]);
const mockTaskUpdate = vi.fn().mockResolvedValue({ id: 'task_1' });
const mockTaskDelete = vi.fn().mockResolvedValue(undefined);
const mockGetByClerkOrgId = vi.fn().mockResolvedValue({ id: 'tenant_1' });

vi.mock('@/lib/db/dal', () => ({
  dal: {
    organizations: { getByClerkOrgId: mockGetByClerkOrgId },
    tasks: {
      create: mockTaskCreate,
      getAllByTenant: mockTaskGetAll,
      update: mockTaskUpdate,
      delete: mockTaskDelete,
    },
  },
}));

vi.mock('next/cache', () => ({ revalidatePath: vi.fn() }));

// ---- Tests ------------------------------------------------------------------

describe('createTask', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAuth.mockResolvedValue({ userId: 'user_1', orgId: 'org_1' });
    mockGetByClerkOrgId.mockResolvedValue({ id: 'tenant_1' });
  });

  it('creates a task with valid input', async () => {
    const { createTask } = await import('@/lib/actions/tasks');
    const result = await createTask({ title: 'Build feature', priority: 'medium' });
    expect(result.success).toBe(true);
    expect(mockTaskCreate).toHaveBeenCalledWith(
      expect.objectContaining({ title: 'Build feature', tenantId: 'tenant_1' })
    );
  });

  it('throws when user is not authenticated', async () => {
    mockAuth.mockResolvedValueOnce({ userId: null, orgId: null });
    const { createTask } = await import('@/lib/actions/tasks');
    await expect(createTask({ title: 'Task', priority: 'low' })).rejects.toThrow('Unauthorized');
  });

  it('throws for empty title', async () => {
    const { createTask } = await import('@/lib/actions/tasks');
    await expect(createTask({ title: '', priority: 'low' })).rejects.toThrow();
  });

  it('throws when organization not found', async () => {
    mockGetByClerkOrgId.mockResolvedValueOnce(undefined);
    const { createTask } = await import('@/lib/actions/tasks');
    await expect(createTask({ title: 'Task', priority: 'low' })).rejects.toThrow(
      'Organization not found'
    );
  });
});

describe('getOrganizationTasks', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAuth.mockResolvedValue({ userId: 'user_1', orgId: 'org_1' });
    mockGetByClerkOrgId.mockResolvedValue({ id: 'tenant_1' });
  });

  it('returns tasks for the organization', async () => {
    const tasks = [{ id: 't1', title: 'Task 1' }, { id: 't2', title: 'Task 2' }];
    mockTaskGetAll.mockResolvedValueOnce(tasks);
    const { getOrganizationTasks } = await import('@/lib/actions/tasks');
    const result = await getOrganizationTasks();
    expect(result.tasks).toHaveLength(2);
  });

  it('returns empty tasks when no organization', async () => {
    mockGetByClerkOrgId.mockResolvedValueOnce(undefined);
    const { getOrganizationTasks } = await import('@/lib/actions/tasks');
    const result = await getOrganizationTasks();
    expect(result.tasks).toEqual([]);
  });
});
