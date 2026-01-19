'use client';

import { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';

interface CostChartProps {
  organizationId: string;
}

interface DataPoint {
  date: string;
  cost: number;
}

export function CostChart({ organizationId }: CostChartProps) {
  const [data, setData] = useState<DataPoint[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const response = await fetch(
          `/api/analytics/cost-history?organizationId=${organizationId}`
        );
        if (response.ok) {
          const result = await response.json();
          setData(result);
        }
      } catch (error) {
        console.error('Failed to fetch cost data:', error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchData();
  }, [organizationId]);

  if (isLoading) {
    return (
      <div className="h-64 flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="h-64 flex items-center justify-center text-gray-500">
        No cost data available yet
      </div>
    );
  }

  // Simple bar chart visualization
  const maxCost = Math.max(...data.map((d) => d.cost));

  return (
    <div className="h-64">
      <div className="h-full flex items-end gap-2">
        {data.map((point, index) => {
          const height = maxCost > 0 ? (point.cost / maxCost) * 100 : 0;
          return (
            <div key={index} className="flex-1 flex flex-col items-center gap-2">
              <div className="w-full flex items-end justify-center h-48">
                <div
                  className="w-full bg-blue-500 rounded-t hover:bg-blue-600 transition-colors relative group"
                  style={{ height: `${height}%`, minHeight: '4px' }}
                >
                  <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-gray-900 text-white text-xs px-2 py-1 rounded whitespace-nowrap">
                    ${point.cost.toFixed(4)}
                  </div>
                </div>
              </div>
              <span className="text-xs text-gray-600 dark:text-gray-400 truncate w-full text-center">
                {new Date(point.date).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                })}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
