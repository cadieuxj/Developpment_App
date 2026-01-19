import { auth } from '@clerk/nextjs/server';
import { dal } from '@/lib/db/dal';
import { CodeEditor } from '@/components/editor/code-editor';
import { redirect } from 'next/navigation';

interface EditorPageProps {
  searchParams: Promise<{
    projectId?: string;
  }>;
}

export default async function EditorPage({ searchParams }: EditorPageProps) {
  const { userId, orgId } = await auth();
  const params = await searchParams;

  if (!userId || !orgId) {
    return <div>Unauthorized</div>;
  }

  // Get organization
  const organization = await dal.organizations.getByClerkOrgId(orgId);

  if (!organization) {
    return <div>Organization not found</div>;
  }

  // Get all projects for the organization
  const projects = await dal.projects.getAllByTenant(organization.id);

  // If projectId is provided, get that project and its files
  let selectedProject = null;
  let files = [];

  if (params.projectId) {
    selectedProject = projects.find((p) => p.id === params.projectId);
    if (selectedProject) {
      files = await dal.files.getAllByProject(selectedProject.id);
    }
  }

  // If no project is selected and there are projects, redirect to the first one
  if (!params.projectId && projects.length > 0) {
    redirect(`/dashboard/editor?projectId=${projects[0].id}`);
  }

  return (
    <div className="h-[calc(100vh-4rem)]">
      <CodeEditor
        projects={projects}
        selectedProject={selectedProject}
        initialFiles={files}
        organizationId={organization.id}
      />
    </div>
  );
}
