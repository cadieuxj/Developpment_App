import { auth } from '@clerk/nextjs/server';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { dal } from '@/lib/db/dal';
import { Button } from '@/components/ui/button';

interface ProjectDetailPageProps {
  params: {
    projectId: string;
  };
}

export default async function ProjectDetailPage({ params }: ProjectDetailPageProps) {
  const { userId, orgId } = await auth();

  if (!userId || !orgId) {
    return <div>Unauthorized</div>;
  }

  const organization = await dal.organizations.getByClerkOrgId(orgId);

  if (!organization) {
    return <div>Organization not found</div>;
  }

  const project = await dal.projects.getWithRelations(params.projectId, organization.id);

  if (!project) {
    notFound();
  }

  const taskCounts = {
    todo: 0,
    in_progress: 0,
    review: 0,
    done: 0,
  };

  for (const task of project.tasks) {
    taskCounts[task.status] += 1;
  }

  const recentTasks = project.tasks.slice(0, 5);
  const recentDeployments = project.deployments.slice(0, 5);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold">{project.name}</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            {project.description || 'No description yet'}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button asChild>
            <Link href={`/dashboard/editor?projectId=${project.id}`}>Open IDE</Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/dashboard/tasks">View Tasks</Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/dashboard/deployments">View Deployments</Link>
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
          <p className="text-sm text-gray-600 dark:text-gray-400">To Do</p>
          <p className="text-2xl font-bold mt-1">{taskCounts.todo}</p>
        </div>
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
          <p className="text-sm text-gray-600 dark:text-gray-400">In Progress</p>
          <p className="text-2xl font-bold mt-1">{taskCounts.in_progress}</p>
        </div>
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
          <p className="text-sm text-gray-600 dark:text-gray-400">Review</p>
          <p className="text-2xl font-bold mt-1">{taskCounts.review}</p>
        </div>
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
          <p className="text-sm text-gray-600 dark:text-gray-400">Done</p>
          <p className="text-2xl font-bold mt-1">{taskCounts.done}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold mb-4">Recent Tasks</h2>
          {recentTasks.length === 0 ? (
            <p className="text-sm text-gray-600 dark:text-gray-400">No tasks yet</p>
          ) : (
            <ul className="space-y-3">
              {recentTasks.map((task) => (
                <li key={task.id} className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">{task.title}</p>
                    <p className="text-xs text-gray-500 capitalize">
                      {task.status.replace('_', ' ')}
                    </p>
                  </div>
                  <span className="text-xs text-gray-500">
                    {new Date(task.createdAt).toLocaleDateString()}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold mb-4">Recent Deployments</h2>
          {recentDeployments.length === 0 ? (
            <p className="text-sm text-gray-600 dark:text-gray-400">No deployments yet</p>
          ) : (
            <ul className="space-y-3">
              {recentDeployments.map((deployment) => (
                <li key={deployment.id} className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">{deployment.status}</p>
                    <p className="text-xs text-gray-500">
                      {deployment.url || 'URL pending'}
                    </p>
                  </div>
                  <span className="text-xs text-gray-500">
                    {new Date(deployment.createdAt).toLocaleDateString()}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
