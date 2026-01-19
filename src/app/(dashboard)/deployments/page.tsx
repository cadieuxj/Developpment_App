import { auth } from '@clerk/nextjs/server';
import { dal } from '@/lib/db/dal';
import { DeploymentsList } from '@/components/deployments/deployments-list';
import { DeployButton } from '@/components/deployments/deploy-button';
import { Button } from '@/components/ui/button';
import { RefreshCw } from 'lucide-react';
import type { Deployment } from '@/lib/db/schema';

type DeploymentWithProject = Deployment & { projectName: string };

export default async function DeploymentsPage() {
  const { userId, orgId } = await auth();

  if (!userId || !orgId) {
    return <div>Unauthorized</div>;
  }

  // Get organization
  const organization = await dal.organizations.getByClerkOrgId(orgId);

  if (!organization) {
    return <div>Organization not found</div>;
  }

  // Get all projects
  const projects = await dal.projects.getAllByTenant(organization.id);

  // Get all deployments for the organization
  const allDeployments = await Promise.all(
    projects.map(async (project) => {
      const deployments = await dal.deployments.getAllByProject(project.id, organization.id);
      return deployments.map((deployment): DeploymentWithProject => ({
        ...deployment,
        projectName: project.name,
      }));
    })
  );

  const deployments: DeploymentWithProject[] = allDeployments.flat().sort((a, b) => {
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  // Calculate stats
  const stats = {
    total: deployments.length,
    ready: deployments.filter((d) => d.status === 'ready').length,
    building: deployments.filter(
      (d) => d.status === 'building' || d.status === 'deploying'
    ).length,
    failed: deployments.filter((d) => d.status === 'error').length,
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Deployments</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Manage your Vercel deployments with automated CI/CD
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
          <DeployButton projects={projects} />
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
          <p className="text-sm text-gray-600 dark:text-gray-400">Total Deployments</p>
          <p className="text-2xl font-bold mt-1">{stats.total}</p>
        </div>
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-green-200 dark:border-green-700">
          <p className="text-sm text-gray-600 dark:text-gray-400">Ready</p>
          <p className="text-2xl font-bold mt-1 text-green-600">{stats.ready}</p>
        </div>
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-yellow-200 dark:border-yellow-700">
          <p className="text-sm text-gray-600 dark:text-gray-400">Building</p>
          <p className="text-2xl font-bold mt-1 text-yellow-600">{stats.building}</p>
        </div>
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-red-200 dark:border-red-700">
          <p className="text-sm text-gray-600 dark:text-gray-400">Failed</p>
          <p className="text-2xl font-bold mt-1 text-red-600">{stats.failed}</p>
        </div>
      </div>

      {/* Deployments List */}
      <DeploymentsList deployments={deployments} />
    </div>
  );
}
