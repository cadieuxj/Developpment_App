/**
 * GitHub App Integration
 *
 * Uses GitHub App model (not OAuth) for repository access with least privilege
 */

import { Octokit } from 'octokit';
import { createAppAuth } from '@octokit/auth-app';

/**
 * Create an authenticated Octokit instance for a specific installation
 */
export function createGitHubClient(installationId: string) {
  const appId = process.env.GITHUB_APP_ID;
  const privateKey = process.env.GITHUB_APP_PRIVATE_KEY;

  if (!appId || !privateKey) {
    throw new Error('GitHub App credentials not configured');
  }

  return new Octokit({
    authStrategy: createAppAuth,
    auth: {
      appId,
      privateKey,
      installationId,
    },
  });
}

/**
 * List repositories accessible to the installation
 */
export async function listRepositories(installationId: string) {
  const octokit = createGitHubClient(installationId);

  const { data } = await octokit.rest.apps.listReposAccessibleToInstallation();

  return data.repositories;
}

/**
 * Get repository contents
 */
export async function getRepositoryContents(
  installationId: string,
  owner: string,
  repo: string,
  path: string = ''
) {
  const octokit = createGitHubClient(installationId);

  const { data } = await octokit.rest.repos.getContent({
    owner,
    repo,
    path,
  });

  return data;
}

/**
 * Create or update a file in repository
 */
export async function createOrUpdateFile(
  installationId: string,
  owner: string,
  repo: string,
  path: string,
  content: string,
  message: string,
  sha?: string
) {
  const octokit = createGitHubClient(installationId);

  // Convert content to base64
  const contentBase64 = Buffer.from(content).toString('base64');

  const { data } = await octokit.rest.repos.createOrUpdateFileContents({
    owner,
    repo,
    path,
    message,
    content: contentBase64,
    sha, // Required for updates
  });

  return data;
}

/**
 * Create a new branch
 */
export async function createBranch(
  installationId: string,
  owner: string,
  repo: string,
  branchName: string,
  fromBranch: string = 'main'
) {
  const octokit = createGitHubClient(installationId);

  // Get the SHA of the source branch
  const { data: refData } = await octokit.rest.git.getRef({
    owner,
    repo,
    ref: `heads/${fromBranch}`,
  });

  const sha = refData.object.sha;

  // Create new branch
  const { data } = await octokit.rest.git.createRef({
    owner,
    repo,
    ref: `refs/heads/${branchName}`,
    sha,
  });

  return data;
}

/**
 * Create a pull request
 */
export async function createPullRequest(
  installationId: string,
  owner: string,
  repo: string,
  title: string,
  head: string,
  base: string = 'main',
  body?: string
) {
  const octokit = createGitHubClient(installationId);

  const { data } = await octokit.rest.pulls.create({
    owner,
    repo,
    title,
    head,
    base,
    body,
  });

  return data;
}

/**
 * Commit multiple files at once
 */
export async function commitFiles(
  installationId: string,
  owner: string,
  repo: string,
  branch: string,
  files: Array<{ path: string; content: string }>,
  message: string
) {
  const octokit = createGitHubClient(installationId);

  // Get the current commit SHA
  const { data: refData } = await octokit.rest.git.getRef({
    owner,
    repo,
    ref: `heads/${branch}`,
  });

  const currentCommitSha = refData.object.sha;

  // Get the tree SHA
  const { data: commitData } = await octokit.rest.git.getCommit({
    owner,
    repo,
    commit_sha: currentCommitSha,
  });

  const treeSha = commitData.tree.sha;

  // Create blobs for each file
  const blobs = await Promise.all(
    files.map(async (file) => {
      const { data: blob } = await octokit.rest.git.createBlob({
        owner,
        repo,
        content: Buffer.from(file.content).toString('base64'),
        encoding: 'base64',
      });

      return {
        path: file.path,
        mode: '100644' as const,
        type: 'blob' as const,
        sha: blob.sha,
      };
    })
  );

  // Create new tree
  const { data: newTree } = await octokit.rest.git.createTree({
    owner,
    repo,
    base_tree: treeSha,
    tree: blobs,
  });

  // Create commit
  const { data: newCommit } = await octokit.rest.git.createCommit({
    owner,
    repo,
    message,
    tree: newTree.sha,
    parents: [currentCommitSha],
  });

  // Update reference
  await octokit.rest.git.updateRef({
    owner,
    repo,
    ref: `heads/${branch}`,
    sha: newCommit.sha,
  });

  return newCommit;
}
