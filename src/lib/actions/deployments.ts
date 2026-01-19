'use server';

/**
 * Server Actions for Deployment Management
 *
 * Handles programmatic deployments to Vercel with GitHub integration
 */

import { auth } from '@clerk/nextjs/server';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { dal } from '../db/dal';
import { createVercelProject, deployToVercel, addEnvironmentVariable } from '../integrations/vercel';
import type { NewDeployment } from '../db/schema';

const deployProjectSchema = z.object({
  projectId: z.string().uuid(),
  branch: z.string().optional(),
  environmentVariables: z.array(z.object({
    key: z.string(),
    value: z.string(),
  })).optional(),
});

export type DeployProjectInput = z.infer<typeof deployProjectSchema>;

/**
 * Deploy a project to Vercel
 */
export async function deployProject(input: DeployProjectInput) {
  const { userId, orgId } = await auth();

  if (!userId || !orgId) {
    throw new Error('Unauthorized');
  }

  const organization = await dal.organizations.getByClerkOrgId(orgId);
  if (!organization) {
    throw new Error('Organization not found');
  }

  const { projectId, branch, environmentVariables } = deployProjectSchema.parse(input);

  // Get project
  const project = await dal.projects.getById(projectId, organization.id);

  if (!project) {
    throw new Error('Project not found');
  }

  try {
    // Create Vercel project if not exists
    let vercelProjectId = project.vercelProjectId;

    if (!vercelProjectId && project.githubRepoUrl) {
      const repoMatch = project.githubRepoUrl.match(/github\.com\/(.+)/);
      if (repoMatch) {
        const repo = repoMatch[1].replace('.git', '');

        const vercelProject = await createVercelProject({
          name: project.name.toLowerCase().replace(/\s+/g, '-'),
          framework: 'nextjs',
          gitRepository: {
            type: 'github',
            repo,
          },
          environmentVariables: environmentVariables?.map(env => ({
            key: env.key,
            value: env.value,
            type: 'encrypted',
            target: ['production', 'preview', 'development'],
          })),
        });

        vercelProjectId = vercelProject.id;

        // Update project with Vercel ID
        await dal.projects.update(projectId, organization.id, {
          vercelProjectId,
        });
      }
    }

    if (!vercelProjectId) {
      throw new Error('No Vercel project configured');
    }

    // Add environment variables if provided
    if (environmentVariables && environmentVariables.length > 0) {
      await Promise.all(
        environmentVariables.map(env =>
          addEnvironmentVariable(vercelProjectId!, env.key, env.value)
        )
      );
    }

    // Trigger deployment
    const deployment = await deployToVercel(vercelProjectId, branch || project.githubBranch);

    // Record deployment in database
    const deploymentRecord = await dal.deployments.create({
      tenantId: organization.id,
      projectId,
      vercelProjectId,
      vercelDeploymentId: deployment.id,
      url: `https://${deployment.url}`,
      status: deployment.state === 'READY' ? 'ready' : deployment.state === 'BUILDING' ? 'building' : 'queued',
      branch: branch || project.githubBranch || 'main',
      triggeredBy: userId,
    } as NewDeployment);

    revalidatePath(`/projects/${projectId}`);
    revalidatePath('/deployments');

    return {
      success: true,
      deployment: deploymentRecord,
      url: `https://${deployment.url}`,
    };

  } catch (error: any) {
    console.error('Deployment failed:', error);

    // Record failed deployment
    await dal.deployments.create({
      tenantId: organization.id,
      projectId,
      vercelProjectId: project.vercelProjectId || '',
      status: 'error',
      errorMessage: error.message,
      branch: branch || 'main',
      triggeredBy: userId,
    } as NewDeployment);

    throw error;
  }
}

/**
 * Get deployment history for a project
 */
export async function getProjectDeployments(projectId: string, limit = 20) {
  const { userId, orgId } = await auth();

  if (!userId || !orgId) {
    throw new Error('Unauthorized');
  }

  const organization = await dal.organizations.getByClerkOrgId(orgId);
  if (!organization) {
    return { deployments: [] };
  }

  const deployments = await dal.deployments.getAllByProject(projectId, organization.id, limit);

  return { deployments };
}
