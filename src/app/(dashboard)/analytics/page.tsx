import { auth } from '@clerk/nextjs/server';
import { dal } from '@/lib/db/dal';
import { CostChart } from '@/components/analytics/cost-chart';
import { ModelUsageChart } from '@/components/analytics/model-usage-chart';
import { ProjectCostTable } from '@/components/analytics/project-cost-table';
import { DollarSign, Zap, TrendingUp, Activity } from 'lucide-react';

export default async function AnalyticsPage() {
  const { userId, orgId } = await auth();

  if (!userId || !orgId) {
    return <div>Unauthorized</div>;
  }

  // Get organization
  const organization = await dal.organizations.getByClerkOrgId(orgId);

  if (!organization) {
    return <div>Organization not found</div>;
  }

  // Get cost summary for the organization
  const costSummary = await dal.aiLogs.getTenantCostSummary(organization.id);

  // Get cost breakdown by model
  const modelCosts = await dal.aiLogs.getCostByModel(organization.id);

  // Get all projects
  const projects = await dal.projects.getAllByTenant(organization.id);

  // Get cost summary per project
  const projectCosts = await Promise.all(
    projects.map(async (project) => {
      const summary = await dal.aiLogs.getCostSummary(project.id);
      return {
        projectId: project.id,
        projectName: project.name,
        ...summary,
      };
    })
  );

  // Calculate stats
  const stats = {
    totalCost: costSummary.totalCost || 0,
    totalRequests: costSummary.totalRequests || 0,
    totalTokens: costSummary.totalTokens || 0,
    avgCostPerRequest:
      costSummary.totalRequests > 0
        ? (costSummary.totalCost || 0) / costSummary.totalRequests
        : 0,
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Analytics & Cost Tracking</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">
          Monitor AI usage, costs, and performance metrics
        </p>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Total Cost</p>
              <p className="text-2xl font-bold mt-1">
                ${stats.totalCost.toFixed(4)}
              </p>
            </div>
            <div className="bg-green-500 p-3 rounded-lg">
              <DollarSign className="w-6 h-6 text-white" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Total Requests
              </p>
              <p className="text-2xl font-bold mt-1">{stats.totalRequests}</p>
            </div>
            <div className="bg-blue-500 p-3 rounded-lg">
              <Activity className="w-6 h-6 text-white" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Total Tokens
              </p>
              <p className="text-2xl font-bold mt-1">
                {stats.totalTokens.toLocaleString()}
              </p>
            </div>
            <div className="bg-purple-500 p-3 rounded-lg">
              <Zap className="w-6 h-6 text-white" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Avg Cost/Request
              </p>
              <p className="text-2xl font-bold mt-1">
                ${stats.avgCostPerRequest.toFixed(6)}
              </p>
            </div>
            <div className="bg-orange-500 p-3 rounded-lg">
              <TrendingUp className="w-6 h-6 text-white" />
            </div>
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold mb-4">Cost Over Time</h2>
          <CostChart organizationId={organization.id} />
        </div>

        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold mb-4">Model Usage</h2>
          <ModelUsageChart modelCosts={modelCosts} />
        </div>
      </div>

      {/* Project Cost Breakdown */}
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700">
        <h2 className="text-xl font-semibold mb-4">Cost by Project</h2>
        <ProjectCostTable projectCosts={projectCosts} />
      </div>
    </div>
  );
}
