import { headers } from 'next/headers';
import { Webhook } from 'svix';
import { WebhookEvent } from '@clerk/nextjs/server';
import { db } from '@/lib/db';
import { organizations } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

// Health check endpoint for webhook verification
export async function GET() {
  return new Response(
    JSON.stringify({
      status: 'ok',
      message: 'Clerk webhook endpoint is accessible',
      timestamp: new Date().toISOString(),
    }),
    {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    }
  );
}

export async function POST(req: Request) {
  console.log('[Clerk Webhook] 📥 Received webhook request');

  const WEBHOOK_SECRET = process.env.CLERK_WEBHOOK_SECRET?.trim();

  if (!WEBHOOK_SECRET) {
    console.error('[Clerk Webhook] ❌ CLERK_WEBHOOK_SECRET not configured');
    throw new Error('Please add CLERK_WEBHOOK_SECRET to .env.local');
  }

  // Get the headers
  const headerPayload = await headers();
  const svix_id = headerPayload.get('svix-id');
  const svix_timestamp = headerPayload.get('svix-timestamp');
  const svix_signature = headerPayload.get('svix-signature');

  console.log('[Clerk Webhook] 🔍 Svix Headers:', {
    id: svix_id,
    timestamp: svix_timestamp,
    signature: svix_signature ? '***' : undefined,
  });

  // If there are no headers, error out
  if (!svix_id || !svix_timestamp || !svix_signature) {
    console.error('[Clerk Webhook] ❌ Missing required Svix headers');
    return new Response('Error: Missing svix headers', {
      status: 400,
    });
  }

  // Get the raw body for signature verification
  const body = await req.text();

  // Create a new Svix instance with your secret
  const wh = new Webhook(WEBHOOK_SECRET);

  let evt: WebhookEvent;

  // Verify the payload with the headers
  try {
    evt = wh.verify(body, {
      'svix-id': svix_id,
      'svix-timestamp': svix_timestamp,
      'svix-signature': svix_signature,
    }) as WebhookEvent;
    console.log('[Clerk Webhook] ✅ Signature verified successfully');
  } catch (err) {
    console.error('[Clerk Webhook] ❌ Signature verification failed:', err);
    return new Response('Error: Verification failed', {
      status: 400,
    });
  }

  // Handle the webhook
  const eventType = evt.type;
  console.log('[Clerk Webhook] 📋 Event type:', eventType);

  if (eventType === 'organization.created') {
    const { id, name, slug, created_at } = evt.data;
    console.log('[Clerk Webhook] 🏢 Creating organization:', { id, name, slug });

    // Generate slug from name if not provided
    const finalSlug = slug || name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

    try {
      // Create organization in database
      await db.insert(organizations).values({
        clerkOrgId: id,
        name: name,
        slug: finalSlug,
        createdAt: new Date(created_at),
      });

      console.log('[Clerk Webhook] ✅ Organization created successfully:', {
        clerkOrgId: id,
        name,
        slug: finalSlug,
      });
    } catch (error) {
      console.error('[Clerk Webhook] ❌ Failed to create organization:', error);
      return new Response('Error: Failed to create organization', {
        status: 500,
      });
    }
  }

  if (eventType === 'organization.updated') {
    const { id, name, slug } = evt.data;
    console.log('[Clerk Webhook] 🔄 Updating organization:', { id, name, slug });

    // Generate slug from name if not provided
    const finalSlug = slug || name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

    try {
      // Update organization in database
      await db
        .update(organizations)
        .set({
          name: name,
          slug: finalSlug,
          updatedAt: new Date(),
        })
        .where(eq(organizations.clerkOrgId, id));

      console.log('[Clerk Webhook] ✅ Organization updated successfully:', {
        clerkOrgId: id,
        name,
        slug: finalSlug,
      });
    } catch (error) {
      console.error('[Clerk Webhook] ❌ Failed to update organization:', error);
      return new Response('Error: Failed to update organization', {
        status: 500,
      });
    }
  }

  if (eventType === 'organization.deleted') {
    const { id } = evt.data;
    console.log('[Clerk Webhook] 🗑️ Deleting organization:', { id });

    try {
      // Soft delete or hard delete organization
      // For now, we'll just log it - you may want to implement soft delete
      console.log('[Clerk Webhook] ⚠️ Organization deleted (not removing from DB):', id);

      // Optionally, you could soft delete:
      // await db.update(organizations)
      //   .set({ deletedAt: new Date() })
      //   .where(eq(organizations.clerkOrgId, id));
    } catch (error) {
      console.error('[Clerk Webhook] ❌ Failed to delete organization:', error);
      return new Response('Error: Failed to delete organization', {
        status: 500,
      });
    }
  }

  console.log('[Clerk Webhook] ✅ Webhook processed successfully');
  return new Response('Webhook received', { status: 200 });
}
