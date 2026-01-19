'use client';

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, TrendingDown } from 'lucide-react';

interface ProjectCost {
  projectId: string;
  projectName: string;
  totalCost: number;
  totalRequests: number;
  totalTokens: number;
  promptTokens: number;
  completionTokens: number;
}

interface ProjectCostTableProps {
  projectCosts: ProjectCost[];
}

export function ProjectCostTable({ projectCosts }: ProjectCostTableProps) {
  const sortedProjects = [...projectCosts].sort(
    (a, b) => b.totalCost - a.totalCost
  );

  if (sortedProjects.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        No project cost data available yet
      </div>
    );
  }

  const totalCost = sortedProjects.reduce((sum, p) => sum + p.totalCost, 0);

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Project</TableHead>
            <TableHead className="text-right">Requests</TableHead>
            <TableHead className="text-right">Total Tokens</TableHead>
            <TableHead className="text-right">Prompt Tokens</TableHead>
            <TableHead className="text-right">Completion Tokens</TableHead>
            <TableHead className="text-right">Total Cost</TableHead>
            <TableHead className="text-right">% of Total</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sortedProjects.map((project) => {
            const percentage =
              totalCost > 0 ? (project.totalCost / totalCost) * 100 : 0;
            return (
              <TableRow key={project.projectId}>
                <TableCell className="font-medium">
                  {project.projectName}
                </TableCell>
                <TableCell className="text-right">
                  {project.totalRequests}
                </TableCell>
                <TableCell className="text-right">
                  {project.totalTokens.toLocaleString()}
                </TableCell>
                <TableCell className="text-right">
                  {project.promptTokens.toLocaleString()}
                </TableCell>
                <TableCell className="text-right">
                  {project.completionTokens.toLocaleString()}
                </TableCell>
                <TableCell className="text-right font-semibold">
                  ${project.totalCost.toFixed(4)}
                </TableCell>
                <TableCell className="text-right">
                  <Badge
                    variant={percentage > 20 ? 'default' : 'secondary'}
                    className="flex items-center gap-1 w-fit ml-auto"
                  >
                    {percentage > 20 ? (
                      <TrendingUp className="w-3 h-3" />
                    ) : (
                      <TrendingDown className="w-3 h-3" />
                    )}
                    {percentage.toFixed(1)}%
                  </Badge>
                </TableCell>
              </TableRow>
            );
          })}
          {/* Total Row */}
          <TableRow className="font-bold bg-gray-50 dark:bg-gray-800/50">
            <TableCell>Total</TableCell>
            <TableCell className="text-right">
              {sortedProjects.reduce((sum, p) => sum + p.totalRequests, 0)}
            </TableCell>
            <TableCell className="text-right">
              {sortedProjects
                .reduce((sum, p) => sum + p.totalTokens, 0)
                .toLocaleString()}
            </TableCell>
            <TableCell className="text-right">
              {sortedProjects
                .reduce((sum, p) => sum + p.promptTokens, 0)
                .toLocaleString()}
            </TableCell>
            <TableCell className="text-right">
              {sortedProjects
                .reduce((sum, p) => sum + p.completionTokens, 0)
                .toLocaleString()}
            </TableCell>
            <TableCell className="text-right">
              ${totalCost.toFixed(4)}
            </TableCell>
            <TableCell className="text-right">100%</TableCell>
          </TableRow>
        </TableBody>
      </Table>
    </div>
  );
}
