import { pgTable, text, timestamp, uuid, jsonb, varchar, integer, boolean, real, pgEnum, index } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

// Enums
export const taskStatusEnum = pgEnum("task_status", ["todo", "in_progress", "review", "done"]);
export const taskPriorityEnum = pgEnum("task_priority", ["low", "medium", "high", "urgent"]);
export const deploymentStatusEnum = pgEnum("deployment_status", ["queued", "building", "deploying", "ready", "error", "canceled"]);
export const fileTypeEnum = pgEnum("file_type", ["file", "folder"]);

// ============================================================================
// ORGANIZATIONS - Tenant Root (synced with Clerk)
// ============================================================================
export const organizations = pgTable("organizations", {
  id: uuid("id").primaryKey().defaultRandom(),
  clerkOrgId: varchar("clerk_org_id", { length: 255 }).unique().notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  slug: varchar("slug", { length: 255 }).unique().notNull(),
  imageUrl: text("image_url"),
  metadata: jsonb("metadata").$type<Record<string, any>>().default({}),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => ({
  clerkOrgIdIdx: index("org_clerk_org_id_idx").on(table.clerkOrgId),
}));

// ============================================================================
// PROJECTS - AI Projects with VFS and Settings
// ============================================================================
export const projects = pgTable("projects", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id").references(() => organizations.id, { onDelete: "cascade" }).notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),

  // VFS State
  vfsState: jsonb("vfs_state").$type<Record<string, any>>().default({}),

  // AI Settings
  aiModel: varchar("ai_model", { length: 100 }).default("gpt-4o-mini"),
  aiTemperature: real("ai_temperature").default(0.7),
  aiMaxTokens: integer("ai_max_tokens").default(4096),
  aiSystemPrompt: text("ai_system_prompt"),

  // GitHub Integration
  githubRepoUrl: text("github_repo_url"),
  githubBranch: varchar("github_branch", { length: 255 }).default("main"),
  githubInstallationId: varchar("github_installation_id", { length: 255 }),

  // Vercel Integration
  vercelProjectId: varchar("vercel_project_id", { length: 255 }),
  vercelDeploymentUrl: text("vercel_deployment_url"),

  // Metadata
  metadata: jsonb("metadata").$type<Record<string, any>>().default({}),
  isArchived: boolean("is_archived").default(false),

  createdBy: varchar("created_by", { length: 255 }).notNull(), // Clerk User ID
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => ({
  tenantIdIdx: index("project_tenant_id_idx").on(table.tenantId),
  githubRepoIdx: index("project_github_repo_idx").on(table.githubRepoUrl),
  vercelProjectIdx: index("project_vercel_project_idx").on(table.vercelProjectId),
}));

// ============================================================================
// FILES - Virtual File System Entries
// ============================================================================
export const files = pgTable("files", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id").references(() => organizations.id, { onDelete: "cascade" }).notNull(),
  projectId: uuid("project_id").references(() => projects.id, { onDelete: "cascade" }).notNull(),

  path: text("path").notNull(), // Full path: /src/app/page.tsx
  name: varchar("name", { length: 255 }).notNull(),
  type: fileTypeEnum("type").notNull().default("file"),

  content: text("content"), // Only for files, null for folders
  language: varchar("language", { length: 50 }), // typescript, javascript, python, etc.

  parentId: uuid("parent_id"), // Self-reference for folder hierarchy

  metadata: jsonb("metadata").$type<Record<string, any>>().default({}),

  createdBy: varchar("created_by", { length: 255 }).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => ({
  tenantIdIdx: index("file_tenant_id_idx").on(table.tenantId),
  projectIdIdx: index("file_project_id_idx").on(table.projectId),
  pathIdx: index("file_path_idx").on(table.path),
  parentIdIdx: index("file_parent_id_idx").on(table.parentId),
}));

// ============================================================================
// TASKS - Kanban Tickets with AI Context
// ============================================================================
export const tasks = pgTable("tasks", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id").references(() => organizations.id, { onDelete: "cascade" }).notNull(),
  projectId: uuid("project_id").references(() => projects.id, { onDelete: "cascade" }),

  title: varchar("title", { length: 500 }).notNull(),
  description: text("description"),

  status: taskStatusEnum("status").notNull().default("todo"),
  priority: taskPriorityEnum("priority").notNull().default("medium"),

  // AI Context (JSONB for agentic workflows)
  aiContext: jsonb("ai_context").$type<{
    codeContext?: string[];
    dependencies?: string[];
    estimatedComplexity?: "low" | "medium" | "high";
    suggestedApproach?: string;
    relatedFiles?: string[];
    [key: string]: any;
  }>().default({}),

  // Kanban Board Position
  columnId: varchar("column_id", { length: 100 }).notNull().default("todo"),
  position: integer("position").notNull().default(0),

  // Assignment
  assignedTo: varchar("assigned_to", { length: 255 }), // Clerk User ID

  // Due Date
  dueDate: timestamp("due_date"),

  // Wrike Integration
  wrikeTaskId: varchar("wrike_task_id", { length: 255 }),
  wrikeSyncedAt: timestamp("wrike_synced_at"),

  metadata: jsonb("metadata").$type<Record<string, any>>().default({}),

  createdBy: varchar("created_by", { length: 255 }).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => ({
  tenantIdIdx: index("task_tenant_id_idx").on(table.tenantId),
  projectIdIdx: index("task_project_id_idx").on(table.projectId),
  statusIdx: index("task_status_idx").on(table.status),
  assignedToIdx: index("task_assigned_to_idx").on(table.assignedTo),
  wrikeTaskIdIdx: index("task_wrike_task_id_idx").on(table.wrikeTaskId),
}));

// ============================================================================
// AI_LOGS - Token Usage, Cost Tracking, and AI Interaction History
// ============================================================================
export const aiLogs = pgTable("ai_logs", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id").references(() => organizations.id, { onDelete: "cascade" }).notNull(),
  projectId: uuid("project_id").references(() => projects.id, { onDelete: "cascade" }),
  taskId: uuid("task_id").references(() => tasks.id, { onDelete: "set null" }),

  // AI Model Details
  model: varchar("model", { length: 100 }).notNull(),
  provider: varchar("provider", { length: 50 }).notNull(), // openai, anthropic, etc.

  // Token Usage
  promptTokens: integer("prompt_tokens").notNull().default(0),
  completionTokens: integer("completion_tokens").notNull().default(0),
  totalTokens: integer("total_tokens").notNull().default(0),

  // Cost Tracking (in USD)
  cost: real("cost").notNull().default(0),

  // Request/Response
  prompt: text("prompt"),
  completion: text("completion"),

  // Metadata
  operation: varchar("operation", { length: 100 }), // code_generation, chat, explanation, etc.
  metadata: jsonb("metadata").$type<Record<string, any>>().default({}),

  // Portkey/Helicone Trace ID
  traceId: varchar("trace_id", { length: 255 }),

  userId: varchar("user_id", { length: 255 }).notNull(), // Clerk User ID
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => ({
  tenantIdIdx: index("ai_log_tenant_id_idx").on(table.tenantId),
  projectIdIdx: index("ai_log_project_id_idx").on(table.projectId),
  taskIdIdx: index("ai_log_task_id_idx").on(table.taskId),
  userIdIdx: index("ai_log_user_id_idx").on(table.userId),
  createdAtIdx: index("ai_log_created_at_idx").on(table.createdAt),
  traceIdIdx: index("ai_log_trace_id_idx").on(table.traceId),
}));

// ============================================================================
// DEPLOYMENTS - Vercel Deployment Tracking
// ============================================================================
export const deployments = pgTable("deployments", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id").references(() => organizations.id, { onDelete: "cascade" }).notNull(),
  projectId: uuid("project_id").references(() => projects.id, { onDelete: "cascade" }).notNull(),

  vercelDeploymentId: varchar("vercel_deployment_id", { length: 255 }).unique(),
  vercelProjectId: varchar("vercel_project_id", { length: 255 }).notNull(),

  url: text("url"),
  status: deploymentStatusEnum("status").notNull().default("queued"),

  // Deployment Details
  branch: varchar("branch", { length: 255 }).default("main"),
  commitSha: varchar("commit_sha", { length: 255 }),
  commitMessage: text("commit_message"),

  // Environment Variables (encrypted reference, not actual values)
  envVarIds: jsonb("env_var_ids").$type<string[]>().default([]),

  // Build Logs
  buildLogs: text("build_logs"),
  errorMessage: text("error_message"),

  metadata: jsonb("metadata").$type<Record<string, any>>().default({}),

  triggeredBy: varchar("triggered_by", { length: 255 }).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => ({
  tenantIdIdx: index("deployment_tenant_id_idx").on(table.tenantId),
  projectIdIdx: index("deployment_project_id_idx").on(table.projectId),
  vercelDeploymentIdIdx: index("deployment_vercel_deployment_id_idx").on(table.vercelDeploymentId),
  statusIdx: index("deployment_status_idx").on(table.status),
}));

// ============================================================================
// WRIKE_SYNC_STATE - Bi-directional Sync Metadata
// ============================================================================
export const wrikeSyncState = pgTable("wrike_sync_state", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id").references(() => organizations.id, { onDelete: "cascade" }).notNull(),
  taskId: uuid("task_id").references(() => tasks.id, { onDelete: "cascade" }).unique().notNull(),

  wrikeTaskId: varchar("wrike_task_id", { length: 255 }).unique().notNull(),
  wrikeFolderId: varchar("wrike_folder_id", { length: 255 }),

  // Sync Status
  lastSyncedAt: timestamp("last_synced_at").defaultNow().notNull(),
  lastSyncDirection: varchar("last_sync_direction", { length: 20 }), // "outgoing" or "incoming"

  // Conflict Resolution
  conflictDetected: boolean("conflict_detected").default(false),
  conflictData: jsonb("conflict_data").$type<Record<string, any>>(),

  metadata: jsonb("metadata").$type<Record<string, any>>().default({}),

  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => ({
  tenantIdIdx: index("wrike_sync_tenant_id_idx").on(table.tenantId),
  taskIdIdx: index("wrike_sync_task_id_idx").on(table.taskId),
  wrikeTaskIdIdx: index("wrike_sync_wrike_task_id_idx").on(table.wrikeTaskId),
}));

// ============================================================================
// RELATIONS
// ============================================================================

// Organizations Relations
export const organizationsRelations = relations(organizations, ({ many }) => ({
  projects: many(projects),
  tasks: many(tasks),
  files: many(files),
  aiLogs: many(aiLogs),
  deployments: many(deployments),
  wrikeSyncStates: many(wrikeSyncState),
}));

// Projects Relations
export const projectsRelations = relations(projects, ({ one, many }) => ({
  organization: one(organizations, {
    fields: [projects.tenantId],
    references: [organizations.id],
  }),
  files: many(files),
  tasks: many(tasks),
  aiLogs: many(aiLogs),
  deployments: many(deployments),
}));

// Files Relations
export const filesRelations = relations(files, ({ one, many }) => ({
  organization: one(organizations, {
    fields: [files.tenantId],
    references: [organizations.id],
  }),
  project: one(projects, {
    fields: [files.projectId],
    references: [projects.id],
  }),
  parent: one(files, {
    fields: [files.parentId],
    references: [files.id],
  }),
  children: many(files),
}));

// Tasks Relations
export const tasksRelations = relations(tasks, ({ one, many }) => ({
  organization: one(organizations, {
    fields: [tasks.tenantId],
    references: [organizations.id],
  }),
  project: one(projects, {
    fields: [tasks.projectId],
    references: [projects.id],
  }),
  aiLogs: many(aiLogs),
  wrikeSyncState: one(wrikeSyncState, {
    fields: [tasks.id],
    references: [wrikeSyncState.taskId],
  }),
}));

// AI Logs Relations
export const aiLogsRelations = relations(aiLogs, ({ one }) => ({
  organization: one(organizations, {
    fields: [aiLogs.tenantId],
    references: [organizations.id],
  }),
  project: one(projects, {
    fields: [aiLogs.projectId],
    references: [projects.id],
  }),
  task: one(tasks, {
    fields: [aiLogs.taskId],
    references: [tasks.id],
  }),
}));

// Deployments Relations
export const deploymentsRelations = relations(deployments, ({ one }) => ({
  organization: one(organizations, {
    fields: [deployments.tenantId],
    references: [organizations.id],
  }),
  project: one(projects, {
    fields: [deployments.projectId],
    references: [projects.id],
  }),
}));

// Wrike Sync State Relations
export const wrikeSyncStateRelations = relations(wrikeSyncState, ({ one }) => ({
  organization: one(organizations, {
    fields: [wrikeSyncState.tenantId],
    references: [organizations.id],
  }),
  task: one(tasks, {
    fields: [wrikeSyncState.taskId],
    references: [tasks.id],
  }),
}));

// ============================================================================
// TYPE EXPORTS
// ============================================================================
export type Organization = typeof organizations.$inferSelect;
export type NewOrganization = typeof organizations.$inferInsert;

export type Project = typeof projects.$inferSelect;
export type NewProject = typeof projects.$inferInsert;

export type File = typeof files.$inferSelect;
export type NewFile = typeof files.$inferInsert;

export type Task = typeof tasks.$inferSelect;
export type NewTask = typeof tasks.$inferInsert;

export type AILog = typeof aiLogs.$inferSelect;
export type NewAILog = typeof aiLogs.$inferInsert;

export type Deployment = typeof deployments.$inferSelect;
export type NewDeployment = typeof deployments.$inferInsert;

export type WrikeSyncState = typeof wrikeSyncState.$inferSelect;
export type NewWrikeSyncState = typeof wrikeSyncState.$inferInsert;
