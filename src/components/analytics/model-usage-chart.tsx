'use client';

import { useMemo } from 'react';

interface ModelCost {
  model: string;
  totalCost: number;
  totalRequests: number;
  totalTokens: number;
}

interface ModelUsageChartProps {
  modelCosts: ModelCost[];
}

export function ModelUsageChart({ modelCosts }: ModelUsageChartProps) {
  const chartData = useMemo(() => {
    const totalCost = modelCosts.reduce((sum, m) => sum + m.totalCost, 0);
    return modelCosts
      .map((model) => ({
        ...model,
        percentage: totalCost > 0 ? (model.totalCost / totalCost) * 100 : 0,
      }))
      .sort((a, b) => b.totalCost - a.totalCost);
  }, [modelCosts]);

  const colors = [
    'bg-blue-500',
    'bg-purple-500',
    'bg-green-500',
    'bg-orange-500',
    'bg-pink-500',
    'bg-indigo-500',
    'bg-red-500',
    'bg-yellow-500',
  ];

  if (chartData.length === 0) {
    return (
      <div className="h-64 flex items-center justify-center text-gray-500">
        No model usage data available yet
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Pie Chart (Horizontal Bars) */}
      <div className="space-y-3">
        {chartData.map((model, index) => (
          <div key={model.model}>
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-2">
                <div
                  className={`w-3 h-3 rounded-full ${colors[index % colors.length]}`}
                />
                <span className="text-sm font-medium">{model.model}</span>
              </div>
              <span className="text-sm text-gray-600 dark:text-gray-400">
                ${model.totalCost.toFixed(4)}
              </span>
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
              <div
                className={`h-2 rounded-full ${colors[index % colors.length]}`}
                style={{ width: `${model.percentage}%` }}
              />
            </div>
            <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mt-1">
              <span>{model.totalRequests} requests</span>
              <span>{model.totalTokens.toLocaleString()} tokens</span>
            </div>
          </div>
        ))}
      </div>

      {/* Summary */}
      <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <p className="text-sm text-gray-600 dark:text-gray-400">Models</p>
            <p className="text-lg font-bold">{chartData.length}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Total Requests
            </p>
            <p className="text-lg font-bold">
              {chartData.reduce((sum, m) => sum + m.totalRequests, 0)}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Total Tokens
            </p>
            <p className="text-lg font-bold">
              {chartData
                .reduce((sum, m) => sum + m.totalTokens, 0)
                .toLocaleString()}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
