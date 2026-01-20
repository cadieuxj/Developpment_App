import { db } from '../src/lib/db';
import { organizations } from '../src/lib/db/schema';

/**
 * Manual script to create an organization in the database
 * Run this if you've already created an organization in Clerk but it's not synced to the DB
 *
 * Usage:
 * tsx scripts/create-organization.ts <clerk-org-id> <org-name> [org-slug]
 */

async function createOrganization() {
  const clerkOrgId = process.argv[2];
  const name = process.argv[3];
  const slug = process.argv[4];

  if (!clerkOrgId || !name) {
    console.error('❌ Usage: tsx scripts/create-organization.ts <clerk-org-id> <org-name> [org-slug]');
    console.error('');
    console.error('Example:');
    console.error('  tsx scripts/create-organization.ts org_abc123 "My Organization" my-org');
    process.exit(1);
  }

  // Generate slug from name if not provided
  const finalSlug = slug || name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

  try {
    const result = await db
      .insert(organizations)
      .values({
        clerkOrgId,
        name,
        slug: finalSlug,
        createdAt: new Date(),
      })
      .returning();

    console.log('✅ Organization created successfully!');
    console.log('');
    console.log('Details:');
    console.log('  ID:', result[0].id);
    console.log('  Clerk Org ID:', result[0].clerkOrgId);
    console.log('  Name:', result[0].name);
    console.log('  Slug:', result[0].slug);
    console.log('');
    console.log('You can now access the dashboard!');
  } catch (error: any) {
    if (error.code === '23505') {
      console.error('❌ Organization already exists in the database');
      console.error('');
      console.error('This Clerk organization ID is already linked to a database record.');
    } else {
      console.error('❌ Failed to create organization:', error.message);
    }
    process.exit(1);
  }
}

createOrganization();
