import { auth } from '@clerk/nextjs/server';
import { dal } from '@/lib/db/dal';
import { ProjectsList } from '@/components/projects/projects-list';
import { CreateProjectButton } from '@/components/projects/create-project-button';

export default async function ProjectsPage() {
  const { userId, orgId } = await auth();

  if (!userId || !orgId) {
    return <div>Unauthorized</div>;
  }

  const organization = await dal.organizations.getByClerkOrgId(orgId);

  if (!organization) {
    return <div>Organization not found</div>;
  }

  const projects = await dal.projects.getAllByTenant(organization.id);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Projects</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Manage your AI projects and workspaces
          </p>
        </div>
        <CreateProjectButton />
      </div>

      <ProjectsList projects={projects} />
    </div>
  );
}
