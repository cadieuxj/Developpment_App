import { auth } from '@clerk/nextjs/server';
import { dal } from '@/lib/db/dal';
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { Sandbox } from '@e2b/code-interpreter';

const executeSchema = z.object({
  code: z.string(),
  language: z.enum(['python', 'javascript', 'typescript']),
  projectId: z.string(),
});

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
    const data = executeSchema.parse(body);

    // Verify project belongs to organization
    const project = await dal.projects.getById(data.projectId, organization.id);

    if (!project) {
      return NextResponse.json(
        { error: 'Project not found' },
        { status: 404 }
      );
    }

    if (!process.env.E2B_API_KEY) {
      return NextResponse.json(
        { error: 'E2B API key not configured. Please set E2B_API_KEY in environment variables.' },
        { status: 500 }
      );
    }

    const startTime = Date.now();
    const runLogs: string[] = [];
    let sandbox: Sandbox | null = null;

    try {
      sandbox = await Sandbox.create({ apiKey: process.env.E2B_API_KEY });
      runLogs.push('Sandbox created');

      // Wrap JS/TS to ensure output is captured
      const codeToRun =
        data.language === 'javascript' || data.language === 'typescript'
          ? `(async () => {\n${data.code}\n})()`
          : data.code;

      const execution = await sandbox.runCode(codeToRun);

      const executionTime = Date.now() - startTime;
      const output: string[] = [];
      const errors: string[] = [];

      if (execution.logs.stdout.length > 0) output.push(...execution.logs.stdout);
      if (execution.logs.stderr.length > 0) errors.push(...execution.logs.stderr);
      if (execution.error) {
        errors.push(`${execution.error.name}: ${execution.error.value}`);
        if (execution.error.traceback) errors.push(execution.error.traceback);
      }
      for (const result of execution.results) {
        if (result.text) output.push(result.text);
      }

      runLogs.push('Execution complete');

      await dal.aiLogs.create({
        tenantId: organization.id,
        projectId: data.projectId,
        userId,
        model: 'e2b-sandbox',
        provider: 'e2b',
        promptTokens: 0,
        completionTokens: 0,
        totalTokens: 0,
        cost: 0,
        operation: 'code_execution',
        prompt: data.code,
        completion: output.join('\n') || errors.join('\n'),
        metadata: { language: data.language, executionTime, hasError: errors.length > 0 },
      });

      return NextResponse.json({
        success: errors.length === 0,
        output: output.join('\n'),
        error: errors.length > 0 ? errors.join('\n') : undefined,
        logs: runLogs,
        executionTime,
      });
    } finally {
      if (sandbox) await sandbox.kill();
    }
  } catch (error) {
    console.error('Code execution failed:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        logs: [],
      },
      { status: 500 }
    );
  }
}
