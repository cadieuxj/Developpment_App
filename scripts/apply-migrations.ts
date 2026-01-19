/**
 * Apply database migrations to Supabase
 * This script reads the migration SQL and applies it directly
 */

import { config } from 'dotenv';
import { readFileSync } from 'fs';
import { join } from 'path';
import { neon } from '@neondatabase/serverless';

// Load environment variables
config({ path: join(process.cwd(), '.env') });

async function applyMigrations() {
  const databaseUrl = process.env.DATABASE_URL;

  if (!databaseUrl) {
    throw new Error('DATABASE_URL environment variable is required');
  }

  console.log('Connecting to database...');
  const sql = neon(databaseUrl);

  // Read migration file
  const migrationPath = join(process.cwd(), 'drizzle', '0000_slippery_professor_monster.sql');
  const migrationSQL = readFileSync(migrationPath, 'utf-8');

  console.log('Applying migration...');

  // Split by statement breaker and execute each statement
  const statements = migrationSQL
    .split('--> statement-breakpoint')
    .map(s => s.trim())
    .filter(s => s.length > 0);

  for (let i = 0; i < statements.length; i++) {
    const statement = statements[i];
    console.log(`Executing statement ${i + 1}/${statements.length}...`);

    try {
      await sql(statement);
      console.log(`✓ Statement ${i + 1} executed successfully`);
    } catch (error: any) {
      console.error(`✗ Error executing statement ${i + 1}:`, error.message);
      // Continue with other statements
    }
  }

  console.log('\n✅ Migration complete!');
}

applyMigrations()
  .then(() => {
    console.log('Done!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Migration failed:', error);
    process.exit(1);
  });
