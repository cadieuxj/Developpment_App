import { eq, and, desc, asc, sql } from "drizzle-orm";
import { db } from "./index";
import {
  organizations,
  projects,
  files,
  tasks,
  aiLogs,
  deployments,
  wrikeSyncState,
  type Organization,
  type NewOrganization,
  type Project,
  type NewProject,
  type File,
  type NewFile,
  type Task,
  type NewTask,
  type AILog,
  type NewAILog,
  type Deployment,
  type NewDeployment,
  type WrikeSyncState,
  type NewWrikeSyncState,
} from "./schema";

// ============================================================================
// ORGANIZATIONS DAL
// ============================================================================

export const organizationsDal = {
  /**
   * Get organization by ID
   */
  async getById(id: string): Promise<Organization | undefined> {
    const result = await db.select().from(organizations).where(eq(organizations.id, id)).limit(1);
    return result[0];
  },

  /**
   * Get organization by Clerk Organization ID
   */
  async getByClerkOrgId(clerkOrgId: string): Promise<Organization | undefined> {
    const result = await db
      .select()
      .from(organizations)
      .where(eq(organizations.clerkOrgId, clerkOrgId))
      .limit(1);
    return result[0];
  },

  /**
   * Get organization by slug
   */
  async getBySlug(slug: string): Promise<Organization | undefined> {
    const result = await db.select().from(organizations).where(eq(organizations.slug, slug)).limit(1);
    return result[0];
  },

  /**
   * Create a new organization
   */
  async create(data: NewOrganization): Promise<Organization> {
    const result = await db.insert(organizations).values({
      ...data,
      updatedAt: new Date(),
    }).returning();
    return result[0];
  },

  /**
   * Update organization
   */
  async update(id: string, data: Partial<NewOrganization>): Promise<Organization | undefined> {
    const result = await db
      .update(organizations)
      .set({
        ...data,
        updatedAt: new Date(),
      })
      .where(eq(organizations.id, id))
      .returning();
    return result[0];
  },

  /**
   * Delete organization (cascades to all related data)
   */
  async delete(id: string): Promise<void> {
    await db.delete(organizations).where(eq(organizations.id, id));
  },
};

// ============================================================================
// PROJECTS DAL
// ============================================================================

export const projectsDal = {
  /**
   * Get project by ID (with tenant validation)
   */
  async getById(id: string, tenantId: string): Promise<Project | undefined> {
    const result = await db
      .select()
      .from(projects)
      .where(and(eq(projects.id, id), eq(projects.tenantId, tenantId)))
      .limit(1);
    return result[0];
  },

  /**
   * Get all projects for a tenant
   */
  async getAllByTenant(tenantId: string, includeArchived = false): Promise<Project[]> {
    const conditions = includeArchived
      ? eq(projects.tenantId, tenantId)
      : and(eq(projects.tenantId, tenantId), eq(projects.isArchived, false));

    return await db
      .select()
      .from(projects)
      .where(conditions)
      .orderBy(desc(projects.updatedAt));
  },

  /**
   * Create a new project
   */
  async create(data: NewProject): Promise<Project> {
    const result = await db.insert(projects).values({
      ...data,
      updatedAt: new Date(),
    }).returning();
    return result[0];
  },

  /**
   * Update project (with tenant validation)
   */
  async update(id: string, tenantId: string, data: Partial<NewProject>): Promise<Project | undefined> {
    const result = await db
      .update(projects)
      .set({
        ...data,
        updatedAt: new Date(),
      })
      .where(and(eq(projects.id, id), eq(projects.tenantId, tenantId)))
      .returning();
    return result[0];
  },

  /**
   * Archive project (soft delete)
   */
  async archive(id: string, tenantId: string): Promise<Project | undefined> {
    return await this.update(id, tenantId, { isArchived: true });
  },

  /**
   * Delete project permanently
   */
  async delete(id: string, tenantId: string): Promise<void> {
    await db.delete(projects).where(and(eq(projects.id, id), eq(projects.tenantId, tenantId)));
  },

  /**
   * Get project with all related data
   */
  async getWithRelations(id: string, tenantId: string) {
    const project = await this.getById(id, tenantId);
    if (!project) return undefined;

    const [projectFiles, projectTasks, projectDeployments] = await Promise.all([
      filesDal.getAllByProject(id, tenantId),
      tasksDal.getAllByProject(id, tenantId),
      deploymentsDal.getAllByProject(id, tenantId, 10),
    ]);

    return {
      ...project,
      files: projectFiles,
      tasks: projectTasks,
      deployments: projectDeployments,
    };
  },
};

// ============================================================================
// FILES DAL
// ============================================================================

export const filesDal = {
  /**
   * Get file by ID (with tenant validation)
   */
  async getById(id: string, tenantId: string): Promise<File | undefined> {
    const result = await db
      .select()
      .from(files)
      .where(and(eq(files.id, id), eq(files.tenantId, tenantId)))
      .limit(1);
    return result[0];
  },

  /**
   * Get file by path in a project
   */
  async getByPath(path: string, projectId: string, tenantId: string): Promise<File | undefined> {
    const result = await db
      .select()
      .from(files)
      .where(and(eq(files.path, path), eq(files.projectId, projectId), eq(files.tenantId, tenantId)))
      .limit(1);
    return result[0];
  },

  /**
   * Get all files for a project
   */
  async getAllByProject(projectId: string, tenantId: string): Promise<File[]> {
    return await db
      .select()
      .from(files)
      .where(and(eq(files.projectId, projectId), eq(files.tenantId, tenantId)))
      .orderBy(asc(files.path));
  },

  /**
   * Get files in a folder
   */
  async getByParent(parentId: string, tenantId: string): Promise<File[]> {
    return await db
      .select()
      .from(files)
      .where(and(eq(files.parentId, parentId), eq(files.tenantId, tenantId)))
      .orderBy(asc(files.name));
  },

  /**
   * Create a new file or folder
   */
  async create(data: NewFile): Promise<File> {
    const result = await db.insert(files).values({
      ...data,
      updatedAt: new Date(),
    }).returning();
    return result[0];
  },

  /**
   * Update file content or metadata
   */
  async update(id: string, tenantId: string, data: Partial<NewFile>): Promise<File | undefined> {
    const result = await db
      .update(files)
      .set({
        ...data,
        updatedAt: new Date(),
      })
      .where(and(eq(files.id, id), eq(files.tenantId, tenantId)))
      .returning();
    return result[0];
  },

  /**
   * Delete file or folder
   */
  async delete(id: string, tenantId: string): Promise<void> {
    await db.delete(files).where(and(eq(files.id, id), eq(files.tenantId, tenantId)));
  },

  /**
   * Get file tree for a project
   */
  async getTree(projectId: string, tenantId: string): Promise<File[]> {
    const allFiles = await this.getAllByProject(projectId, tenantId);

    // Build a tree structure
    const fileMap = new Map<string, File & { children?: File[] }>();
    const rootFiles: File[] = [];

    allFiles.forEach(file => {
      fileMap.set(file.id, { ...file, children: [] });
    });

    allFiles.forEach(file => {
      if (file.parentId) {
        const parent = fileMap.get(file.parentId);
        if (parent) {
          parent.children?.push(fileMap.get(file.id)!);
        }
      } else {
        rootFiles.push(fileMap.get(file.id)!);
      }
    });

    return rootFiles;
  },
};

// ============================================================================
// TASKS DAL
// ============================================================================

export const tasksDal = {
  /**
   * Get task by ID (with tenant validation)
   */
  async getById(id: string, tenantId: string): Promise<Task | undefined> {
    const result = await db
      .select()
      .from(tasks)
      .where(and(eq(tasks.id, id), eq(tasks.tenantId, tenantId)))
      .limit(1);
    return result[0];
  },

  /**
   * Get all tasks for a tenant
   */
  async getAllByTenant(tenantId: string): Promise<Task[]> {
    return await db
      .select()
      .from(tasks)
      .where(eq(tasks.tenantId, tenantId))
      .orderBy(asc(tasks.position));
  },

  /**
   * Get all tasks for a project
   */
  async getAllByProject(projectId: string, tenantId: string): Promise<Task[]> {
    return await db
      .select()
      .from(tasks)
      .where(and(eq(tasks.projectId, projectId), eq(tasks.tenantId, tenantId)))
      .orderBy(asc(tasks.position));
  },

  /**
   * Get tasks by status
   */
  async getByStatus(status: Task["status"], tenantId: string): Promise<Task[]> {
    return await db
      .select()
      .from(tasks)
      .where(and(eq(tasks.status, status), eq(tasks.tenantId, tenantId)))
      .orderBy(asc(tasks.position));
  },

  /**
   * Get tasks assigned to a user
   */
  async getByAssignee(assignedTo: string, tenantId: string): Promise<Task[]> {
    return await db
      .select()
      .from(tasks)
      .where(and(eq(tasks.assignedTo, assignedTo), eq(tasks.tenantId, tenantId)))
      .orderBy(desc(tasks.updatedAt));
  },

  /**
   * Create a new task
   */
  async create(data: NewTask): Promise<Task> {
    const result = await db.insert(tasks).values({
      ...data,
      updatedAt: new Date(),
    }).returning();
    return result[0];
  },

  /**
   * Update task
   */
  async update(id: string, tenantId: string, data: Partial<NewTask>): Promise<Task | undefined> {
    const result = await db
      .update(tasks)
      .set({
        ...data,
        updatedAt: new Date(),
      })
      .where(and(eq(tasks.id, id), eq(tasks.tenantId, tenantId)))
      .returning();
    return result[0];
  },

  /**
   * Update task position for drag-and-drop
   */
  async updatePosition(id: string, tenantId: string, position: number, columnId: string): Promise<Task | undefined> {
    return await this.update(id, tenantId, { position, columnId });
  },

  /**
   * Delete task
   */
  async delete(id: string, tenantId: string): Promise<void> {
    await db.delete(tasks).where(and(eq(tasks.id, id), eq(tasks.tenantId, tenantId)));
  },

  /**
   * Get task with Wrike sync state
   */
  async getWithSyncState(id: string, tenantId: string) {
    const task = await this.getById(id, tenantId);
    if (!task) return undefined;

    const syncState = await wrikeSyncStateDal.getByTaskId(task.id, tenantId);

    return {
      ...task,
      wrikeSyncState: syncState,
    };
  },
};

// ============================================================================
// AI_LOGS DAL
// ============================================================================

export const aiLogsDal = {
  /**
   * Get AI log by ID
   */
  async getById(id: string, tenantId: string): Promise<AILog | undefined> {
    const result = await db
      .select()
      .from(aiLogs)
      .where(and(eq(aiLogs.id, id), eq(aiLogs.tenantId, tenantId)))
      .limit(1);
    return result[0];
  },

  /**
   * Get all AI logs for a project
   */
  async getAllByProject(projectId: string, tenantId: string, limit = 100): Promise<AILog[]> {
    return await db
      .select()
      .from(aiLogs)
      .where(and(eq(aiLogs.projectId, projectId), eq(aiLogs.tenantId, tenantId)))
      .orderBy(desc(aiLogs.createdAt))
      .limit(limit);
  },

  /**
   * Get all AI logs for a user
   */
  async getAllByUser(userId: string, tenantId: string, limit = 100): Promise<AILog[]> {
    return await db
      .select()
      .from(aiLogs)
      .where(and(eq(aiLogs.userId, userId), eq(aiLogs.tenantId, tenantId)))
      .orderBy(desc(aiLogs.createdAt))
      .limit(limit);
  },

  /**
   * Create a new AI log entry
   */
  async create(data: NewAILog): Promise<AILog> {
    const result = await db.insert(aiLogs).values(data).returning();
    return result[0];
  },

  /**
   * Get cost summary for a project
   */
  async getCostSummary(projectId: string, tenantId: string) {
    const result = await db
      .select({
        totalCost: sql<number>`COALESCE(SUM(${aiLogs.cost}), 0)`,
        totalTokens: sql<number>`COALESCE(SUM(${aiLogs.totalTokens}), 0)`,
        totalRequests: sql<number>`COUNT(*)`,
        promptTokens: sql<number>`COALESCE(SUM(${aiLogs.promptTokens}), 0)`,
        completionTokens: sql<number>`COALESCE(SUM(${aiLogs.completionTokens}), 0)`,
      })
      .from(aiLogs)
      .where(and(eq(aiLogs.projectId, projectId), eq(aiLogs.tenantId, tenantId)));

    return result[0];
  },

  /**
   * Get cost summary for a tenant
   */
  async getTenantCostSummary(tenantId: string) {
    const result = await db
      .select({
        totalCost: sql<number>`COALESCE(SUM(${aiLogs.cost}), 0)`,
        totalTokens: sql<number>`COALESCE(SUM(${aiLogs.totalTokens}), 0)`,
        totalRequests: sql<number>`COUNT(*)`,
      })
      .from(aiLogs)
      .where(eq(aiLogs.tenantId, tenantId));

    return result[0];
  },

  /**
   * Get cost breakdown by model
   */
  async getCostByModel(tenantId: string) {
    return await db
      .select({
        model: aiLogs.model,
        totalCost: sql<number>`COALESCE(SUM(${aiLogs.cost}), 0)`,
        totalTokens: sql<number>`COALESCE(SUM(${aiLogs.totalTokens}), 0)`,
        totalRequests: sql<number>`COUNT(*)`,
      })
      .from(aiLogs)
      .where(eq(aiLogs.tenantId, tenantId))
      .groupBy(aiLogs.model);
  },

  /**
   * Get all AI logs for a tenant (for the AI Logs viewer page)
   */
  async getAllByTenant(tenantId: string, limit = 200): Promise<AILog[]> {
    return await db
      .select()
      .from(aiLogs)
      .where(eq(aiLogs.tenantId, tenantId))
      .orderBy(desc(aiLogs.createdAt))
      .limit(limit);
  },
};

// ============================================================================
// DEPLOYMENTS DAL
// ============================================================================

export const deploymentsDal = {
  /**
   * Get deployment by ID
   */
  async getById(id: string, tenantId: string): Promise<Deployment | undefined> {
    const result = await db
      .select()
      .from(deployments)
      .where(and(eq(deployments.id, id), eq(deployments.tenantId, tenantId)))
      .limit(1);
    return result[0];
  },

  /**
   * Get deployment by Vercel Deployment ID
   */
  async getByVercelDeploymentId(vercelDeploymentId: string, tenantId: string): Promise<Deployment | undefined> {
    const result = await db
      .select()
      .from(deployments)
      .where(and(eq(deployments.vercelDeploymentId, vercelDeploymentId), eq(deployments.tenantId, tenantId)))
      .limit(1);
    return result[0];
  },

  /**
   * Get all deployments for a project
   */
  async getAllByProject(projectId: string, tenantId: string, limit = 50): Promise<Deployment[]> {
    return await db
      .select()
      .from(deployments)
      .where(and(eq(deployments.projectId, projectId), eq(deployments.tenantId, tenantId)))
      .orderBy(desc(deployments.createdAt))
      .limit(limit);
  },

  /**
   * Create a new deployment
   */
  async create(data: NewDeployment): Promise<Deployment> {
    const result = await db.insert(deployments).values({
      ...data,
      updatedAt: new Date(),
    }).returning();
    return result[0];
  },

  /**
   * Update deployment status
   */
  async update(id: string, tenantId: string, data: Partial<NewDeployment>): Promise<Deployment | undefined> {
    const result = await db
      .update(deployments)
      .set({
        ...data,
        updatedAt: new Date(),
      })
      .where(and(eq(deployments.id, id), eq(deployments.tenantId, tenantId)))
      .returning();
    return result[0];
  },

  /**
   * Get latest deployment for a project
   */
  async getLatest(projectId: string, tenantId: string): Promise<Deployment | undefined> {
    const result = await db
      .select()
      .from(deployments)
      .where(and(eq(deployments.projectId, projectId), eq(deployments.tenantId, tenantId)))
      .orderBy(desc(deployments.createdAt))
      .limit(1);
    return result[0];
  },
};

// ============================================================================
// WRIKE_SYNC_STATE DAL
// ============================================================================

export const wrikeSyncStateDal = {
  /**
   * Get sync state by ID
   */
  async getById(id: string, tenantId: string): Promise<WrikeSyncState | undefined> {
    const result = await db
      .select()
      .from(wrikeSyncState)
      .where(and(eq(wrikeSyncState.id, id), eq(wrikeSyncState.tenantId, tenantId)))
      .limit(1);
    return result[0];
  },

  /**
   * Get sync state by task ID
   */
  async getByTaskId(taskId: string, tenantId: string): Promise<WrikeSyncState | undefined> {
    const result = await db
      .select()
      .from(wrikeSyncState)
      .where(and(eq(wrikeSyncState.taskId, taskId), eq(wrikeSyncState.tenantId, tenantId)))
      .limit(1);
    return result[0];
  },

  /**
   * Get sync state by Wrike task ID
   */
  async getByWrikeTaskId(wrikeTaskId: string, tenantId: string): Promise<WrikeSyncState | undefined> {
    const result = await db
      .select()
      .from(wrikeSyncState)
      .where(and(eq(wrikeSyncState.wrikeTaskId, wrikeTaskId), eq(wrikeSyncState.tenantId, tenantId)))
      .limit(1);
    return result[0];
  },

  /**
   * Create a new sync state
   */
  async create(data: NewWrikeSyncState): Promise<WrikeSyncState> {
    const result = await db.insert(wrikeSyncState).values({
      ...data,
      updatedAt: new Date(),
    }).returning();
    return result[0];
  },

  /**
   * Update sync state
   */
  async update(id: string, tenantId: string, data: Partial<NewWrikeSyncState>): Promise<WrikeSyncState | undefined> {
    const result = await db
      .update(wrikeSyncState)
      .set({
        ...data,
        lastSyncedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(and(eq(wrikeSyncState.id, id), eq(wrikeSyncState.tenantId, tenantId)))
      .returning();
    return result[0];
  },

  /**
   * Delete sync state
   */
  async delete(id: string, tenantId: string): Promise<void> {
    await db.delete(wrikeSyncState).where(and(eq(wrikeSyncState.id, id), eq(wrikeSyncState.tenantId, tenantId)));
  },

  /**
   * Get all conflicts for a tenant
   */
  async getConflicts(tenantId: string): Promise<WrikeSyncState[]> {
    return await db
      .select()
      .from(wrikeSyncState)
      .where(and(eq(wrikeSyncState.tenantId, tenantId), eq(wrikeSyncState.conflictDetected, true)))
      .orderBy(desc(wrikeSyncState.updatedAt));
  },
};

// ============================================================================
// EXPORT ALL DALs
// ============================================================================

export const dal = {
  organizations: organizationsDal,
  projects: projectsDal,
  files: filesDal,
  tasks: tasksDal,
  aiLogs: aiLogsDal,
  deployments: deploymentsDal,
  wrikeSyncState: wrikeSyncStateDal,
};
