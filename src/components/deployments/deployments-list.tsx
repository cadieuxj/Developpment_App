'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ExternalLink, Clock, CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

import type { Deployment as DeploymentType } from '@/lib/db/schema';

type Deployment = DeploymentType & {
  projectName: string;
};

interface DeploymentsListProps {
  deployments: Deployment[];
}

const statusConfig = {
  queued: {
    label: 'Queued',
    icon: Clock,
    color: 'bg-gray-500',
    textColor: 'text-gray-700',
    borderColor: 'border-gray-200',
  },
  building: {
    label: 'Building',
    icon: Loader2,
    color: 'bg-blue-500',
    textColor: 'text-blue-700',
    borderColor: 'border-blue-200',
  },
  deploying: {
    label: 'Deploying',
    icon: Loader2,
    color: 'bg-yellow-500',
    textColor: 'text-yellow-700',
    borderColor: 'border-yellow-200',
  },
  ready: {
    label: 'Ready',
    icon: CheckCircle,
    color: 'bg-green-500',
    textColor: 'text-green-700',
    borderColor: 'border-green-200',
  },
  error: {
    label: 'Failed',
    icon: XCircle,
    color: 'bg-red-500',
    textColor: 'text-red-700',
    borderColor: 'border-red-200',
  },
  canceled: {
    label: 'Canceled',
    icon: XCircle,
    color: 'bg-gray-500',
    textColor: 'text-gray-700',
    borderColor: 'border-gray-200',
  },
};

export function DeploymentsList({ deployments }: DeploymentsListProps) {
  if (deployments.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-12 text-center">
        <p className="text-gray-600 dark:text-gray-400">No deployments yet</p>
        <p className="text-sm text-gray-500 dark:text-gray-500 mt-2">
          Click "New Deployment" to deploy your first project
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {deployments.map((deployment) => {
        const config = statusConfig[deployment.status];
        const Icon = config.icon;
        const isAnimating =
          deployment.status === 'building' || deployment.status === 'deploying';

        return (
          <div
            key={deployment.id}
            className={cn(
              'bg-white dark:bg-gray-800 rounded-lg border p-4',
              config.borderColor
            )}
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h3 className="font-semibold text-lg">{deployment.projectName}</h3>
                  <Badge
                    variant="outline"
                    className={cn('flex items-center gap-1', config.textColor)}
                  >
                    <Icon
                      className={cn('w-3 h-3', isAnimating && 'animate-spin')}
                    />
                    {config.label}
                  </Badge>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  {deployment.branch && (
                    <div>
                      <span className="text-gray-500 dark:text-gray-400">Branch:</span>
                      <p className="font-mono">{deployment.branch}</p>
                    </div>
                  )}
                  {deployment.commitHash && (
                    <div>
                      <span className="text-gray-500 dark:text-gray-400">Commit:</span>
                      <p className="font-mono truncate">
                        {deployment.commitHash.substring(0, 7)}
                      </p>
                    </div>
                  )}
                  <div>
                    <span className="text-gray-500 dark:text-gray-400">
                      Created:
                    </span>
                    <p>{new Date(deployment.createdAt).toLocaleString()}</p>
                  </div>
                  <div>
                    <span className="text-gray-500 dark:text-gray-400">
                      Updated:
                    </span>
                    <p>{new Date(deployment.updatedAt).toLocaleString()}</p>
                  </div>
                </div>

                {deployment.commitMessage && (
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                    {deployment.commitMessage}
                  </p>
                )}

                {deployment.errorMessage && (
                  <div className="mt-3 p-3 bg-red-50 dark:bg-red-900/10 rounded border border-red-200 dark:border-red-800">
                    <p className="text-sm text-red-700 dark:text-red-400 font-semibold">
                      Error:
                    </p>
                    <p className="text-sm text-red-600 dark:text-red-300 mt-1">
                      {deployment.errorMessage}
                    </p>
                  </div>
                )}
              </div>

              <div className="flex flex-col gap-2 ml-4">
                {deployment.vercelUrl && (
                  <Button variant="outline" size="sm" asChild>
                    <a
                      href={deployment.vercelUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <ExternalLink className="w-4 h-4 mr-2" />
                      Visit
                    </a>
                  </Button>
                )}
                {deployment.buildLogs && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      // TODO: Show build logs modal
                      console.log(deployment.buildLogs);
                    }}
                  >
                    View Logs
                  </Button>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
