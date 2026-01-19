'use server';

/**
 * Server Actions for Project Management
 *
 * These are Next.js Server Actions that provide type-safe, server-side
 * mutations for project operations with multi-tenant security.
 */

import { auth } from '@clerk/nextjs/server';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { dal } from '../db/dal';
import type { NewProject } from '../db/schema';

// Validation schema for creating a project
const createProjectSchema = z.object({
  name: z.string().min(1, 'Project name is required').max(255),
  description: z.string().optional(),
  aiModel: z.string().optional(),
  aiTemperature: z.number().min(0).max(2).optional(),
  aiMaxTokens: z.number().min(1).max(128000).optional(),
  aiSystemPrompt: z.string().optional(),
});

export type CreateProjectInput = z.infer<typeof createProjectSchema>;

/**
 * Create a new project in the current organization
 */
export async function createProject(input: CreateProjectInput) {
  // 1. Authenticate and get organization context
  const { userId, orgId } = await auth();

  if (!userId) {
    throw new Error('Unauthorized: User must be signed in');
  }

  if (!orgId) {
    throw new Error('Unauthorized: User must be in an organization');
  }

  // 2. Validate input
  const validatedInput = createProjectSchema.parse(input);

  // 3. Get or create organization in our database
  let organization = await dal.organizations.getByClerkOrgId(orgId);

  if (!organization) {
    // Organization doesn't exist yet, create it
    // In a real app, you'd fetch org details from Clerk
    organization = await dal.organizations.create({
      clerkOrgId: orgId,
      name: 'My Organization', // TODO: Fetch from Clerk
      slug: orgId.toLowerCase(),
    });
  }

  // 4. Create the project
  const project = await dal.projects.create({
    tenantId: organization.id,
    createdBy: userId,
    ...validatedInput,
  } as NewProject);

  // 5. Revalidate the projects page to show the new project
  revalidatePath('/projects');

  return {
    success: true,
    project,
  };
}

/**
 * Get all projects for the current organization
 */
export async function getOrganizationProjects() {
  const { userId, orgId } = await auth();

  if (!userId || !orgId) {
    throw new Error('Unauthorized');
  }

  const organization = await dal.organizations.getByClerkOrgId(orgId);

  if (!organization) {
    return { projects: [] };
  }

  const projects = await dal.projects.getAllByTenant(organization.id);

  return { projects };
}

/**
 * Archive a project
 */
export async function archiveProject(projectId: string) {
  const { userId, orgId } = await auth();

  if (!userId || !orgId) {
    throw new Error('Unauthorized');
  }

  const organization = await dal.organizations.getByClerkOrgId(orgId);

  if (!organization) {
    throw new Error('Organization not found');
  }

  await dal.projects.archive(projectId, organization.id);
  revalidatePath('/projects');

  return { success: true };
}
