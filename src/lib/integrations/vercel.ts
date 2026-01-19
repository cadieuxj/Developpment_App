/**
 * Vercel API Integration
 *
 * Programmatic deployment automation with encrypted environment variables
 */

const VERCEL_API_BASE = 'https://api.vercel.com';

interface VercelProject {
  id: string;
  name: string;
  framework: string;
}

interface VercelDeployment {
  id: string;
  url: string;
  state: 'BUILDING' | 'READY' | 'ERROR' | 'QUEUED' | 'CANCELED';
  readyState: 'READY' | 'QUEUED' | 'BUILDING' | 'ERROR' | 'CANCELED';
}

interface CreateProjectInput {
  name: string;
  framework: string;
  gitRepository: {
    type: 'github';
    repo: string; // owner/repo format
  };
  environmentVariables?: Array<{
    key: string;
    value: string;
    type: 'encrypted' | 'plain';
    target: ('production' | 'preview' | 'development')[];
  }>;
}

/**
 * Create a new Vercel project
 */
export async function createVercelProject(input: CreateProjectInput): Promise<VercelProject> {
  const apiToken = process.env.VERCEL_API_TOKEN;

  if (!apiToken) {
    throw new Error('VERCEL_API_TOKEN not configured');
  }

  const response = await fetch(`${VERCEL_API_BASE}/v9/projects`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(input),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to create Vercel project: ${error}`);
  }

  return await response.json();
}

/**
 * Deploy a project to Vercel
 */
export async function deployToVercel(
  projectId: string,
  gitRef?: string
): Promise<VercelDeployment> {
  const apiToken = process.env.VERCEL_API_TOKEN;

  if (!apiToken) {
    throw new Error('VERCEL_API_TOKEN not configured');
  }

  const response = await fetch(`${VERCEL_API_BASE}/v13/deployments`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      name: projectId,
      gitSource: gitRef ? {
        type: 'github',
        ref: gitRef,
        repoId: projectId,
      } : undefined,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to deploy to Vercel: ${error}`);
  }

  return await response.json();
}

/**
 * Add environment variable to Vercel project
 */
export async function addEnvironmentVariable(
  projectId: string,
  key: string,
  value: string,
  target: ('production' | 'preview' | 'development')[] = ['production', 'preview', 'development'],
  type: 'encrypted' | 'plain' = 'encrypted'
): Promise<void> {
  const apiToken = process.env.VERCEL_API_TOKEN;

  if (!apiToken) {
    throw new Error('VERCEL_API_TOKEN not configured');
  }

  const response = await fetch(`${VERCEL_API_BASE}/v9/projects/${projectId}/env`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      key,
      value,
      type,
      target,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to add environment variable: ${error}`);
  }
}

/**
 * Get deployment status
 */
export async function getDeploymentStatus(deploymentId: string): Promise<VercelDeployment> {
  const apiToken = process.env.VERCEL_API_TOKEN;

  if (!apiToken) {
    throw new Error('VERCEL_API_TOKEN not configured');
  }

  const response = await fetch(`${VERCEL_API_BASE}/v13/deployments/${deploymentId}`, {
    headers: {
      'Authorization': `Bearer ${apiToken}`,
    },
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to get deployment status: ${error}`);
  }

  return await response.json();
}

/**
 * Link GitHub repository to Vercel project
 */
export async function linkGitHubRepo(
  projectId: string,
  repoOwner: string,
  repoName: string
): Promise<void> {
  const apiToken = process.env.VERCEL_API_TOKEN;

  if (!apiToken) {
    throw new Error('VERCEL_API_TOKEN not configured');
  }

  const response = await fetch(`${VERCEL_API_BASE}/v9/projects/${projectId}/link`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      type: 'github',
      repo: `${repoOwner}/${repoName}`,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to link GitHub repo: ${error}`);
  }
}
