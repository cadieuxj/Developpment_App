import { auth } from '@clerk/nextjs/server';
import { dal } from '@/lib/db/dal';
import { NextResponse } from 'next/server';
import { z } from 'zod';

// Schema for creating a file
const createFileSchema = z.object({
  projectId: z.string(),
  name: z.string(),
  path: z.string(),
  isDirectory: z.boolean(),
  parentId: z.string().nullable().optional(),
  language: z.string().optional(),
  content: z.string().optional(),
});

// Schema for updating a file
const updateFileSchema = z.object({
  fileId: z.string(),
  content: z.string(),
});

// POST - Create a new file
export async function POST(request: Request) {
  try {
    const { userId, orgId } = await auth();

    if (!userId || !orgId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const organization = await dal.organizations.getByClerkOrgId(orgId);

    if (!organization) {
      return NextResponse.json(
        { error: 'Organization not found' },
        { status: 404 }
      );
    }

    const body = await request.json();
    const data = createFileSchema.parse(body);

    // Verify project belongs to organization
    const project = await dal.projects.getById(data.projectId);

    if (!project || project.tenantId !== organization.id) {
      return NextResponse.json(
        { error: 'Project not found' },
        { status: 404 }
      );
    }

    // Create file
    const file = await dal.files.create({
      projectId: data.projectId,
      name: data.name,
      path: data.path,
      isDirectory: data.isDirectory,
      parentId: data.parentId || null,
      language: data.language || null,
      content: data.content || '',
    });

    return NextResponse.json(file);
  } catch (error) {
    console.error('Failed to create file:', error);
    return NextResponse.json(
      { error: 'Failed to create file' },
      { status: 500 }
    );
  }
}

// PUT - Update file content
export async function PUT(request: Request) {
  try {
    const { userId, orgId } = await auth();

    if (!userId || !orgId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const organization = await dal.organizations.getByClerkOrgId(orgId);

    if (!organization) {
      return NextResponse.json(
        { error: 'Organization not found' },
        { status: 404 }
      );
    }

    const body = await request.json();
    const data = updateFileSchema.parse(body);

    // Get file and verify ownership
    const file = await dal.files.getById(data.fileId);

    if (!file) {
      return NextResponse.json({ error: 'File not found' }, { status: 404 });
    }

    const project = await dal.projects.getById(file.projectId);

    if (!project || project.tenantId !== organization.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // Update file content
    const updatedFile = await dal.files.update(data.fileId, {
      content: data.content,
    });

    return NextResponse.json(updatedFile);
  } catch (error) {
    console.error('Failed to update file:', error);
    return NextResponse.json(
      { error: 'Failed to update file' },
      { status: 500 }
    );
  }
}

// DELETE - Delete a file
export async function DELETE(request: Request) {
  try {
    const { userId, orgId } = await auth();

    if (!userId || !orgId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const organization = await dal.organizations.getByClerkOrgId(orgId);

    if (!organization) {
      return NextResponse.json(
        { error: 'Organization not found' },
        { status: 404 }
      );
    }

    const { searchParams } = new URL(request.url);
    const fileId = searchParams.get('fileId');

    if (!fileId) {
      return NextResponse.json(
        { error: 'File ID is required' },
        { status: 400 }
      );
    }

    // Get file and verify ownership
    const file = await dal.files.getById(fileId);

    if (!file) {
      return NextResponse.json({ error: 'File not found' }, { status: 404 });
    }

    const project = await dal.projects.getById(file.projectId);

    if (!project || project.tenantId !== organization.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // Delete file
    await dal.files.delete(fileId);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to delete file:', error);
    return NextResponse.json(
      { error: 'Failed to delete file' },
      { status: 500 }
    );
  }
}
