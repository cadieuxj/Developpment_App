'use client';

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, Circle, ExternalLink } from 'lucide-react';
import { LucideIcon } from 'lucide-react';

interface Integration {
  id: string;
  name: string;
  description: string;
  icon: LucideIcon;
  connected: boolean;
  status: string;
  features: string[];
  setupUrl: string;
}

interface IntegrationCardProps {
  integration: Integration;
}

export function IntegrationCard({ integration }: IntegrationCardProps) {
  const Icon = integration.icon;

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div
            className={`p-3 rounded-lg ${
              integration.connected
                ? 'bg-green-100 dark:bg-green-900/20'
                : 'bg-gray-100 dark:bg-gray-800'
            }`}
          >
            <Icon
              className={`w-6 h-6 ${
                integration.connected ? 'text-green-600' : 'text-gray-500'
              }`}
            />
          </div>
          <div>
            <h3 className="text-lg font-semibold">{integration.name}</h3>
            <Badge
              variant={integration.connected ? 'default' : 'secondary'}
              className="mt-1"
            >
              {integration.status}
            </Badge>
          </div>
        </div>
      </div>

      <p className="text-gray-600 dark:text-gray-400 mb-4">
        {integration.description}
      </p>

      {/* Features */}
      <div className="space-y-2 mb-6">
        <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">
          Features:
        </p>
        <ul className="space-y-1.5">
          {integration.features.map((feature, index) => (
            <li key={index} className="flex items-start gap-2 text-sm">
              {integration.connected ? (
                <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
              ) : (
                <Circle className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
              )}
              <span className="text-gray-600 dark:text-gray-400">{feature}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Actions */}
      <div className="flex gap-2">
        {integration.connected ? (
          <>
            <Button variant="outline" size="sm" className="flex-1">
              Configure
            </Button>
            <Button variant="ghost" size="sm" className="flex-1">
              Disconnect
            </Button>
          </>
        ) : (
          <Button size="sm" className="w-full">
            <ExternalLink className="w-4 h-4 mr-2" />
            Connect {integration.name}
          </Button>
        )}
      </div>

      {/* Additional Info */}
      {integration.id === 'github' && !integration.connected && (
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-3">
          We use the GitHub App model for secure, scoped repository access
        </p>
      )}
      {integration.id === 'vercel' && !integration.connected && (
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-3">
          Requires a Vercel API token with deployment permissions
        </p>
      )}
      {integration.id === 'wrike' && !integration.connected && (
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-3">
          Set up webhook URL: {process.env.NEXT_PUBLIC_APP_URL || 'https://your-domain.com'}/api/webhooks/wrike
        </p>
      )}
    </div>
  );
}
