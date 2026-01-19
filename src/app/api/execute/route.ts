import { auth } from '@clerk/nextjs/server';
import { dal } from '@/lib/db/dal';
import { NextResponse } from 'next/server';
import { z } from 'zod';

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

    // Check if E2B API key is configured
    if (!process.env.E2B_API_KEY) {
      return NextResponse.json(
        { error: 'E2B API key not configured. Please set E2B_API_KEY in environment variables.' },
        { status: 500 }
      );
    }

    // TODO: Update to latest E2B SDK API
    // The E2B Code Interpreter SDK has changed its API
    // For now, return a placeholder response
    return NextResponse.json({
      success: true,
      output: 'Code execution temporarily disabled - E2B SDK update in progress',
      error: undefined,
      logs: ['E2B integration requires SDK update to v1.5+ API'],
      executionTime: 0,
    });

    /* Original E2B code - needs update to new API
    const startTime = Date.now();
    const logs: string[] = [];

    // Create E2B sandbox
    const sandbox = await Sandbox.create({
      apiKey: process.env.E2B_API_KEY,
    });

    try {
      logs.push('Sandbox created successfully');

      // Execute code based on language
      let execution;

      if (data.language === 'python') {
        execution = await sandbox.notebook.execCell(data.code);
      } else if (data.language === 'javascript' || data.language === 'typescript') {
        const jsCode = `
const result = (function() {
  ${data.code}
})();
console.log(result);
        `;
        execution = await sandbox.notebook.execCell(jsCode);
      } else {
        throw new Error(`Unsupported language: ${data.language}`);
      }

      const executionTime = Date.now() - startTime;

      // Process execution results
      const output: string[] = [];
      const errors: string[] = [];

      if (execution.logs.stdout.length > 0) {
        output.push(...execution.logs.stdout);
      }

      if (execution.logs.stderr.length > 0) {
        errors.push(...execution.logs.stderr);
      }

      if (execution.error) {
        errors.push(execution.error.name + ': ' + execution.error.value);
        if (execution.error.traceback) {
          errors.push(execution.error.traceback);
        }
      }

      // Process results
      if (execution.results.length > 0) {
        execution.results.forEach((result: any) => {
          if (result.text) {
            output.push(result.text);
          }
          if (result.data) {
            output.push(JSON.stringify(result.data, null, 2));
          }
        });
      }

      logs.push('Code executed successfully');

      // Log AI usage for cost tracking
      await dal.aiLogs.create({
        tenantId: organization.id,
        projectId: data.projectId,
        userId: userId,
        model: 'e2b-sandbox',
        provider: 'e2b',
        operationType: 'code_execution',
        promptTokens: 0,
        completionTokens: 0,
        totalTokens: 0,
        promptCost: 0,
        completionCost: 0,
        totalCost: 0,
        portkeyTraceId: null,
        metadata: {
          language: data.language,
          executionTime,
          hasError: errors.length > 0,
        },
      });

      return NextResponse.json({
        success: errors.length === 0,
        output: output.join('\n'),
        error: errors.length > 0 ? errors.join('\n') : undefined,
        logs,
        executionTime,
      });
    } finally {
      // Always close the sandbox
      await sandbox.close();
      logs.push('Sandbox closed');
    }
    */
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
