import { describe, it, expect, vi, beforeEach } from 'vitest';

// ---- Mocks ------------------------------------------------------------------

const mockAuth = vi.fn().mockResolvedValue({ userId: 'user_1', orgId: 'org_1' });
vi.mock('@clerk/nextjs/server', () => ({ auth: mockAuth }));

const mockCreate = vi.fn().mockResolvedValue({
  id: 'proj_1',
  name: 'Test Project',
  tenantId: 'tenant_1',
});
const mockGetByClerkOrgId = vi.fn().mockResolvedValue({ id: 'tenant_1', name: 'Org' });
const mockGetAllByTenant = vi.fn().mockResolvedValue([]);
const mockArchive = vi.fn().mockResolvedValue(undefined);

vi.mock('@/lib/db/dal', () => ({
  dal: {
    organizations: {
      getByClerkOrgId: mockGetByClerkOrgId,
      create: vi.fn().mockResolvedValue({ id: 'new_org', clerkOrgId: 'org_1', name: 'Org' }),
    },
    projects: {
      create: mockCreate,
      getAllByTenant: mockGetAllByTenant,
      archive: mockArchive,
    },
  },
}));

vi.mock('next/cache', () => ({ revalidatePath: vi.fn() }));

// ---- Tests ------------------------------------------------------------------

describe('createProject', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAuth.mockResolvedValue({ userId: 'user_1', orgId: 'org_1' });
    mockGetByClerkOrgId.mockResolvedValue({ id: 'tenant_1', name: 'Org' });
  });

  it('creates a project with valid input', async () => {
    const { createProject } = await import('@/lib/actions/projects');
    const result = await createProject({ name: 'My Project', description: 'A test' });
    expect(result.success).toBe(true);
    expect(mockCreate).toHaveBeenCalledWith(
      expect.objectContaining({ name: 'My Project', tenantId: 'tenant_1' })
    );
  });

  it('throws when user is not authenticated', async () => {
    mockAuth.mockResolvedValueOnce({ userId: null, orgId: null });
    const { createProject } = await import('@/lib/actions/projects');
    await expect(createProject({ name: 'Test' })).rejects.toThrow('Unauthorized');
  });

  it('throws when user has no organization', async () => {
    mockAuth.mockResolvedValueOnce({ userId: 'user_1', orgId: null });
    const { createProject } = await import('@/lib/actions/projects');
    await expect(createProject({ name: 'Test' })).rejects.toThrow('organization');
  });

  it('throws for empty project name (Zod validation)', async () => {
    const { createProject } = await import('@/lib/actions/projects');
    await expect(createProject({ name: '' })).rejects.toThrow();
  });

  it('throws for name exceeding 255 characters', async () => {
    const { createProject } = await import('@/lib/actions/projects');
    await expect(createProject({ name: 'a'.repeat(256) })).rejects.toThrow();
  });

  it('creates a new org when one does not exist yet', async () => {
    mockGetByClerkOrgId.mockResolvedValueOnce(undefined);
    const { createProject } = await import('@/lib/actions/projects');
    const result = await createProject({ name: 'First Project' });
    expect(result.success).toBe(true);
  });
});

describe('archiveProject', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAuth.mockResolvedValue({ userId: 'user_1', orgId: 'org_1' });
    mockGetByClerkOrgId.mockResolvedValue({ id: 'tenant_1' });
  });

  it('archives a project successfully', async () => {
    const { archiveProject } = await import('@/lib/actions/projects');
    const result = await archiveProject('proj_1');
    expect(result.success).toBe(true);
    expect(mockArchive).toHaveBeenCalledWith('proj_1', 'tenant_1');
  });

  it('throws when user is not authenticated', async () => {
    mockAuth.mockResolvedValueOnce({ userId: null, orgId: null });
    const { archiveProject } = await import('@/lib/actions/projects');
    await expect(archiveProject('proj_1')).rejects.toThrow('Unauthorized');
  });

  it('throws when organization is not found', async () => {
    mockGetByClerkOrgId.mockResolvedValueOnce(undefined);
    const { archiveProject } = await import('@/lib/actions/projects');
    await expect(archiveProject('proj_1')).rejects.toThrow('Organization not found');
  });
});

describe('getOrganizationProjects', () => {
  it('returns empty list when no org exists', async () => {
    mockGetByClerkOrgId.mockResolvedValueOnce(undefined);
    const { getOrganizationProjects } = await import('@/lib/actions/projects');
    const result = await getOrganizationProjects();
    expect(result.projects).toEqual([]);
  });

  it('returns projects for existing org', async () => {
    const projects = [{ id: 'p1', name: 'Project 1' }];
    mockGetAllByTenant.mockResolvedValueOnce(projects);
    const { getOrganizationProjects } = await import('@/lib/actions/projects');
    const result = await getOrganizationProjects();
    expect(result.projects).toHaveLength(1);
  });
});
