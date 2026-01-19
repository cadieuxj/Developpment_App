import { auth } from '@clerk/nextjs/server';
import { dal } from '@/lib/db/dal';
import { IntegrationCard } from '@/components/integrations/integration-card';
import { Github, Cloud, Briefcase, Zap } from 'lucide-react';

export default async function IntegrationsPage() {
  const { userId, orgId } = await auth();

  if (!userId || !orgId) {
    return <div>Unauthorized</div>;
  }

  // Get organization
  const organization = await dal.organizations.getByClerkOrgId(orgId);

  if (!organization) {
    return <div>Organization not found</div>;
  }

  // Get all projects to check integration status
  const projects = await dal.projects.getAllByTenant(organization.id);

  const githubConnected = projects.some((p) => p.githubRepoUrl);
  const vercelConnected = projects.some((p) => p.vercelProjectId);
  const wrikeConnected = projects.some((p) => p.metadata?.wrikeEnabled);

  const integrations = [
    {
      id: 'github',
      name: 'GitHub',
      description:
        'Connect your GitHub repositories for automated deployments and version control',
      icon: Github,
      connected: githubConnected,
      status: githubConnected ? 'Connected' : 'Not Connected',
      features: [
        'Automated repository access via GitHub App',
        'Webhook integration for CI/CD',
        'Branch protection and PR checks',
        'Commit tracking and history',
      ],
      setupUrl: '/dashboard/integrations/github',
    },
    {
      id: 'vercel',
      name: 'Vercel',
      description:
        'Deploy your projects to Vercel with one-click automated deployments',
      icon: Cloud,
      connected: vercelConnected,
      status: vercelConnected ? 'Connected' : 'Not Connected',
      features: [
        'One-click deployments',
        'Automatic environment variable injection',
        'Build logs and error tracking',
        'Custom domain support',
      ],
      setupUrl: '/dashboard/integrations/vercel',
    },
    {
      id: 'wrike',
      name: 'Wrike',
      description:
        'Bi-directional sync with Wrike for seamless project management',
      icon: Briefcase,
      connected: wrikeConnected,
      status: wrikeConnected ? 'Connected' : 'Not Connected',
      features: [
        'Bi-directional task synchronization',
        'Webhook-based real-time updates',
        'Custom field mapping',
        'Conflict resolution',
      ],
      setupUrl: '/dashboard/integrations/wrike',
    },
    {
      id: 'portkey',
      name: 'Portkey AI Gateway',
      description:
        'Unified AI gateway for cost tracking, caching, and request routing',
      icon: Zap,
      connected: !!process.env.PORTKEY_API_KEY,
      status: process.env.PORTKEY_API_KEY ? 'Connected' : 'Not Connected',
      features: [
        'Unified API for multiple AI providers',
        'Automatic cost tracking and analytics',
        'Request caching for optimization',
        'Load balancing and fallbacks',
      ],
      setupUrl: '/dashboard/integrations/portkey',
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Integrations</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">
          Connect external services to enhance your AI-native development workflow
        </p>
      </div>

      {/* Integration Status Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {integrations.map((integration) => (
          <div
            key={integration.id}
            className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700"
          >
            <div className="flex items-center gap-3">
              <div
                className={`p-2 rounded ${
                  integration.connected
                    ? 'bg-green-100 dark:bg-green-900/20'
                    : 'bg-gray-100 dark:bg-gray-800'
                }`}
              >
                <integration.icon
                  className={`w-5 h-5 ${
                    integration.connected ? 'text-green-600' : 'text-gray-500'
                  }`}
                />
              </div>
              <div>
                <p className="font-medium text-sm">{integration.name}</p>
                <p
                  className={`text-xs ${
                    integration.connected ? 'text-green-600' : 'text-gray-500'
                  }`}
                >
                  {integration.status}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Integration Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {integrations.map((integration) => (
          <IntegrationCard key={integration.id} integration={integration} />
        ))}
      </div>

      {/* Documentation */}
      <div className="bg-blue-50 dark:bg-blue-900/10 border border-blue-200 dark:border-blue-800 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-100 mb-2">
          Need Help?
        </h3>
        <p className="text-blue-800 dark:text-blue-200 mb-4">
          Check out our integration documentation to learn how to configure each service
          and maximize your workflow efficiency.
        </p>
        <div className="flex gap-3">
          <a
            href="#"
            className="text-blue-600 dark:text-blue-400 hover:underline text-sm font-medium"
          >
            View Documentation →
          </a>
          <a
            href="#"
            className="text-blue-600 dark:text-blue-400 hover:underline text-sm font-medium"
          >
            Watch Setup Videos →
          </a>
        </div>
      </div>
    </div>
  );
}
