import { auth } from '@clerk/nextjs/server';
import { dal } from '@/lib/db/dal';
import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { aiLogs } from '@/lib/db/schema';
import { eq, sql, and, gte } from 'drizzle-orm';

export async function GET(request: Request) {
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

    // Get cost data for the last 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const result = await db
      .select({
        date: sql<string>`DATE(${aiLogs.createdAt})`,
        cost: sql<number>`COALESCE(SUM(${aiLogs.cost}), 0)`,
      })
      .from(aiLogs)
      .where(
        and(
          eq(aiLogs.tenantId, organization.id),
          gte(aiLogs.createdAt, thirtyDaysAgo)
        )
      )
      .groupBy(sql`DATE(${aiLogs.createdAt})`)
      .orderBy(sql`DATE(${aiLogs.createdAt}) ASC`);

    return NextResponse.json(result);
  } catch (error) {
    console.error('Failed to fetch cost history:', error);
    return NextResponse.json(
      { error: 'Failed to fetch cost history' },
      { status: 500 }
    );
  }
}
